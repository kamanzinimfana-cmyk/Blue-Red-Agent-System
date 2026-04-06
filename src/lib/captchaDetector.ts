export function detectCaptcha(dom: string) {
  const lowerDom = dom.toLowerCase();
  return (
    lowerDom.includes("captcha") ||
    lowerDom.includes("g-recaptcha") ||
    lowerDom.includes("hcaptcha") ||
    lowerDom.includes("verify you are human") ||
    lowerDom.includes("cf-challenge") ||
    lowerDom.includes("recaptcha")
  );
}
