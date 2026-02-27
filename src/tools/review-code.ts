import { createProvider, getModelForProvider } from "../auth/api-key.js";
import { readConfig } from "../config/store.js";
import { getAllProviderIds } from "../providers/registry.js";

type FocusArea = "security" | "performance" | "style" | "bugs";

interface ReviewCodeArgs {
  code: string;
  agent: string;
  language?: string;
  context?: string;
  focus?: FocusArea[];
}

function buildReviewPrompt(args: ReviewCodeArgs): string {
  const language = args.language ?? "code";
  const focusAreas = args.focus?.length
    ? args.focus.join(", ")
    : "security, performance, style, bugs";

  return `You are an expert code reviewer. Review the following ${language} code.

Focus areas: ${focusAreas}${args.context ? `\nContext: ${args.context}` : ""}

Code:
\`\`\`${args.language ?? ""}
${args.code}
\`\`\`

Provide a structured review with:
1. **Overall Assessment** (1-2 sentences)
2. **Issues Found** (list with severity: critical/major/minor)
3. **Suggestions** (specific improvements)
4. **Positive Aspects** (what's done well)

Be concise and actionable.`;
}

async function reviewWithAgent(agentId: string, args: ReviewCodeArgs): Promise<string> {
  const provider = createProvider(agentId);
  const model = getModelForProvider(agentId);
  const prompt = buildReviewPrompt(args);

  const result = await provider.chat({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return result;
}

export async function reviewCode(args: ReviewCodeArgs): Promise<string> {
  if (args.agent === "all") {
    const config = readConfig();
    const enabledAgents = getAllProviderIds().filter((id) => {
      const providerConfig = config.providers[id];
      return providerConfig?.enabled && providerConfig?.apiKey;
    });

    if (enabledAgents.length === 0) {
      return "No agents configured. Use add_api_key to configure at least one agent.";
    }

    const results = await Promise.allSettled(
      enabledAgents.map(async (agentId) => {
        const review = await reviewWithAgent(agentId, args);
        return { agentId, review };
      })
    );

    const lines: string[] = ["# Code Review Results (All Agents)\n"];
    for (const result of results) {
      if (result.status === "fulfilled") {
        lines.push(`## ${result.value.agentId.toUpperCase()} Review`);
        lines.push(result.value.review);
        lines.push("\n---\n");
      } else {
        lines.push(`## Error from agent`);
        lines.push(`Failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
        lines.push("\n---\n");
      }
    }
    return lines.join("\n");
  }

  return reviewWithAgent(args.agent, args);
}
