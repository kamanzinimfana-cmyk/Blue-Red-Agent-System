import { TwoCaptchaProvider, AntiCaptchaProvider, CaptchaProvider } from "./captchaProviders.ts";

const providers: CaptchaProvider[] = [
  new TwoCaptchaProvider(),
  new AntiCaptchaProvider()
];

export async function solveRecaptcha(siteKey: string, pageUrl: string) {
  let lastError = null;

  for (const provider of providers) {
    if (!provider.apiKey) continue;

    try {
      console.log(`🧠 Attempting CAPTCHA solve with ${provider.name}...`);
      
      // Check balance before starting
      const balance = await provider.getBalance();
      console.log(`💰 ${provider.name} Balance: $${balance}`);
      
      if (balance < 0.10) {
        console.warn(`⚠️ ${provider.name} balance is low ($${balance})!`);
      }

      if (balance <= 0) {
        console.log(`❌ ${provider.name} has no balance, skipping...`);
        continue;
      }

      const token = await provider.solve(siteKey, pageUrl);
      console.log(`✅ CAPTCHA solved by ${provider.name}`);
      return token;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error instanceof Error ? error.message : String(error));
      lastError = error;
    }
  }

  throw new Error(`All CAPTCHA providers failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export async function getAllBalances() {
  const balances: Record<string, number> = {};
  for (const provider of providers) {
    if (provider.apiKey) {
      balances[provider.name] = await provider.getBalance();
    }
  }
  return balances;
}
