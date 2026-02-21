import { NextResponse } from "next/server";
import { getTokenCookie, isTokenExpired, setTokenCookie } from "@/lib/token-storage";
import { refreshToken, tokenResponseToData } from "@/lib/oauth";
import type { OAuthPlatform } from "@/lib/constants";

const VALID_PLATFORMS = [
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "reddit",
  "x",
] as const;

/**
 * GET /api/auth/[platform]/verify
 *
 * Verifies that a stored OAuth token actually works by making a minimal
 * read-only API call to the platform. Attempts one token refresh if expired.
 *
 * Returns: { ok: true, username: "..." } or { ok: false, error: "..." }
 */
export async function GET(
  _request: Request,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  if (
    !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])
  ) {
    return NextResponse.json(
      { ok: false, error: `Invalid platform: ${platform}` },
      { status: 400 }
    );
  }

  const oauthPlatform = platform as OAuthPlatform;

  // 1. Read token
  let tokenData = getTokenCookie(oauthPlatform);

  if (!tokenData) {
    return NextResponse.json(
      { ok: false, error: "Not connected" },
      { status: 401 }
    );
  }

  // 2. Refresh if expired
  if (isTokenExpired(tokenData)) {
    if (!tokenData.refreshToken) {
      return NextResponse.json(
        { ok: false, error: "Token expired and cannot be refreshed" },
        { status: 401 }
      );
    }

    try {
      const refreshed = await refreshToken(
        oauthPlatform,
        tokenData.refreshToken
      );
      const newTokenData = tokenResponseToData(refreshed);
      newTokenData.platformUserId =
        newTokenData.platformUserId || tokenData.platformUserId;
      newTokenData.platformUsername =
        newTokenData.platformUsername || tokenData.platformUsername;
      newTokenData.platformDisplayName =
        newTokenData.platformDisplayName || tokenData.platformDisplayName;
      setTokenCookie(oauthPlatform, newTokenData);
      tokenData = newTokenData;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Token refresh failed. Please reconnect." },
        { status: 401 }
      );
    }
  }

  // 3. Make a minimal read-only API call to verify
  try {
    const result = await verifyPlatformToken(
      oauthPlatform,
      tokenData.accessToken,
      tokenData.platformUserId
    );
    return NextResponse.json({ ok: true, username: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

// -----------------------------------------------------------------------------
// Platform-specific minimal verify calls
// -----------------------------------------------------------------------------

async function verifyPlatformToken(
  platform: OAuthPlatform,
  accessToken: string,
  platformUserId?: string
): Promise<string> {
  switch (platform) {
    case "instagram": {
      const userId = platformUserId || "me";
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${userId}?fields=username&access_token=${accessToken}`
      );
      if (!res.ok) throw new Error("Instagram token invalid");
      const data = await res.json();
      return data.username || "Connected";
    }

    case "tiktok": {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=display_name",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("TikTok token invalid");
      const data = await res.json();
      return data?.data?.user?.display_name || "Connected";
    }

    case "linkedin": {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("LinkedIn token invalid");
      const data = await res.json();
      return data.name || "Connected";
    }

    case "youtube": {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("YouTube token invalid");
      const data = await res.json();
      const title = data?.items?.[0]?.snippet?.title;
      return title || "Connected";
    }

    case "reddit": {
      const res = await fetch("https://oauth.reddit.com/api/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "KodaPost/1.0",
        },
      });
      if (!res.ok) throw new Error("Reddit token invalid");
      const data = await res.json();
      return data.name || "Connected";
    }

    case "x": {
      const res = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("X token invalid");
      const data = await res.json();
      return data?.data?.username || "Connected";
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
