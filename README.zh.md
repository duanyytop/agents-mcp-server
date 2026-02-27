# agents-mcp-server

让 Claude Code 调用多个 LLM（OpenAI、Google Gemini、Kimi、MiniMax、GLM）进行代码 Review 和通用问答的 MCP server。

[English](./README.md)

## 安装

```bash
# 克隆并构建
git clone <repo>
cd agents-mcp-server
pnpm install
pnpm build

# 添加到 Claude Code
claude mcp add agents-mcp-server -s user -- node /path/to/agents-mcp-server/dist/index.js
```

## 认证方式

### 方式 A：API Key

适用于 OpenAI、Kimi、MiniMax、GLM 等所有非 Gemini 的 provider。

```
use add_api_key, provider=openai, api_key=sk-xxx
```

Key 存储在 `~/.config/agents-mcp-server/config.json`。

### 方式 B：复用 Gemini CLI 认证（仅 Gemini）

如果你已经在用 [Gemini CLI](https://github.com/google-gemini/gemini-cli)，无需任何额外配置。

**原理：** Gemini CLI 将 Google OAuth token 存储在 `~/.gemini/oauth_creds.json`。本 server 直接读取该 token，以 Bearer 认证方式调用 Gemini Code Assist API——与 CLI 本身的调用方式完全一致。无需 API key、无需走 OAuth 流程、无需 Google Cloud 项目。

**自动处理 token 过期：**
- token 在过期前 5 分钟自动刷新，使用的是 Gemini CLI 内置的 OAuth client credentials
- 刷新后的 token 会写回 `~/.gemini/oauth_creds.json`，CLI 本身也同步受益

**使用方式：** 运行一次 `gemini` 完成认证后，本 server 会自动检测到凭据。通过 `list_agents` 确认显示 `✓ Enabled (Gemini CLI)` 即可。

### 为什么 Codex CLI 认证不可用

你可能会想以同样的方式复用 [Codex CLI](https://github.com/openai/codex) 的 token——但这行不通，原因是根本性的。

Gemini CLI 调用的是标准 HTTPS API（`cloudcode-pa.googleapis.com`），接受 OAuth Bearer token。**Codex CLI 不同。** 当通过 ChatGPT OAuth 认证时，Codex CLI 将请求路由到 `chatgpt.com/backend-api/codex`——一个 ChatGPT 内部后端，具有以下特点：

- 受 Cloudflare bot 检测保护（拦截 curl/fetch，要求浏览器级别的 TLS 指纹）
- 使用 OpenAI Responses API 协议，而非 Chat Completions
- 消耗的是 ChatGPT 订阅配额，与 OpenAI API billing 完全独立

Codex CLI 二进制中对此有硬编码的特殊分支：

```rust
let default_base_url = if matches!(auth_mode, Some(AuthMode::Chatgpt)) {
    "https://chatgpt.com/backend-api/codex"   // ChatGPT OAuth 走这里
} else {
    "https://api.openai.com/v1"               // API key 走这里
};
```

也就是说，Codex CLI 的 OAuth token **不是**普通的 OpenAI API token——它只能用于专为 Codex 二进制设计的私有后端，无法在标准 HTTP 客户端中复用。

**要使用 OpenAI，请在 [platform.openai.com](https://platform.openai.com) 获取 API key 后通过 `add_api_key` 配置。**

## 使用方式

将 server 添加到 Claude Code 后，直接用自然语言描述需求即可，Claude 会自动调用对应工具。

**查看哪些 agent 已就绪：**
> 现在有哪些 AI agent 可以用？

**用 Gemini review 当前文件：**
> 用 Gemini review 这个文件，重点找 bug 和安全问题。

**让另一个模型提供第二意见：**
> 让 Kimi 也 review 一下这段代码，和 Gemini 的反馈对比一下。

**所有 agent 同时 review：**
> 让所有已配置的 agent 一起 review 这个 TypeScript 文件，总结共同发现的问题。

**专项安全审计：**
> 用 Gemini 对这个文件里的登录逻辑做安全审计，重点检查 SQL 注入、硬编码密钥和 JWT 使用是否规范。

**带上下文的性能 review：**
> 这个 Hook 在每次按键时都会执行，让 Gemini 专门 review 有没有不必要的重渲染和遗漏的依赖项。

**询问设计决策：**
> 问一下 Gemini：电商购物车场景下，乐观更新和悲观更新各有什么 tradeoff？

## 可用工具

### `list_agents`
列出所有已配置的 AI agent 及其状态。

### `add_api_key`
```
provider: openai | kimi | minimax | glm
api_key: string
model?: string   # 可选，覆盖默认模型
```

注意：Gemini 不支持 API key 认证，请使用 Gemini CLI 方式。

### `review_code`
```
code: string       # 待 review 的代码
agent: string      # provider 名称，或 "all" 使用所有已配置的 agent
language?: string  # 如 TypeScript、Python
context?: string   # 附加上下文
focus?: array      # security | performance | style | bugs
```

### `ask_agent`
```
agent: openai | gemini | kimi | minimax | glm
message: string
system_prompt?: string
```

## 支持的 Provider

| Provider | ID | 默认模型 | 认证方式 |
|----------|----|----------|----------|
| OpenAI | `openai` | gpt-5.2 | API key |
| Google Gemini | `gemini` | gemini-3.1-pro-preview | Gemini CLI OAuth |
| Kimi (Moonshot) | `kimi` | kimi-for-coding | API key |
| MiniMax | `minimax` | MiniMax-M2.5 | API key |
| GLM (智谱 AI) | `glm` | glm-5 | API key |

### Kimi（Moonshot）注意事项

Kimi 提供两套独立的 API，endpoint、模型、访问策略均不同，使用错误会导致认证失败或权限错误。

#### Kimi Coding API（本 server 使用此接口）

| 字段 | 值 |
|------|-----|
| Base URL | `https://api.kimi.com/coding/v1` |
| 模型 | `kimi-for-coding` |
| 上下文窗口 | 262,144 tokens |
| 最大输出 | 32,768 tokens |

**如何获取 API key：**

1. 访问 [kimi.com/code/console](https://www.kimi.com/code/console)——注意这**不是**普通的 Moonshot 平台
2. 订阅 Kimi Code 套餐（访问 API 需要订阅）
3. 生成 API key，格式为 `sk-kimi-...`

**访问限制：** Kimi Coding API 只接受来自认可编码 agent 的请求（Kimi CLI、Claude Code、Roo Code、Kilo Code 等）。本 server 会自动在每个请求中携带 `User-Agent: claude-code/1.0.0`。若直接用 curl 或通用 OpenAI 客户端调用时不带此 header，将收到 `403 access_terminated_error`。

**常见错误：**
- ❌ 使用 `https://api.moonshot.ai/v1`——这是通用 Moonshot API，不是 Coding 接口
- ❌ 使用模型 `kimi-k2.5` 或 `moonshot-v1-*`——这些是通用模型，Coding 接口不支持
- ❌ 从 [platform.moonshot.cn](https://platform.moonshot.cn) 获取 API key——那是通用 API 的 key

#### 通用 Moonshot API（本 server 未使用）

如需使用通用模型（`moonshot-v1-8k`、`kimi-k2.5` 等），可从 [platform.moonshot.cn](https://platform.moonshot.cn) 获取 key，endpoint 为 `https://api.moonshot.ai/v1`。覆盖方式：

```
use add_api_key, provider=kimi, api_key=sk-xxx, model=moonshot-v1-8k
```

然后修改 `src/providers/registry.ts` 中的 base URL 并重新构建。

## 调试

```bash
# 验证 server 是否正常启动
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# 查看配置
cat ~/.config/agents-mcp-server/config.json

# 查看 Gemini CLI token
cat ~/.gemini/oauth_creds.json
```
