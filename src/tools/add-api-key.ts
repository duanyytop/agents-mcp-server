import { saveApiKey } from "../auth/api-key.js";
import { getProviderInfo } from "../providers/registry.js";

export function addApiKey(provider: string, apiKey: string, model?: string): string {
  const info = getProviderInfo(provider);
  if (!info) {
    throw new Error(`Unknown provider: ${provider}. Valid providers: openai, kimi, minimax, glm`);
  }

  if (info.type === "gemini") {
    throw new Error(`Gemini does not support API key authentication. Run \`gemini\` CLI to authenticate via Gemini CLI OAuth.`);
  }

  saveApiKey(provider, apiKey, model);

  const effectiveModel = model ?? info.defaultModel;
  return `API key saved for ${info.name}.\nModel: ${effectiveModel}\nProvider is now enabled and ready to use.`;
}
