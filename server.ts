import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { selectModel, runRedAgent, runBlueAgent, runVisionAgent } from "./src/lib/agents.ts";
import { injectProfile } from "./src/lib/memory.ts";
import { LearningEngine } from "./src/lib/learningEngine.ts";
import { ProxyManager } from "./src/lib/proxyManager.ts";
import { isBlocked } from "./src/lib/blockDetector.ts";

import { detectCaptcha } from "./src/lib/captchaDetector.ts";
import { solveRecaptcha, getAllBalances } from "./src/lib/captchaSolver.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const learningEngine = new LearningEngine();
const proxyManager = new ProxyManager();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increase limit for screenshots

  // API Routes
  app.get("/captcha-balances", async (req, res) => {
    try {
      const balances = await getAllBalances();
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/solve-captcha", async (req, res) => {
    try {
      const { siteKey, url } = req.body;
      if (!siteKey || !url) {
        return res.status(400).json({ error: "siteKey and url are required" });
      }
      const token = await solveRecaptcha(siteKey, url);
      res.json({ token });
    } catch (error) {
      console.error("🔥 CAPTCHA Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/agent", async (req, res) => {
    try {
      const { agent, messages, image, url, rotateProxy, aiMode, speedMode } = req.body;

      const task = messages?.[0]?.content || "";
      const dom = messages?.[1]?.content || "";
      const useCache = speedMode !== "accurate";

      // 🤖 CAPTCHA Detection
      if (detectCaptcha(dom)) {
        console.log("🤖 CAPTCHA detected in DOM");
        return res.json({ 
          output: JSON.stringify({ 
            needsCaptcha: true, 
            message: "CAPTCHA detected. Please solve or wait for auto-solver." 
          }) 
        });
      }

      // 🚫 Check if blocked
      if (isBlocked(dom)) {
        console.log("🚫 Block detected in DOM → Rotating Proxy");
        const nextProxy = proxyManager.getNextProxy();
        return res.json({ 
          output: JSON.stringify({ useVision: true, rotatedProxy: nextProxy, message: "Blocked, rotating..." }) 
        });
      }

      // 🧠 Check learned behavior
      if (url && agent === "red" && !rotateProxy) {
        const learned = learningEngine.findBestMatch(url);
        if (learned) {
          console.log("🧠 Using learned behavior for:", url);
          return res.json({
            output: JSON.stringify({ actions: learned.actionSequence, learned: true })
          });
        }
      }

      if (image) {
        const result = await runVisionAgent(messages[0].content, image, aiMode);
        return res.json({ output: JSON.stringify(result) });
      }

      let result;

      if (agent === "red") {
        result = await runRedAgent(task, dom, undefined, aiMode, useCache);
        
        // 🧠 Store successful actions if they exist
        if (url && result.actions && result.actions.length > 0) {
          learningEngine.store(url, result.actions, true);
        }
      } else {
        result = await runBlueAgent(task, dom, aiMode, useCache);
      }

      // Return exact format expected by extension
      res.json({
        output: JSON.stringify(result)
      });

    } catch (error) {
      console.error("🔥 ERROR:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/agent/run", async (req, res) => {
    // Legacy endpoint for compatibility
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, error: "Task is required" });
    }

    try {
      const result = await runRedAgent(task, "No DOM provided");
      res.json({ 
        success: true, 
        result: { response: JSON.stringify(result) }, 
        model: task.toLowerCase().includes("survey") ? "mistral:instruct" : "llama3.2",
        agent: task.toLowerCase().includes("survey") ? "Red Agent" : "Blue Agent"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/profile", (req, res) => {
    res.json({ success: true, profile: injectProfile("") });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
