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

## Configuration

API keys are stored in `~/.config/agents-mcp-server/config.json`.

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
Start Google OAuth 2.0 flow for Gemini (opens browser).
```
provider: gemini
client_id: string
client_secret: string
```

## Supported Providers

| Provider | ID | Default Model |
|----------|----|---------------|
| OpenAI | `openai` | gpt-5.2 |
| Google Gemini | `gemini` | gemini-3.1-pro-preview |
| Kimi (Moonshot) | `kimi` | kimi-k2.5 |
| MiniMax | `minimax` | MiniMax-M2.5 |
| GLM (Zhipu AI) | `glm` | glm-5 |

## Usage in Claude Code

```
# Add an API key
use add_api_key, provider=openai, api_key=sk-xxx

# Review code with one agent
use review_code, agent=openai, code=<your code>, language=TypeScript

# Compare reviews from all agents
use review_code, agent=all, code=<your code>

# Ask a question
use ask_agent, agent=gemini, message="Explain this algorithm..."
```

## Testing

```bash
# Verify server starts
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Check config
cat ~/.config/agents-mcp-server/config.json
```
