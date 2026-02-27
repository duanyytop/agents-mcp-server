import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Config, ProviderConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".config", "agents-review-mcp");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function readConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return { providers: {} };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    return { providers: {} };
  }
}

export function writeConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getProviderConfig(provider: string): ProviderConfig | undefined {
  const config = readConfig();
  return config.providers[provider];
}

export function setProviderConfig(provider: string, providerConfig: ProviderConfig): void {
  const config = readConfig();
  config.providers[provider] = providerConfig;
  writeConfig(config);
}

export function updateProviderConfig(provider: string, updates: Partial<ProviderConfig>): void {
  const config = readConfig();
  const existing = config.providers[provider] ?? { enabled: true };
  config.providers[provider] = { ...existing, ...updates };
  writeConfig(config);
}
