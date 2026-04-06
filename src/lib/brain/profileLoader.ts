import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let profile: any = null;

export function loadProfile() {
  if (!profile) {
    const profilePath = path.join(__dirname, "profile.json");
    profile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
  }
  return profile;
}
