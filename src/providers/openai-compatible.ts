import OpenAI from "openai";
import type { Provider, ChatOptions } from "./types.js";

export class OpenAICompatibleProvider implements Provider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
  }

  async chat(options: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }
    return content;
  }
}
