export type AIProvider = 'gemini' | 'ollama' | 'mistral';
export type AIMode = 'hybrid' | 'ollama' | 'mistral' | 'gemini';
export type SpeedMode = 'fast' | 'balanced' | 'accurate';
export type VisionMode = 'on' | 'off';

export interface AppSettings {
  provider: AIProvider;
  apiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  blueAgentId: string;
  redAgentId: string;
  aiMode: AIMode;
  speedMode: SpeedMode;
  visionMode: VisionMode;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'system' | 'blue' | 'red' | 'error' | 'success';
}

export interface UserProfile {
  age: string;
  gender: string;
  location: string;
  language: string;
  job: string;
  income: string;
  raw: string;
}
