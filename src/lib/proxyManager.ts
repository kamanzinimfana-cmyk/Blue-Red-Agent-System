type Proxy = {
  host: string;
  port: number;
  username?: string;
  password?: string;
};

export class ProxyManager {
  private proxies: Proxy[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadProxies();
  }

  private loadProxies() {
    this.proxies = [
      {
        host: "127.0.0.1",
        port: 9050 // TOR fallback
      },
      // ADD YOUR REAL PROXIES HERE
      // Example:
      // { host: "proxy1.com", port: 10000, username: "user", password: "pass" }
    ];
  }

  getNextProxy(): Proxy | null {
    if (this.proxies.length === 0) return null;

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

    console.log("🌍 Using Proxy:", proxy.host);
    return proxy;
  }
}
