export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  enabled: boolean;
  oauth?: OAuthTokens;
}

export interface Config {
  providers: {
    openai?: ProviderConfig;
    gemini?: ProviderConfig;
    kimi?: ProviderConfig;
    minimax?: ProviderConfig;
    glm?: ProviderConfig;
    [key: string]: ProviderConfig | undefined;
  };
}
