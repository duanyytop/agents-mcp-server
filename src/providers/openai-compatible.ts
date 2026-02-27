import OpenAI from "openai";
import type { Provider, ChatOptions } from "./types.js";

export class OpenAICompatibleProvider implements Provider {
  private staticClient?: OpenAI;
  private getToken?: () => Promise<string>;
  private baseURL?: string;

  constructor(credentials: string | (() => Promise<string>), baseURL?: string) {
    this.baseURL = baseURL;
    if (typeof credentials === "string") {
      this.staticClient = new OpenAI({ apiKey: credentials, baseURL });
    } else {
      this.getToken = credentials;
    }
  }

  async chat(options: ChatOptions): Promise<string> {
    let client: OpenAI;
    if (this.staticClient) {
      client = this.staticClient;
    } else {
      const token = await this.getToken!();
      client = new OpenAI({ apiKey: token, baseURL: this.baseURL });
    }

    const response = await client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content in response");
    return content;
  }
}
