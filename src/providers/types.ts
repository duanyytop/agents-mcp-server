export type ProviderType = "openai-compatible" | "gemini";

export interface ProviderInfo {
  id: string;
  name: string;
  type: ProviderType;
  baseURL?: string;
  defaultModel: string;
  supportsOAuth: boolean;
  defaultHeaders?: Record<string, string>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface Provider {
  chat(options: ChatOptions): Promise<string>;
}
