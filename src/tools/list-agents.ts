import { readConfig } from "../config/store.js";
import { PROVIDER_REGISTRY } from "../providers/registry.js";

export function listAgents(): string {
  const config = readConfig();
  const lines: string[] = ["# Available AI Agents\n"];

  for (const [id, info] of Object.entries(PROVIDER_REGISTRY)) {
    const providerConfig = config.providers[id];
    const hasApiKey = Boolean(providerConfig?.apiKey);
    const hasOAuth = Boolean(providerConfig?.oauth?.accessToken);
    const isConfigured = hasApiKey || hasOAuth;
    const isEnabled = providerConfig?.enabled ?? false;
    const model = providerConfig?.model ?? info.defaultModel;

    const status = isConfigured
      ? isEnabled
        ? "✓ Enabled"
        : "○ Disabled"
      : "✗ Not configured";

    const authMethod = hasOAuth ? " (OAuth)" : hasApiKey ? " (API Key)" : "";

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
