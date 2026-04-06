export function isBlocked(pageContent: string) {
  const lowerContent = pageContent.toLowerCase();
  return (
    lowerContent.includes("access denied") ||
    lowerContent.includes("verify you are human") ||
    lowerContent.includes("captcha") ||
    lowerContent.includes("blocked") ||
    lowerContent.includes("cloudflare") ||
    lowerContent.includes("distil networks")
  );
}
