/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Lemon8 Photo Posts — Carousel Publishing (Placeholder)
 *
 * Lemon8 supports multi-image photo posts with a vertical 3:4 format.
 * This adapter is a placeholder for future implementation using
 * the Lemon8 Content API.
 *
 * Requirements:
 * - Lemon8 creator account
 * - Lemon8 OAuth with content.publish scope
 * - Images: 3:4 (1080×1440) recommended for photo posts
 */

export interface Lemon8PublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

/**
 * Publish a photo carousel to Lemon8.
 *
 * @param images - Image buffers (1080×1440 JPEG)
 * @param caption - Post caption (max 2200 chars)
 * @param accessToken - Lemon8 OAuth access token
 */
export async function publishToLemon8(
  images: Buffer[],
  caption: string,
  accessToken: string
): Promise<Lemon8PublishResult> {
  // Placeholder — Lemon8 Content API integration coming soon.
  // Will use the Lemon8 developer API to create photo posts
  // with multiple images.
  return {
    success: false,
    error:
      "Lemon8 photo post publishing is coming soon. " +
      "Please export your carousel and upload it manually to Lemon8.",
  };
}
