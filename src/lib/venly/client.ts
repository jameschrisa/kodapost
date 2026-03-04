/**
 * Venly OAuth2 Client
 *
 * Handles client_credentials flow with automatic token caching and refresh.
 * Switches between sandbox/production based on VENLY_ENVIRONMENT.
 */

const AUTH_URLS: Record<string, string> = {
  staging: "https://login-sandbox.venly.io/auth/realms/Arkane/protocol/openid-connect/token",
  production: "https://login.venly.io/auth/realms/Arkane/protocol/openid-connect/token",
};

const API_URLS: Record<string, string> = {
  staging: "https://nft-api-sandbox.venly.io",
  production: "https://nft-api.venly.io",
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getEnv() {
  const clientId = process.env.VENLY_CLIENT_ID;
  const clientSecret = process.env.VENLY_CLIENT_SECRET;
  const environment = process.env.VENLY_ENVIRONMENT || "staging";
  const contractAddress = process.env.VENLY_CONTRACT_ADDRESS;

  if (!clientId || !clientSecret) {
    throw new Error("Missing VENLY_CLIENT_ID or VENLY_CLIENT_SECRET environment variables");
  }
  if (!contractAddress) {
    throw new Error("Missing VENLY_CONTRACT_ADDRESS environment variable");
  }

  return { clientId, clientSecret, environment, contractAddress };
}

export function getContractAddress(): string {
  return getEnv().contractAddress;
}

export function getPolygonscanBaseUrl(): string {
  const { environment } = getEnv();
  return environment === "production"
    ? "https://polygonscan.com"
    : "https://amoy.polygonscan.com";
}

/**
 * Fetches or returns a cached Venly OAuth2 access token.
 * Token is refreshed 60 seconds before expiry.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret, environment } = getEnv();
  const authUrl = AUTH_URLS[environment] || AUTH_URLS.staging;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venly OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Authenticated fetch wrapper for the Venly NFT API.
 * Automatically attaches Bearer token and retries once on 401.
 */
export async function venlyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { environment } = getEnv();
  const baseUrl = API_URLS[environment] || API_URLS.staging;
  const url = `${baseUrl}${path}`;

  async function doFetch(): Promise<Response> {
    const token = await getAccessToken();
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  let res = await doFetch();

  // Retry once on 401 (expired token edge case)
  if (res.status === 401) {
    cachedToken = null;
    res = await doFetch();
  }

  return res;
}
