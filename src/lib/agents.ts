import { USER_PROFILE } from "./userProfile.ts";
import { enhanceSurveyPrompt } from "./surveyEngine.ts";
import { processScreenshot } from "./visionProcessor.ts";

import { callAI } from "./failover.ts";

function detectTaskType(task: string): "survey" | "navigation" {
  const lower = task.toLowerCase();
  if (lower.includes("survey") || lower.includes("question") || lower.includes("form")) {
    return "survey";
  }
  return "navigation";
}

// 🧠 MODEL SWITCH (HYBRID MODE) - Now handled by failover.ts
export function selectModel(task: string) {
  return detectTaskType(task) === "survey" ? "mistral:instruct" : "llama3.2";
}

// 🔴 RED AGENT (ACTIONS)
export async function runRedAgent(task: string, dom: string, imageBase64?: string, mode: "auto" | "openrouter" | "sambanova" = "auto", useCache: boolean = true) {
  const trimmedDOM = dom.substring(0, 2000); // Token trimming for speed
  
  if (trimmedDOM.length < 50 && !imageBase64) {
    return { useVision: true };
  }

  const taskType = detectTaskType(task);
  
  let visionContext = "";
  if (imageBase64) {
    const buffer = Buffer.from(imageBase64.split(",")[1] || imageBase64, 'base64');
    const processedVision = await processScreenshot(buffer);
    visionContext = `\nVISION_DATA:${processedVision}\nUse this to detect buttons not visible in DOM, identify sliders, stars, grids, and understand layout like a human. If DOM fails, rely on vision.`;
  }

  let systemPrompt = `User Profile: ${JSON.stringify(USER_PROFILE)}\n\n`;
  
  if (taskType === "survey") {
    systemPrompt += enhanceSurveyPrompt(trimmedDOM);
  } else {
    systemPrompt += `Task: ${task}\nDOM: ${trimmedDOM}`;
  }

  systemPrompt += visionContext;

  const output = await callAI({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: task }
    ],
    taskType,
    mode,
    useCache,
    task
  });

  try {
    return JSON.parse(output);
  } catch {
    return { useVision: true, raw: output };
  }
}

// 👁️ VISION AGENT (FALLBACK)
export async function runVisionAgent(task: string, imageBase64: string, mode: "auto" | "openrouter" | "sambanova" = "auto") {
  console.log("Vision Agent processing task:", task);
  
  const buffer = Buffer.from(imageBase64.split(",")[1] || imageBase64, 'base64');
  const processedVision = await processScreenshot(buffer);
  
  // In a real implementation, we'd send this to a vision-capable model
  // For now, we'll return a placeholder that triggers a generic action
  return {
    actions: [
      { type: "click", text: "Next" }
    ],
    visionProcessed: true
  };
}

// 🔵 BLUE AGENT (NAVIGATION)
export async function runBlueAgent(task: string, dom: string, mode: "auto" | "openrouter" | "sambanova" = "auto", useCache: boolean = true) {
  const trimmedDOM = dom.substring(0, 2000);
  const taskType = detectTaskType(task);

  const systemPrompt = `
You are a navigation AI.

Decide next step:
- navigate
- action
- done

Return JSON:
{
  "decision": "action",
  "reason": "why"
}

DOM:
${trimmedDOM}
Task:
${task}
`;

  const output = await callAI({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: task }
    ],
    taskType,
    mode,
    useCache,
    task
  });

  try {
    return JSON.parse(output);
  } catch {
    return { decision: "action", raw: output };
  }
}