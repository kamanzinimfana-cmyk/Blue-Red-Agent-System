const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || "https://ai.studio/build";

export async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY missing, falling back to dummy embedding");
    return new Array(1024).fill(0); // Dummy vector
  }

  try {
    console.log("🧠 Generating cloud embedding via OpenRouter...");
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-OpenRouter-Title": "Blue Red Agent",
      },
      body: JSON.stringify({
        model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
        input: [
          {
            content: [
              { type: "text", text }
            ]
          }
        ],
        encoding_format: "float"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter embedding failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating cloud embedding:", error);
    throw error;
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}
