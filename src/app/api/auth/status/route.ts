import { NextResponse } from "next/server";
import { OAUTH_CONFIG } from "@/lib/constants";
import { getTokenCookie, isTokenExpired } from "@/lib/token-storage";
import type { OAuthConnection } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export async function GET() {
  if (isClerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
