import { createProvider, getModelForProvider } from "../auth/api-key.js";
import type { ChatMessage } from "../providers/types.js";

interface AskAgentArgs {
  agent: string;
  message: string;
  systemPrompt?: string;
}

export async function askAgent(args: AskAgentArgs): Promise<string> {
  const provider = createProvider(args.agent);
  const model = getModelForProvider(args.agent);

  const messages: ChatMessage[] = [];
  if (args.systemPrompt) {
    messages.push({ role: "system", content: args.systemPrompt });
  }
  messages.push({ role: "user", content: args.message });

  return provider.chat({ model, messages });
}
