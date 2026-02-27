import type { ProviderInfo } from "./types.js";

export const PROVIDER_REGISTRY: Record<string, ProviderInfo> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1",
    supportsOAuth: false,
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini",
    defaultModel: "gemini-2.5-flash",
    supportsOAuth: true,
  },
  kimi: {
    id: "kimi",
    name: "Kimi (Moonshot)",
    type: "openai-compatible",
    baseURL: "https://api.moonshot.ai/v1",
    defaultModel: "kimi-k2-thinking-turbo",
    supportsOAuth: false,
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
    defaultModel: "glm-4.7",
    supportsOAuth: false,
  },
};

export function getProviderInfo(id: string): ProviderInfo | undefined {
  return PROVIDER_REGISTRY[id];
}

export function getAllProviderIds(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}
