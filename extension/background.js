let isRunning = false;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

  if (msg.type === "START_TASK") {
    isRunning = true;

    const { task, settings } = msg;

    runAgentLoop(task, settings);
  }

  if (msg.type === "STOP_TASK") {
    isRunning = false;
  }
});

async function captureScreenshot() {
  return await chrome.tabs.captureVisibleTab(null, {
    format: "png"
  });
}

async function runAgentLoop(task, settings) {

  while (isRunning) {

    try {
      // Get DOM from active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) break;

      const dom = await chrome.tabs.sendMessage(tab.id, { type: "GET_DOM" });
      
      const { aiMode, speedMode, stealthEnabled } = settings;

      // 🕵️ STEALTH DELAY
      if (stealthEnabled) {
        const delay = Math.random() * 2000 + 1000;
        console.log(`🕵️ Stealth: Waiting ${delay.toFixed(0)}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }

      // 🔴 Call backend
      let response;
      try {
        response = await fetch("http://localhost:3000/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            agent: "red",
            url: tab.url, // Pass URL for learning engine
            aiMode,
            speedMode,
            messages: [
              { role: "user", content: task },
              { role: "system", content: dom }
            ]
          })
        });
      } catch (e) {
        // 👁️ FALLBACK TO VISION IF SERVER FAILS OR DOM IS WEIRD
        const image = await captureScreenshot();
        response = await fetch("http://localhost:3000/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: "vision",
            image,
            url: tab.url,
            aiMode,
            speedMode,
            messages: [
              { role: "user", content: task }
            ]
          })
        });
      }

      const data = await response.json();
      let parsed;

      try {
        parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
      } catch (e) {
        parsed = {};
      }

      // 🤖 CAPTCHA Handling
      if (parsed.needsCaptcha) {
        console.log("🤖 CAPTCHA detected! Attempting to solve...");
        const captchaInfo = await chrome.tabs.sendMessage(tab.id, { type: "GET_CAPTCHA_INFO" });
        
        if (captchaInfo && captchaInfo.siteKey) {
          try {
            const solveRes = await fetch("http://localhost:3000/solve-captcha", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                siteKey: captchaInfo.siteKey,
                url: tab.url
              })
            });
            const solveData = await solveRes.json();
            if (solveData.token) {
              await chrome.tabs.sendMessage(tab.id, { 
                type: "INJECT_CAPTCHA", 
                token: solveData.token 
              });
              console.log("✅ CAPTCHA solved and injected!");
              // Wait a bit for the page to react
              await sleep(3000);
              continue; // Re-run loop to get new DOM
            }
          } catch (e) {
            console.error("Failed to solve CAPTCHA automatically:", e);
          }
        } else {
          console.log("⚠️ Could not find siteKey for CAPTCHA. Waiting for human input.");
          await sleep(5000);
          continue;
        }
      }

      // 🚫 Block Detection
      if (dom && (
        dom.includes("Access Denied") || 
        dom.includes("Verify you are human") || 
        dom.includes("CAPTCHA") || 
        dom.includes("blocked")
      )) {
        console.log("🚫 Block detected! Requesting proxy rotation...");
        // In a real extension, you'd use chrome.proxy.settings here
        // For now, we signal the backend to rotate for the next call
        parsed.rotateProxy = true;
      }

      // 👁️ If agent requests vision explicitly
      if (parsed.useVision || parsed.rotateProxy) {
        const image = await captureScreenshot();
        const visionRes = await fetch("http://localhost:3000/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: "vision",
            image,
            messages: [{ role: "user", content: task }]
          })
        });
        const visionData = await visionRes.json();
        parsed = JSON.parse(visionData.output);
      }

      const actions = parsed.actions || [];

      // Send actions to content script
      if (actions.length > 0) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "EXECUTE_ACTIONS",
          actions
        });
      }

    } catch (error) {
      console.error("Agent loop error:", error);
    }

    await sleep(2000);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
