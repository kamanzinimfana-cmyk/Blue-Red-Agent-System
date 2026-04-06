import { loadProfile } from "./profileLoader.ts";

export function getDirectAnswer(question: string) {
  const p = loadProfile();
  const q = question.toLowerCase();

  if (q.includes("gender")) return p.gender;
  if (q.includes("age")) return p.age.toString();
  if (q.includes("marital")) return p.marital_status;
  if (q.includes("children")) return p.children.toString();
  if (q.includes("education")) return p.education;
  if (q.includes("income")) return p.income;
  if (q.includes("job") || q.includes("occupation")) return p.job_title;
  if (q.includes("language")) return p.languages.join(", ");

  return null;
}
