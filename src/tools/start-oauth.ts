import { startOAuthFlow } from "../auth/oauth.js";

const OAUTH_SUPPORTED_PROVIDERS = ["gemini"] as const;
type OAuthProvider = (typeof OAUTH_SUPPORTED_PROVIDERS)[number];

interface StartOAuthArgs {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
}

export async function startOAuth(args: StartOAuthArgs): Promise<string> {
  if (!OAUTH_SUPPORTED_PROVIDERS.includes(args.provider)) {
    throw new Error(
      `OAuth is not supported for provider: ${args.provider}. Supported providers: ${OAUTH_SUPPORTED_PROVIDERS.join(", ")}`
    );
  }

  return startOAuthFlow(args.provider, args.clientId, args.clientSecret);
}
