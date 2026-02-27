# agents-mcp-server

MCP server that lets Claude Code call multiple LLMs (OpenAI, Google Gemini, Kimi, MiniMax, GLM) for code review and general queries.

## Installation

```bash
# Clone and build
git clone <repo>
cd agents-mcp-server
pnpm install
pnpm build

# Add to Claude Code
claude mcp add agents-mcp-server -s user -- node /path/to/agents-mcp-server/dist/index.js
```

## Authentication

There are two ways to authenticate a provider: API key or CLI token reuse.

### Option A: API Key

The simplest approach for Kimi, MiniMax, and GLM. Also works for OpenAI and Gemini.

```
use add_api_key, provider=openai, api_key=sk-xxx
```

Keys are stored in `~/.config/agents-mcp-server/config.json`.

### Option B: Reuse Gemini CLI Auth (recommended for Gemini)

If you already use [Gemini CLI](https://github.com/google-gemini/gemini-cli), no extra setup is needed.

**Why this works:** Gemini CLI stores Google OAuth tokens in `~/.gemini/oauth_creds.json`. This server reads those tokens directly and uses them as Bearer auth when calling the Gemini API — the same way the CLI itself does. No API key, no OAuth flow, no Google Cloud project required.

**Token expiry is handled automatically:**
- Tokens are refreshed 5 minutes before expiry using the same OAuth client credentials embedded in the Gemini CLI
- The refreshed token is written back to `~/.gemini/oauth_creds.json`, so the CLI also benefits
- If you keep Gemini CLI running, it refreshes tokens on its own — this server will always read the latest

**Setup:** Just run `gemini` at least once to authenticate, then this server detects the credentials automatically. Run `list_agents` to confirm `✓ Enabled (Gemini CLI)`.

### Option C: Reuse Codex CLI Auth (recommended for OpenAI)

If you already use [Codex CLI](https://github.com/openai/codex), no API key is needed.

**Why this works:** Codex CLI uses OpenAI's OAuth flow and stores a JWT access token in `~/.codex/auth.json`. OpenAI's API accepts this JWT as a standard Bearer token — the same `Authorization: Bearer <token>` that a regular API key uses. This server reads the token from Codex CLI's auth file and passes it directly to the OpenAI SDK.

**Token expiry is handled automatically:**
- JWT expiry is parsed from the token's `exp` claim
- Tokens are refreshed 5 minutes before expiry using Codex CLI's OAuth client and the stored refresh token
- The refreshed token is written back to `~/.codex/auth.json`, so the CLI also benefits
- If you keep Codex CLI running, it refreshes tokens on its own — this server will always read the latest

**Setup:** Just run `codex` at least once to authenticate, then this server detects the credentials automatically. Run `list_agents` to confirm `✓ Enabled (Codex CLI)`.

### Priority

When both a manual API key and CLI auth are available, the manually configured API key takes precedence.

## Available Tools

### `list_agents`
List all configured AI agents and their status.

### `add_api_key`
```
provider: openai | gemini | kimi | minimax | glm
api_key: string
model?: string   # optional, overrides default model
```

### `review_code`
```
code: string       # code to review
agent: string      # provider name, or "all" for all configured agents
language?: string  # e.g., TypeScript, Python
context?: string   # extra context
focus?: array      # security | performance | style | bugs
```

### `ask_agent`
```
agent: openai | gemini | kimi | minimax | glm
message: string
system_prompt?: string
```

### `start_oauth`
Start Google OAuth 2.0 flow for Gemini (opens browser). Only needed if you don't use Gemini CLI.
```
provider: gemini
client_id: string
client_secret: string
```

## Supported Providers

| Provider | ID | Default Model | CLI Auth |
|----------|----|---------------|----------|
| OpenAI | `openai` | gpt-5.2 | Codex CLI |
| Google Gemini | `gemini` | gemini-3.1-pro-preview | Gemini CLI |
| Kimi (Moonshot) | `kimi` | kimi-k2.5 | — |
| MiniMax | `minimax` | MiniMax-M2.5 | — |
| GLM (Zhipu AI) | `glm` | glm-5 | — |

## Usage in Claude Code

```
# Review code with one agent
use review_code, agent=openai, code=<your code>, language=TypeScript

# Compare reviews from all agents
use review_code, agent=all, code=<your code>

# Ask a question
use ask_agent, agent=gemini, message="Explain this algorithm..."

# Check which agents are ready
use list_agents
```

## Testing

```bash
# Verify server starts
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Check config
cat ~/.config/agents-mcp-server/config.json

# Check Gemini CLI tokens
cat ~/.gemini/oauth_creds.json

# Check Codex CLI tokens
cat ~/.codex/auth.json
```
