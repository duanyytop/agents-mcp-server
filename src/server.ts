import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listAgents } from "./tools/list-agents.js";
import { addApiKey } from "./tools/add-api-key.js";
import { reviewCode } from "./tools/review-code.js";
import { askAgent } from "./tools/ask-agent.js";
import { startOAuth } from "./tools/start-oauth.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "agents-review-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "list_agents",
    {
      description: "List all configured AI agents and their status (configured, enabled, default model)",
    },
    async () => {
      const result = listAgents();
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.registerTool(
    "add_api_key",
    {
      description: "Add or update an API key for an AI provider",
      inputSchema: {
        provider: z
          .enum(["openai", "kimi", "minimax", "glm"])
          .describe("The AI provider to configure (Gemini uses CLI OAuth, not API key)"),
        api_key: z.string().describe("The API key for the provider"),
        model: z
          .string()
          .optional()
          .describe("Optional: override the default model for this provider"),
      },
    },
    async (args) => {
      const result = addApiKey(args.provider, args.api_key, args.model);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.registerTool(
    "review_code",
    {
      description: 'Review code using a specified AI agent. Use agent="all" to get reviews from all configured agents.',
      inputSchema: {
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

  server.registerTool(
    "ask_agent",
    {
      description: "Send a message to any configured AI agent and get a response",
      inputSchema: {
        agent: z
          .enum(["openai", "gemini", "kimi", "minimax", "glm"])
          .describe("Which agent to use"),
        message: z.string().describe("The message to send to the agent"),
        system_prompt: z
          .string()
          .optional()
          .describe("Optional system prompt to set the agent's behavior"),
      },
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

  server.registerTool(
    "start_oauth",
    {
      description: "Start Google OAuth 2.0 flow for Gemini. Opens browser for authentication and saves tokens.",
      inputSchema: {
        provider: z
          .enum(["gemini"])
          .describe("The provider to authenticate with OAuth (currently only Gemini is supported)"),
        client_id: z.string().describe("Google OAuth client ID"),
        client_secret: z.string().describe("Google OAuth client secret"),
      },
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
