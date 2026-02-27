import { GoogleGenAI } from "@google/genai";
import type { Provider, ChatOptions } from "./types.js";

export class GeminiProvider implements Provider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(options: ChatOptions): Promise<string> {
    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const contents = userMessages.map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.content }],
    }));

    const config: Record<string, unknown> = {};
    if (systemMessage) {
      config.systemInstruction = systemMessage.content;
    }
    if (options.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      config.maxOutputTokens = options.maxTokens;
    }

    const response = await this.ai.models.generateContent({
      model: options.model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No content in Gemini response");
    }
    return text;
  }
}
