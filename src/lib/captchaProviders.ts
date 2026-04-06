export interface CaptchaProvider {
  name: string;
  apiKey: string | undefined;
  solve(siteKey: string, pageUrl: string): Promise<string>;
  getBalance(): Promise<number>;
}

export class TwoCaptchaProvider implements CaptchaProvider {
  name = "2Captcha";
  apiKey = process.env.CAPTCHA_API_KEY;

  async solve(siteKey: string, pageUrl: string): Promise<string> {
    if (!this.apiKey) throw new Error("2Captcha API key missing");

    const params = new URLSearchParams({
      key: this.apiKey,
      method: "userrecaptcha",
      googlekey: siteKey,
      pageurl: pageUrl,
      json: "1"
    });

    const res = await fetch("http://2captcha.com/in.php", {
      method: "POST",
      body: params
    });

    const data = await res.json();
    if (data.status !== 1) throw new Error(`2Captcha submit error: ${data.request}`);

    const requestId = data.request;
    await new Promise(r => setTimeout(r, 15000));

    for (let i = 0; i < 15; i++) {
      const check = await fetch(`http://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${requestId}&json=1`);
      const result = await check.json();

      if (result.status === 1) return result.request;
      if (result.request !== "CAPCHA_NOT_READY") throw new Error(`2Captcha error: ${result.request}`);
      
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error("2Captcha timeout");
  }

  async getBalance(): Promise<number> {
    if (!this.apiKey) return 0;
    const res = await fetch(`http://2captcha.com/res.php?key=${this.apiKey}&action=getbalance&json=1`);
    const data = await res.json();
    return parseFloat(data.request || "0");
  }
}

export class AntiCaptchaProvider implements CaptchaProvider {
  name = "Anti-Captcha";
  apiKey = process.env.ANTI_CAPTCHA_API_KEY;

  async solve(siteKey: string, pageUrl: string): Promise<string> {
    if (!this.apiKey) throw new Error("Anti-Captcha API key missing");

    const res = await fetch("https://api.anti-captcha.com/createTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientKey: this.apiKey,
        task: {
          type: "NoCaptchaTaskProxyless",
          websiteURL: pageUrl,
          websiteKey: siteKey
        }
      })
    });

    const data = await res.json();
    if (data.errorId !== 0) throw new Error(`Anti-Captcha submit error: ${data.errorDescription}`);

    const taskId = data.taskId;
    await new Promise(r => setTimeout(r, 10000));

    for (let i = 0; i < 15; i++) {
      const check = await fetch("https://api.anti-captcha.com/getTaskResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey: this.apiKey,
          taskId: taskId
        })
      });
      const result = await check.json();

      if (result.status === "ready") return result.solution.gRecaptchaResponse;
      if (result.errorId !== 0) throw new Error(`Anti-Captcha error: ${result.errorDescription}`);
      
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error("Anti-Captcha timeout");
  }

  async getBalance(): Promise<number> {
    if (!this.apiKey) return 0;
    const res = await fetch("https://api.anti-captcha.com/getBalance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientKey: this.apiKey })
    });
    const data = await res.json();
    return data.balance || 0;
  }
}
