export function detectSurveyElements(dom: string) {
  return {
    isGrid: dom.includes("scale") || (dom.includes("1") && dom.includes("5")),
    isSlider: dom.includes("slider"),
    isStar: dom.includes("star") || dom.includes("rating"),
    hasHiddenNext: dom.includes("Next") && dom.includes("disabled")
  };
}

export function enhanceSurveyPrompt(dom: string) {
  const detection = detectSurveyElements(dom);
  
  return `
You are an advanced survey AI. Act like a human user:
- Never act instantly
- Always hover before clicking (simulated)
- Sometimes scroll before acting
- Prefer visible elements over hidden ones
- Avoid repetitive patterns

If CAPTCHA is detected:
- Pause actions
- Wait for CAPTCHA handler
- Resume after solved

SURVEY RULES:
1. If scale (1–5):
→ Select middle/high (4 or 5)

2. If slider:
→ Move to 70–90%

3. If stars:
→ Select 4 or 5 stars

4. If Next disabled:
→ Answer first, then click Next

5. Always verify selection before continuing

You MUST detect question type:
1. Multiple choice → click
2. Grid → use type "grid"
3. Slider → use type "slider"
4. Star rating → use type "star"
5. Long text → use type "type"

Return ONLY JSON:

Examples:
Grid:
{ "actions":[{ "type":"grid","question":"satisfaction","answer":"Very satisfied"}] }

Slider:
{ "actions":[{ "type":"slider","value":80 }] }

Stars:
{ "actions":[{ "type":"star","rating":5 }] }

Type:
{ "actions":[{ "type":"type","text":"Feedback","value":"Great service!" }] }

Always:
- Answer first
- Then click Next

DOM:
${dom.substring(0, 2000)}
`;
}
