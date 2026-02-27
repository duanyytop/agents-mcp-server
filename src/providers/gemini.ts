import { randomUUID } from "crypto";
import type { ChatOptions } from "./types.js";

const CODE_ASSIST_ENDPOINT = "https://cloudcode-pa.googleapis.com";
const CODE_ASSIST_API_VERSION = "v1internal";

export class GeminiProvider {
  private getToken: () => Promise<string>;
  private cachedProjectId?: string;

  constructor(getToken: () => Promise<string>) {
    this.getToken = getToken;
  }

  async chat(options: ChatOptions): Promise<string> {
    const token = await this.getToken();
    return this.chatWithCodeAssist(options, token);
  }

  // Fetch projectId from Code Assist loadCodeAssist API (cached after first call)
  private async loadProjectId(accessToken: string): Promise<string | undefined> {
    if (this.cachedProjectId !== undefined) return this.cachedProjectId;

    const url = `${CODE_ASSIST_ENDPOINT}/${CODE_ASSIST_API_VERSION}:loadCodeAssist`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cloudaicompanionProject: undefined,
        metadata: {
          ideType: "IDE_UNSPECIFIED",
          platform: "PLATFORM_UNSPECIFIED",
          pluginType: "GEMINI",
        },
      }),
    });

    if (!response.ok) {
      // Not fatal — proceed without projectId (free tier managed project)
      this.cachedProjectId = "";
      return undefined;
    }

    const data = (await response.json()) as { cloudaicompanionProject?: string };
    this.cachedProjectId = data.cloudaicompanionProject ?? "";
    return this.cachedProjectId || undefined;
  }

  // Use the Code Assist endpoint (cloudcode-pa.googleapis.com) which works
  // in networks where generativelanguage.googleapis.com is blocked.
  // This is the same backend that Gemini CLI uses for Google One AI Pro users.
  private async chatWithCodeAssist(options: ChatOptions, accessToken: string): Promise<string> {
    const projectId = await this.loadProjectId(accessToken);

    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const contents = userMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const generationConfig: Record<string, unknown> = {};
    if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
    if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

    const innerRequest: Record<string, unknown> = { contents };
    if (systemMessage) innerRequest.systemInstruction = { parts: [{ text: systemMessage.content }] };
    if (Object.keys(generationConfig).length > 0) innerRequest.generationConfig = generationConfig;

    const body: Record<string, unknown> = {
      model: options.model,
      request: innerRequest,
      user_prompt_id: randomUUID(),
    };
    if (projectId) body.project = projectId;

    const url = `${CODE_ASSIST_ENDPOINT}/${CODE_ASSIST_API_VERSION}:generateContent`;
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
      throw new Error(`Gemini Code Assist API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as {
      response?: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    };

    const text = data.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No content in Gemini Code Assist response");
    return text;
  }
}
