import type { ProviderInfo } from "./types.js";

export const PROVIDER_REGISTRY: Record<string, ProviderInfo> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-5.2",
    supportsOAuth: false,
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini",
    defaultModel: "gemini-3.1-pro-preview",
    supportsOAuth: true,
  },
  kimi: {
    id: "kimi",
    name: "Kimi (Moonshot)",
    type: "openai-compatible",
    baseURL: "https://api.kimi.com/coding/v1",
    defaultModel: "kimi-for-coding",
    supportsOAuth: false,
    defaultHeaders: { "User-Agent": "claude-code/1.0.0" },
  },
  minimax: {
    id: "minimax",
    name: "MiniMax",
    type: "openai-compatible",
    baseURL: "https://api.minimax.io/v1",
    defaultModel: "MiniMax-M2.5",
    supportsOAuth: false,
  },
  glm: {
    id: "glm",
    name: "GLM (Zhipu AI)",
    type: "openai-compatible",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-5",
    supportsOAuth: false,
  },
};

export function getProviderInfo(id: string): ProviderInfo | undefined {
  return PROVIDER_REGISTRY[id];
}

export function getAllProviderIds(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}
