import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie, isTokenExpired, setTokenCookie } from "@/lib/token-storage";
import { refreshToken, tokenResponseToData } from "@/lib/oauth";
import { publishToInstagram } from "@/lib/publishers/instagram";
import { publishToTikTok } from "@/lib/publishers/tiktok";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToYouTube } from "@/lib/publishers/youtube";
import { publishToReddit } from "@/lib/publishers/reddit";
import { publishToLemon8 } from "@/lib/publishers/lemon8";
import {
  saveTemporaryImages,
  cleanupTemporaryImages,
} from "@/lib/publishers/media-server";
import type { OAuthPlatform } from "@/lib/constants";

const VALID_PLATFORMS = ["instagram", "tiktok", "linkedin", "youtube", "reddit", "lemon8"] as const;

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * POST /api/publish/[platform]
 *
 * Publishes composited slide images to the specified platform.
 *
 * Body: { slideImages: string[] (base64), caption: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  // 1. Validate platform
  if (!VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    return NextResponse.json(
      { success: false, error: `Invalid platform: ${platform}` },
      { status: 400 }
    );
  }

  const oauthPlatform = platform as OAuthPlatform;

  // 2. Read and validate token
  let tokenData = getTokenCookie(oauthPlatform);

  if (!tokenData) {
    return NextResponse.json(
      { success: false, error: `Not connected to ${platform}. Please connect in Settings.` },
      { status: 401 }
    );
  }

  // 3. Refresh token if expired
  if (isTokenExpired(tokenData)) {
    if (!tokenData.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: `${platform} token has expired and cannot be refreshed. Please reconnect in Settings.`,
        },
        { status: 401 }
      );
    }

    try {
      const refreshed = await refreshToken(oauthPlatform, tokenData.refreshToken);
      const newTokenData = tokenResponseToData(refreshed);
      // Preserve platform user info from original token
      newTokenData.platformUserId = newTokenData.platformUserId || tokenData.platformUserId;
      newTokenData.platformUsername = newTokenData.platformUsername || tokenData.platformUsername;
      newTokenData.platformDisplayName = newTokenData.platformDisplayName || tokenData.platformDisplayName;
      setTokenCookie(oauthPlatform, newTokenData);
      tokenData = newTokenData;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to refresh ${platform} token. Please reconnect in Settings.`,
        },
        { status: 401 }
      );
    }
  }

  // 4. Parse request body
  let slideImages: string[];
  let caption: string;

  try {
    const body = await request.json();
    slideImages = body.slideImages;
    caption = body.caption || "";

    if (!Array.isArray(slideImages) || slideImages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  // 5. Convert base64 strings to Buffers
  const imageBuffers = slideImages.map((b64) => Buffer.from(b64, "base64"));

  // 6. Dispatch to platform-specific publisher
  try {
    switch (oauthPlatform) {
      case "instagram": {
        // Instagram needs publicly accessible URLs, so we host them temporarily
        const baseUrl = getAppUrl();
        const { urls, tempDir } = await saveTemporaryImages(imageBuffers, baseUrl);

        try {
          const result = await publishToInstagram(
            urls,
            caption,
            tokenData.accessToken,
            tokenData.platformUserId || ""
          );

          return NextResponse.json({
            success: result.success,
            postId: result.postId,
            postUrl: result.permalink,
            error: result.error,
          });
        } finally {
          // Always clean up temp files
          await cleanupTemporaryImages(tempDir);
        }
      }

      case "tiktok": {
        const result = await publishToTikTok(
          imageBuffers,
          caption,
          tokenData.accessToken
        );

        return NextResponse.json({
          success: result.success,
          postId: result.publishId,
          error: result.error,
        });
      }

      case "linkedin": {
        const authorUrn = tokenData.platformUserId
          ? `urn:li:person:${tokenData.platformUserId}`
          : "";

        if (!authorUrn) {
          return NextResponse.json(
            { success: false, error: "LinkedIn author ID not found. Please reconnect." },
            { status: 400 }
          );
        }

        const result = await publishToLinkedIn(
          imageBuffers,
          caption,
          tokenData.accessToken,
          authorUrn
        );

        return NextResponse.json({
          success: result.success,
          postUrn: result.postUrn,
          error: result.error,
        });
      }

      case "youtube": {
        const ytResult = await publishToYouTube(
          imageBuffers,
          caption,
          tokenData.accessToken,
          tokenData.platformUserId || ""
        );

        return NextResponse.json({
          success: ytResult.success,
          postUrl: ytResult.postUrl,
          error: ytResult.error,
        });
      }

      case "reddit": {
        const redditResult = await publishToReddit(
          imageBuffers,
          caption,
          tokenData.accessToken,
          tokenData.platformUserId || ""
        );

        return NextResponse.json({
          success: redditResult.success,
          postUrl: redditResult.postUrl,
          error: redditResult.error,
        });
      }

      case "lemon8": {
        const lemon8Result = await publishToLemon8(
          imageBuffers,
          caption,
          tokenData.accessToken
        );

        return NextResponse.json({
          success: lemon8Result.success,
          postUrl: lemon8Result.postUrl,
          error: lemon8Result.error,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported platform: ${platform}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Publishing failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
