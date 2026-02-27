import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listAgents } from "./tools/list-agents.js";
import { addApiKey } from "./tools/add-api-key.js";
import { reviewCode } from "./tools/review-code.js";
import { askAgent } from "./tools/ask-agent.js";
import { startOAuth } from "./tools/start-oauth.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "agents-mcp-server",
    version: "1.0.0",
  });

  server.tool(
    "list_agents",
    "List all configured AI agents and their status (configured, enabled, default model)",
    {},
    async () => {
      const result = listAgents();
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "add_api_key",
    "Add or update an API key for an AI provider",
    {
      provider: z
        .enum(["openai", "gemini", "kimi", "minimax", "glm"])
        .describe("The AI provider to configure"),
      api_key: z.string().describe("The API key for the provider"),
      model: z
        .string()
        .optional()
        .describe("Optional: override the default model for this provider"),
    },
    async (args) => {
      const result = addApiKey(args.provider, args.api_key, args.model);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "review_code",
    'Review code using a specified AI agent. Use agent="all" to get reviews from all configured agents.',
    {
      code: z.string().describe("The code to review"),
      agent: z
        .string()
        .describe(
          'Which agent to use: "openai", "gemini", "kimi", "minimax", "glm", or "all" to use all configured agents'
        ),
      language: z
        .string()
        .optional()
        .describe("Programming language (e.g., TypeScript, Python, Go)"),
      context: z
        .string()
        .optional()
        .describe('Additional context about the code (e.g., "This is a React hook")'),
      focus: z
        .array(z.enum(["security", "performance", "style", "bugs"]))
        .optional()
        .describe("Areas to focus on during review"),
    },
    async (args) => {
      const result = await reviewCode({
        code: args.code,
        agent: args.agent,
        language: args.language,
        context: args.context,
        focus: args.focus,
      });
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "ask_agent",
    "Send a message to any configured AI agent and get a response",
    {
      agent: z
        .enum(["openai", "gemini", "kimi", "minimax", "glm"])
        .describe("Which agent to use"),
      message: z.string().describe("The message to send to the agent"),
      system_prompt: z
        .string()
        .optional()
        .describe("Optional system prompt to set the agent's behavior"),
    },
    async (args) => {
      const result = await askAgent({
        agent: args.agent,
        message: args.message,
        systemPrompt: args.system_prompt,
      });
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "start_oauth",
    "Start Google OAuth 2.0 flow for Gemini. Opens browser for authentication and saves tokens.",
    {
      provider: z
        .enum(["gemini"])
        .describe("The provider to authenticate with OAuth (currently only Gemini is supported)"),
      client_id: z.string().describe("Google OAuth client ID"),
      client_secret: z.string().describe("Google OAuth client secret"),
    },
    async (args) => {
      const result = await startOAuth({
        provider: args.provider,
        clientId: args.client_id,
        clientSecret: args.client_secret,
      });
      return { content: [{ type: "text", text: result }] };
    }
  );

  return server;
}
