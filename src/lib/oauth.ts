import crypto from "crypto";
import { OAUTH_CONFIG, type OAuthPlatform } from "./constants";
import type { TokenData } from "./token-storage";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  platformUserId?: string;
  platformUsername?: string;
  platformDisplayName?: string;
}

// -----------------------------------------------------------------------------
// Shared OAuth Utilities
// -----------------------------------------------------------------------------

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getCallbackUrl(platform: string): string {
  return `${getAppUrl()}/api/auth/${platform}/callback`;
}

function getCredentials(platform: OAuthPlatform): { clientId: string; clientSecret: string } {
  const config = OAUTH_CONFIG[platform];
  const clientId = process.env[config.envKeys.id];
  const clientSecret = process.env[config.envKeys.secret];

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing ${config.envKeys.id} or ${config.envKeys.secret} environment variables. ` +
        "Add them to .env.local to enable OAuth for this platform."
    );
  }

  return { clientId, clientSecret };
}

/**
 * Generates a cryptographically secure state parameter for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

// -----------------------------------------------------------------------------
// Build Authorization URLs
// -----------------------------------------------------------------------------

export function buildAuthUrl(
  platform: OAuthPlatform,
  state: string
): string {
  const config = OAUTH_CONFIG[platform];
  const { clientId } = getCredentials(platform);
  const redirectUri = getCallbackUrl(platform);

  const params = new URLSearchParams();

  switch (platform) {
    case "instagram":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(","));
      params.set("response_type", "code");
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "tiktok":
      params.set("client_key", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(","));
      params.set("response_type", "code");
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "linkedin":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(" "));
      params.set("response_type", "code");
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "youtube":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(" "));
      params.set("response_type", "code");
      params.set("state", state);
      params.set("access_type", "offline");
      params.set("prompt", "consent");
      return `${config.authUrl}?${params.toString()}`;

    case "reddit":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(" "));
      params.set("response_type", "code");
      params.set("state", state);
      params.set("duration", "permanent");
      return `${config.authUrl}?${params.toString()}`;

    case "lemon8":
      params.set("client_key", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("scope", config.scopes.join(","));
      params.set("response_type", "code");
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// -----------------------------------------------------------------------------
// Exchange Authorization Code for Tokens
// -----------------------------------------------------------------------------

export async function exchangeCode(
  platform: OAuthPlatform,
  code: string
): Promise<TokenResponse> {
  switch (platform) {
    case "instagram":
      return exchangeInstagramCode(code);
    case "tiktok":
      return exchangeTikTokCode(code);
    case "linkedin":
      return exchangeLinkedInCode(code);
    case "youtube":
      return exchangeYouTubeCode(code);
    case "reddit":
      return exchangeRedditCode(code);
    case "lemon8":
      return exchangeLemon8Code(code);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// -- Instagram --

async function exchangeInstagramCode(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.instagram;
  const { clientId, clientSecret } = getCredentials("instagram");
  const redirectUri = getCallbackUrl("instagram");

  // 1. Exchange code for short-lived token
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Instagram token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  const shortLivedToken = tokenData.access_token;

  if (!shortLivedToken) {
    throw new Error("Instagram did not return an access token");
  }

  // 2. Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `${config.longLivedTokenUrl}?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
  );

  let accessToken = shortLivedToken;
  let expiresIn = 3600;

  if (longRes.ok) {
    const longData = await longRes.json();
    accessToken = longData.access_token || accessToken;
    expiresIn = longData.expires_in || 5184000; // 60 days
  }

  // 3. Get user info and Instagram Business Account ID
  const meRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
  );
  let platformUserId = "";
  let platformUsername = "";

  if (meRes.ok) {
    const meData = await meRes.json();
    const page = meData.data?.[0];
    if (page?.id) {
      // Get Instagram Business Account linked to this page
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
      );
      if (igRes.ok) {
        const igData = await igRes.json();
        platformUserId = igData.instagram_business_account?.id || "";

        // Get Instagram username
        if (platformUserId) {
          const profileRes = await fetch(
            `https://graph.facebook.com/v21.0/${platformUserId}?fields=username,name&access_token=${accessToken}`
          );
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            platformUsername = profileData.username || "";
          }
        }
      }
    }
  }

  return {
    accessToken,
    expiresIn,
    platformUserId,
    platformUsername,
    platformDisplayName: platformUsername,
  };
}

// -- TikTok --

async function exchangeTikTokCode(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.tiktok;
  const { clientId, clientSecret } = getCredentials("tiktok");
  const redirectUri = getCallbackUrl("tiktok");

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token exchange failed: ${err}`);
  }

  const data = await res.json();

  // TikTok returns data in a nested structure
  const tokenInfo = data.data || data;

  if (!tokenInfo.access_token) {
    throw new Error("TikTok did not return an access token");
  }

  // Get user info
  let platformUsername = "";
  if (tokenInfo.open_id) {
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username",
      {
        headers: { Authorization: `Bearer ${tokenInfo.access_token}` },
      }
    );
    if (userRes.ok) {
      const userData = await userRes.json();
      platformUsername = userData.data?.user?.username || "";
    }
  }

  return {
    accessToken: tokenInfo.access_token,
    refreshToken: tokenInfo.refresh_token,
    expiresIn: tokenInfo.expires_in || 86400,
    platformUserId: tokenInfo.open_id,
    platformUsername,
    platformDisplayName: platformUsername,
  };
}

// -- LinkedIn --

async function exchangeLinkedInCode(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.linkedin;
  const { clientId, clientSecret } = getCredentials("linkedin");
  const redirectUri = getCallbackUrl("linkedin");

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("LinkedIn did not return an access token");
  }

  // Get user profile info
  let platformUserId = "";
  let platformDisplayName = "";
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (userRes.ok) {
    const userData = await userRes.json();
    platformUserId = userData.sub || "";
    platformDisplayName = userData.name || "";
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 5184000,
    platformUserId,
    platformUsername: platformDisplayName,
    platformDisplayName,
  };
}

// -- YouTube (Google) --

async function exchangeYouTubeCode(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.youtube;
  const { clientId, clientSecret } = getCredentials("youtube");
  const redirectUri = getCallbackUrl("youtube");

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube token exchange failed: ${err}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("YouTube did not return an access token");
  }

  // Get channel info from YouTube Data API
  let platformUserId = "";
  let platformUsername = "";
  try {
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${data.access_token}` } }
    );
    if (channelRes.ok) {
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (channel) {
        platformUserId = channel.id || "";
        platformUsername = channel.snippet?.title || "";
      }
    }
  } catch {
    // Non-critical — channel info is optional
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    platformUserId,
    platformUsername,
    platformDisplayName: platformUsername,
  };
}

// -- Reddit --

async function exchangeRedditCode(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.reddit;
  const { clientId, clientSecret } = getCredentials("reddit");
  const redirectUri = getCallbackUrl("reddit");

  // Reddit uses Basic auth (client_id:client_secret base64-encoded)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Reddit token exchange failed: ${err}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Reddit did not return an access token");
  }

  // Get user identity
  let platformUsername = "";
  try {
    const userRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "User-Agent": "KodaPost/1.0",
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      platformUsername = userData.name || "";
    }
  } catch {
    // Non-critical
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    platformUserId: platformUsername, // Reddit uses username as ID
    platformUsername,
    platformDisplayName: platformUsername,
  };
}

// -- Lemon8 --

async function exchangeLemon8Code(code: string): Promise<TokenResponse> {
  const config = OAUTH_CONFIG.lemon8;
  const { clientId, clientSecret } = getCredentials("lemon8");
  const redirectUri = getCallbackUrl("lemon8");

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon8 token exchange failed: ${err}`);
  }

  const data = await res.json();
  const tokenInfo = data.data || data;

  if (!tokenInfo.access_token) {
    throw new Error("Lemon8 did not return an access token");
  }

  return {
    accessToken: tokenInfo.access_token,
    refreshToken: tokenInfo.refresh_token,
    expiresIn: tokenInfo.expires_in || 86400,
    platformUserId: tokenInfo.open_id || "",
    platformUsername: tokenInfo.username || "",
    platformDisplayName: tokenInfo.display_name || tokenInfo.username || "",
  };
}

// -----------------------------------------------------------------------------
// Token Refresh
// -----------------------------------------------------------------------------

export async function refreshToken(
  platform: OAuthPlatform,
  currentRefreshToken: string
): Promise<TokenResponse> {
  switch (platform) {
    case "tiktok": {
      const { clientId, clientSecret } = getCredentials("tiktok");
      const res = await fetch(OAUTH_CONFIG.tiktok.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: currentRefreshToken,
        }),
      });
      if (!res.ok) throw new Error("TikTok token refresh failed");
      const data = await res.json();
      const tokenInfo = data.data || data;
      return {
        accessToken: tokenInfo.access_token,
        refreshToken: tokenInfo.refresh_token,
        expiresIn: tokenInfo.expires_in || 86400,
      };
    }

    case "linkedin": {
      const { clientId, clientSecret } = getCredentials("linkedin");
      const res = await fetch(OAUTH_CONFIG.linkedin.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: currentRefreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (!res.ok) throw new Error("LinkedIn token refresh failed");
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    }

    case "instagram": {
      // Instagram long-lived tokens are refreshed via GET request with query params.
      // This is Meta's documented API — credentials in URL is their required format.
      // Server-side only, so credentials don't leak to browser history/referrer.
      const { clientId: igClientId, clientSecret: igClientSecret } = getCredentials("instagram");
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${igClientId}&client_secret=${igClientSecret}&fb_exchange_token=${currentRefreshToken}`
      );
      if (!res.ok) throw new Error("Instagram token refresh failed");
      const data = await res.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000,
      };
    }

    case "youtube": {
      const { clientId: ytClientId, clientSecret: ytClientSecret } = getCredentials("youtube");
      const res = await fetch(OAUTH_CONFIG.youtube.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: ytClientId,
          client_secret: ytClientSecret,
          grant_type: "refresh_token",
          refresh_token: currentRefreshToken,
        }),
      });
      if (!res.ok) throw new Error("YouTube token refresh failed");
      const data = await res.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 3600,
      };
    }

    case "reddit": {
      const { clientId: redditClientId, clientSecret: redditClientSecret } = getCredentials("reddit");
      const basicAuth = Buffer.from(`${redditClientId}:${redditClientSecret}`).toString("base64");
      const res = await fetch(OAUTH_CONFIG.reddit.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: currentRefreshToken,
        }),
      });
      if (!res.ok) throw new Error("Reddit token refresh failed");
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
      };
    }

    case "lemon8": {
      const { clientId: l8ClientId, clientSecret: l8ClientSecret } = getCredentials("lemon8");
      const res = await fetch(OAUTH_CONFIG.lemon8.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: l8ClientId,
          client_secret: l8ClientSecret,
          grant_type: "refresh_token",
          refresh_token: currentRefreshToken,
        }),
      });
      if (!res.ok) throw new Error("Lemon8 token refresh failed");
      const data = await res.json();
      const tokenInfo = data.data || data;
      return {
        accessToken: tokenInfo.access_token,
        refreshToken: tokenInfo.refresh_token,
        expiresIn: tokenInfo.expires_in || 86400,
      };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// -----------------------------------------------------------------------------
// Convert TokenResponse to TokenData for storage
// -----------------------------------------------------------------------------

export function tokenResponseToData(response: TokenResponse): TokenData {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: response.expiresIn
      ? new Date(Date.now() + response.expiresIn * 1000).toISOString()
      : undefined,
    platformUserId: response.platformUserId,
    platformUsername: response.platformUsername,
    platformDisplayName: response.platformDisplayName,
    connectedAt: new Date().toISOString(),
  };
}
