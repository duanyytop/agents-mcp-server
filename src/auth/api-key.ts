import { getProviderConfig, updateProviderConfig } from "../config/store.js";
import { getProviderInfo } from "../providers/registry.js";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";
import { GeminiProvider } from "../providers/gemini.js";
import {
  getGeminiCliToken,
  hasGeminiCliAuth,
  getCodexCliToken,
  hasCodexCliAuth,
} from "./cli-tokens.js";
import type { Provider } from "../providers/types.js";

export function saveApiKey(provider: string, apiKey: string, model?: string): void {
  const existing = getProviderConfig(provider) ?? { enabled: true };
  updateProviderConfig(provider, {
    ...existing,
    apiKey,
    ...(model ? { model } : {}),
    enabled: true,
  });
}

export function getApiKey(provider: string): string | undefined {
  return getProviderConfig(provider)?.apiKey;
}

export function createProvider(providerName: string): Provider {
  const info = getProviderInfo(providerName);
  if (!info) throw new Error(`Unknown provider: ${providerName}`);

  const config = getProviderConfig(providerName);

  if (info.type === "gemini") {
    if (config?.apiKey) {
      return new GeminiProvider({ type: "apiKey", apiKey: config.apiKey });
    }
    if (hasGeminiCliAuth()) {
      return new GeminiProvider({ type: "oauth", getToken: getGeminiCliToken });
    }
    throw new Error(
      `No credentials for Gemini. Use add_api_key to set an API key, or run \`gemini\` to authenticate via Gemini CLI.`
    );
  }

  if (config?.apiKey) {
    return new OpenAICompatibleProvider(config.apiKey, info.baseURL, info.defaultHeaders);
  }

  if (providerName === "openai" && hasCodexCliAuth()) {
    return new OpenAICompatibleProvider(getCodexCliToken, info.baseURL, info.defaultHeaders);
  }

  throw new Error(
    `No API key configured for ${providerName}. Use add_api_key tool first.`
  );
}

export function getModelForProvider(providerName: string): string {
  const info = getProviderInfo(providerName);
  if (!info) throw new Error(`Unknown provider: ${providerName}`);

  const config = getProviderConfig(providerName);
  return config?.model ?? info.defaultModel;
}
