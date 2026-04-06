import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE = path.join(process.cwd(), "agent_memory.json");

interface LearningEntry {
  urlPattern: string;
  actionSequence: any[];
  success: boolean;
  timestamp: number;
}

export class LearningEngine {
  private memory: LearningEntry[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        this.memory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to load memory:", e);
      this.memory = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memory, null, 2));
    } catch (e) {
      console.error("Failed to save memory:", e);
    }
  }

  store(url: string, actions: any[], success: boolean) {
    const entry: LearningEntry = {
      urlPattern: this.normalizeUrl(url),
      actionSequence: actions,
      success,
      timestamp: Date.now()
    };

    this.memory.push(entry);
    this.save();
  }

  findBestMatch(url: string) {
    const pattern = this.normalizeUrl(url);

    return this.memory
      .filter(e => e.urlPattern === pattern && e.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  private normalizeUrl(url: string) {
    if (!url) return "";
    return url.split("?")[0];
  }
}
