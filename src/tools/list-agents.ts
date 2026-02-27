import { readConfig } from "../config/store.js";
import { PROVIDER_REGISTRY } from "../providers/registry.js";
import { hasGeminiCliAuth, hasCodexCliAuth } from "../auth/cli-tokens.js";

export function listAgents(): string {
  const config = readConfig();
  const geminiCliAvailable = hasGeminiCliAuth();
  const codexCliAvailable = hasCodexCliAuth();
  const lines: string[] = ["# Available AI Agents\n"];

  for (const [id, info] of Object.entries(PROVIDER_REGISTRY)) {
    const providerConfig = config.providers[id];
    const hasApiKey = Boolean(providerConfig?.apiKey);
    const hasOAuth = Boolean(providerConfig?.oauth?.accessToken);
    const hasCliAuth =
      (id === "gemini" && geminiCliAvailable) ||
      (id === "openai" && codexCliAvailable);
    const isConfigured = hasApiKey || hasOAuth || hasCliAuth;
    const isEnabled = isConfigured;
    const model = providerConfig?.model ?? info.defaultModel;

    const status = isConfigured
      ? isEnabled
        ? "✓ Enabled"
        : "○ Disabled"
      : "✗ Not configured";

    const authMethod = hasOAuth
      ? " (OAuth)"
      : hasApiKey
        ? " (API Key)"
        : hasCliAuth
          ? id === "gemini"
            ? " (Gemini CLI)"
            : " (Codex CLI)"
          : "";

    lines.push(`## ${info.name} (\`${id}\`)`);
    lines.push(`- Status: ${status}${authMethod}`);
    lines.push(`- Model: ${model}`);
    lines.push(`- Type: ${info.type}`);
    if (info.supportsOAuth) {
      lines.push(`- OAuth: Supported`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("Use `add_api_key` to configure a provider.");
  lines.push("Use `review_code` to review code with a configured agent.");

  return lines.join("\n");
}
