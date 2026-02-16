import { NextResponse } from "next/server";
import { OAUTH_CONFIG } from "@/lib/constants";
import { getTokenCookie, isTokenExpired } from "@/lib/token-storage";
import type { OAuthConnection } from "@/lib/types";

export async function GET() {
  const connections: OAuthConnection[] = Object.keys(OAUTH_CONFIG).map(
    (platform) => {
      const token = getTokenCookie(platform);

      if (!token) {
        return {
          platform: platform as OAuthConnection["platform"],
          connected: false,
        };
      }

      const expired = isTokenExpired(token);
      return {
        platform: platform as OAuthConnection["platform"],
        connected: !expired,
        platformUserId: token.platformUserId,
        platformUsername: token.platformUsername,
        platformDisplayName: token.platformDisplayName,
        connectedAt: token.connectedAt,
        tokenExpiresAt: token.expiresAt,
      };
    }
  );

  return NextResponse.json({ connections });
}
