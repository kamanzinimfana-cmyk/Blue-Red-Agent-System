import { getSmartCache, setSmartCache, shouldCache } from "./cache.ts";
import { buildProfileContext } from "./brain/profilePrompt.ts";
import { getDirectAnswer } from "./brain/answerOverrides.ts";

const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || "https://ai.studio/build";

interface Message {
  role: string;
  content: string;
}

interface CallAIParams {
  messages: Message[];
  taskType: "survey" | "navigation";
  mode?: "auto" | "openrouter" | "sambanova";
  useCache?: boolean;
  task: string;
}

async function callOpenRouter(messages: Message[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  console.log("🧠 Trying OpenRouter Cloud...");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-OpenRouter-Title": "Blue Red Agent",
    },
    body: JSON.stringify({
      model: "nousresearch/hermes-3-llama-3.1-405b:free",
      messages
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error("Empty OpenRouter response");
  }

  console.log("✅ OpenRouter success");
  return output;
}

async function callSambaNova(messages: Message[], taskType: "survey" | "navigation") {
  if (!SAMBANOVA_API_KEY) {
    throw new Error("SAMBANOVA_API_KEY missing");
  }

  // Use specific models requested by user
  const model = taskType === "navigation" ? "gpt-oss-120b" : "Meta-Llama-3.1-8B-Instruct";
  console.log(`🧠 Trying SambaNova Cloud (${model})...`);
  
  const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SAMBANOVA_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      top_p: 0.1
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SambaNova failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error("Empty SambaNova response");
  }

  console.log("✅ SambaNova success");
  return output;
}

export async function callAI({ messages, taskType, mode = "auto", useCache = true, task }: CallAIParams) {
  // ✅ 1. CHECK DIRECT OVERRIDES (Demographics)
  if (taskType === "survey") {
    const direct = getDirectAnswer(task);
    if (direct) {
      console.log("⚡ Direct profile answer used:", direct);
      return direct;
    }
  }

  // ✅ 2. CHECK SMART CACHE FIRST
  if (useCache && shouldCache(taskType)) {
    const cached = await getSmartCache(messages, task);
    if (cached) {
      return cached;
    }
  }

  // ✅ 3. INJECT PROFILE CONTEXT
  const profileContext = buildProfileContext();
  const enhancedMessages = [
    { role: "system", content: profileContext },
    ...messages
  ];

  let output: string;

  if (mode === "sambanova") {
    output = await callSambaNova(enhancedMessages, taskType);
  } else if (mode === "openrouter") {
    output = await callOpenRouter(enhancedMessages);
  } else {
    // Auto / Failover mode
    if (taskType === "navigation") {
      // Blue Agent Chain: OpenRouter (Hermes 405B) -> SambaNova (GPT-OSS 120B)
      try {
        output = await callOpenRouter(enhancedMessages);
      } catch (err) {
        console.log("⚠️ OpenRouter failed → switching to SambaNova Cloud...", err instanceof Error ? err.message : String(err));
        output = await callSambaNova(enhancedMessages, taskType);
      }
    } else {
      // Red Agent Chain: SambaNova (Llama 3.1 8B)
      // Since user only provided one model for Red, we use it directly
      output = await callSambaNova(enhancedMessages, taskType);
    }
  }

  // ✅ 4. SAVE TO SMART CACHE
  if (useCache && shouldCache(taskType) && output) {
    await setSmartCache(messages, task, output);
  }

  return output;
}
