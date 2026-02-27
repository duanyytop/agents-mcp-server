import { createServer, IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { updateProviderConfig } from "../config/store.js";

const CALLBACK_PORT = 3456;
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;
const OAUTH_TIMEOUT_MS = 120_000;

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/generativelanguage.retriever",
  "https://www.googleapis.com/auth/cloud-platform",
].join(" ");

export function buildGoogleAuthUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: CALLBACK_URL,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function startOAuthFlow(
  provider: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const state = Math.random().toString(36).substring(2);
  const authUrl = buildGoogleAuthUrl(clientId, state);

  // Dynamically import open to handle ESM
  const { default: open } = await import("open");
  await open(authUrl);

  const code = await waitForCallback(state);
  const tokens = await exchangeCodeForTokens(code, clientId, clientSecret);

  updateProviderConfig(provider, {
    oauth: tokens,
    enabled: true,
  });

  return `OAuth completed successfully. Access token expires at ${new Date(tokens.expiresAt).toISOString()}`;
}

function waitForCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("OAuth timeout: no callback received within 120 seconds"));
    }, OAUTH_TIMEOUT_MS);

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) return;

      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      if (url.pathname !== "/callback") return;

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<html><body><h2>OAuth Error: ${error}</h2><p>You can close this window.</p></body></html>`);
        clearTimeout(timeout);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code || state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<html><body><h2>Invalid callback</h2><p>You can close this window.</p></body></html>`);
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<html><body><h2>Authentication successful!</h2><p>You can close this window and return to Claude Code.</p></body></html>`);

      clearTimeout(timeout);
      server.close();
      resolve(code);
    });

    server.listen(CALLBACK_PORT, () => {
      process.stderr.write(`OAuth callback server listening on port ${CALLBACK_PORT}\n`);
    });

    server.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
  });
}
