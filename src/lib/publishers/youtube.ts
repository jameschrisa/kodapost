/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * YouTube Community Posts — Carousel Publishing (Placeholder)
 *
 * YouTube Community posts support image carousels for channels with
 * Community tab access. This adapter is a placeholder for future implementation
 * using the YouTube Data API v3.
 *
 * Requirements:
 * - YouTube channel with Community tab enabled
 * - Google OAuth with youtube.upload scope
 * - Images: 1:1 (1000×1000) recommended for community posts
 */

export interface YouTubePublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

/**
 * Publish an image carousel as a YouTube Community post.
 *
 * @param images - Image buffers (1000×1000 JPEG)
 * @param caption - Post text (max 5000 chars)
 * @param accessToken - Google OAuth access token
 * @param channelId - YouTube channel ID
 */
export async function publishToYouTube(
  images: Buffer[],
  caption: string,
  accessToken: string,
  channelId: string
): Promise<YouTubePublishResult> {
  // Placeholder — YouTube Community post API integration coming soon.
  // The YouTube Data API v3 community post endpoint is not yet publicly
  // available for third-party apps. This will be implemented when the
  // API becomes accessible.
  return {
    success: false,
    error:
      "YouTube Community post publishing is coming soon. " +
      "Please export your carousel and upload it manually to YouTube.",
  };
}
