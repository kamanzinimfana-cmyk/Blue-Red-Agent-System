import { getEmbedding, cosineSimilarity } from "./embeddings.ts";

interface CacheItem {
  value: string;
  expiry: number;
  embedding: number[];
  task: string;
}

const cache = new Map<string, CacheItem>();
const TTL = 1000 * 60 * 15; // 15 minutes for smart cache
const SIMILARITY_THRESHOLD = 0.95;

export async function getSmartCache(messages: any[], task: string) {
  const key = JSON.stringify(messages);
  const exactMatch = cache.get(key);

  // 1. Try exact match first (fastest)
  if (exactMatch) {
    if (Date.now() > exactMatch.expiry) {
      cache.delete(key);
      return null;
    }
    console.log("⚡ Exact cache hit!");
    return exactMatch.value;
  }

  // 2. Try similarity matching (smart)
  try {
    console.log("🧠 Searching smart cache for similarity...");
    const currentEmbedding = await getEmbedding(task);

    let bestMatch: CacheItem | null = null;
    let highestSimilarity = -1;

    for (const [key, item] of cache.entries()) {
      if (Date.now() > item.expiry) {
        cache.delete(key);
        continue;
      }

      const similarity = cosineSimilarity(currentEmbedding, item.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = item;
      }
    }

    if (bestMatch && highestSimilarity > SIMILARITY_THRESHOLD) {
      console.log(`⚡ Smart cache hit! Similarity: ${(highestSimilarity * 100).toFixed(2)}%`);
      return bestMatch.value;
    }
  } catch (error) {
    console.error("Smart cache search failed:", error);
  }

  return null;
}

export async function setSmartCache(messages: any[], task: string, response: string) {
  try {
    const key = JSON.stringify(messages);
    const embedding = await getEmbedding(task);

    cache.set(key, {
      value: response,
      expiry: Date.now() + TTL,
      embedding,
      task
    });
    console.log("💾 Saved to smart cache");
  } catch (error) {
    console.error("Failed to save to smart cache:", error);
  }
}

export function clearCache() {
  cache.clear();
}

export function shouldCache(taskType: string) {
  return taskType === "navigation" || taskType === "survey";
}
