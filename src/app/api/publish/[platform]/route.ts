import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getTokenCookie, isTokenExpired, setTokenCookie } from "@/lib/token-storage";
import { refreshToken, tokenResponseToData } from "@/lib/oauth";
import { publishToInstagram } from "@/lib/publishers/instagram";
import { publishToTikTok } from "@/lib/publishers/tiktok";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";
import { publishToYouTube } from "@/lib/publishers/youtube";
import { publishToReddit } from "@/lib/publishers/reddit";
import { publishToX } from "@/lib/publishers/x";
import {
  saveTemporaryImages,
  cleanupTemporaryImages,
} from "@/lib/publishers/media-server";
import { getDb } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import type { OAuthPlatform } from "@/lib/constants";

const VALID_PLATFORMS = ["instagram", "tiktok", "linkedin", "youtube", "youtube_shorts", "reddit", "x"] as const;
const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Records a published post in the database.
 * Best-effort — failures are logged but don't affect the publish response.
 */
async function recordPublishedPost(opts: {
  platform: string;
  caption: string;
  slideCount: number;
  platformPostId?: string;
  postUrl?: string;
}) {
  try {
    let userId = "dev";
    if (isClerkEnabled) {
      const user = await currentUser();
      if (user) userId = user.id;
    }

    const now = new Date().toISOString();
    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const title = opts.caption
      ? opts.caption.slice(0, 80) + (opts.caption.length > 80 ? "..." : "")
      : "Untitled Post";

    const db = getDb();
    await db.insert(posts).values({
      id,
      userId,
      title,
      postType: opts.slideCount > 1 ? "carousel" : "single",
      status: "published",
      platform: opts.platform,
      platformPostId: opts.platformPostId ?? null,
      postUrl: opts.postUrl ?? null,
      slideCount: opts.slideCount,
      publishedAt: now,
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.warn("[Publish] Failed to record post in history:", error);
  }
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
  const slideCount = slideImages.length;

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

          if (result.success) {
            await recordPublishedPost({
              platform,
              caption,
              slideCount,
              platformPostId: result.postId,
              postUrl: result.permalink,
            });
          }

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

        if (result.success) {
          await recordPublishedPost({
            platform,
            caption,
            slideCount,
            platformPostId: result.publishId,
          });
        }

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

        if (result.success) {
          await recordPublishedPost({
            platform,
            caption,
            slideCount,
            platformPostId: result.postUrn,
          });
        }

        return NextResponse.json({
          success: result.success,
          postUrn: result.postUrn,
          error: result.error,
        });
      }

      case "youtube":
      case "youtube_shorts": {
        const ytResult = await publishToYouTube(
          imageBuffers,
          caption,
          tokenData.accessToken,
          tokenData.platformUserId || ""
        );

        if (ytResult.success) {
          await recordPublishedPost({
            platform,
            caption,
            slideCount,
            postUrl: ytResult.postUrl,
          });
        }

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

        if (redditResult.success) {
          await recordPublishedPost({
            platform,
            caption,
            slideCount,
            postUrl: redditResult.postUrl,
          });
        }

        return NextResponse.json({
          success: redditResult.success,
          postUrl: redditResult.postUrl,
          error: redditResult.error,
        });
      }

      case "x": {
        const xResult = await publishToX(
          imageBuffers,
          caption,
          tokenData.accessToken
        );

        if (xResult.success) {
          await recordPublishedPost({
            platform,
            caption,
            slideCount,
            postUrl: xResult.postUrl,
          });
        }

        return NextResponse.json({
          success: xResult.success,
          postUrl: xResult.postUrl,
          error: xResult.error,
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
