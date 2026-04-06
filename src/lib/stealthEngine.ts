export interface StealthConfig {
  enabled: boolean;
  minDelay: number;
  maxDelay: number;
  jitter: number;
  humanTyping: boolean;
  randomOffsets: boolean;
}

export const defaultStealthConfig: StealthConfig = {
  enabled: true,
  minDelay: 1000,
  maxDelay: 3000,
  jitter: 0.2,
  humanTyping: true,
  randomOffsets: true
};

export function getRandomDelay(config: StealthConfig = defaultStealthConfig): number {
  if (!config.enabled) return 0;
  const base = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;
  const jitterAmount = base * config.jitter * (Math.random() * 2 - 1);
  return Math.max(0, base + jitterAmount);
}

export function getRandomOffset(max: number = 5): number {
  return (Math.random() * 2 - 1) * max;
}

export function getTypingDelay(): number {
  // Human typing speed varies between 50ms and 150ms per character
  return Math.floor(Math.random() * 100) + 50;
}
