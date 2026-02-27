import { GoogleGenAI } from "@google/genai";
import type { Provider, ChatOptions } from "./types.js";

type GeminiCredentials =
  | { type: "apiKey"; apiKey: string }
  | { type: "oauth"; getToken: () => Promise<string> };

export class GeminiProvider implements Provider {
  private credentials: GeminiCredentials;
  private ai?: GoogleGenAI;

  constructor(credentials: GeminiCredentials) {
    this.credentials = credentials;
    if (credentials.type === "apiKey") {
      this.ai = new GoogleGenAI({ apiKey: credentials.apiKey });
    }
  }

  async chat(options: ChatOptions): Promise<string> {
    if (this.credentials.type === "apiKey" && this.ai) {
      return this.chatWithSdk(options, this.ai);
    }
    const token = await (this.credentials as Extract<GeminiCredentials, { type: "oauth" }>).getToken();
    return this.chatWithBearer(options, token);
  }

  private async chatWithSdk(options: ChatOptions, ai: GoogleGenAI): Promise<string> {
    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const contents = userMessages.map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.content }],
    }));

    const config: Record<string, unknown> = {};
    if (systemMessage) config.systemInstruction = systemMessage.content;
    if (options.temperature !== undefined) config.temperature = options.temperature;
    if (options.maxTokens !== undefined) config.maxOutputTokens = options.maxTokens;

    const response = await ai.models.generateContent({
      model: options.model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const text = response.text;
    if (!text) throw new Error("No content in Gemini response");
    return text;
  }

  private async chatWithBearer(options: ChatOptions, accessToken: string): Promise<string> {
    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      contents: userMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    };

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const generationConfig: Record<string, unknown> = {};
    if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
    if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;
    if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No content in Gemini response");
    return text;
  }
}
