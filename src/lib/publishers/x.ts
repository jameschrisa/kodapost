/**
 * X (Twitter) — Image Post Publishing (Placeholder)
 *
 * X/Twitter supports posting images via the v2 API using media upload
 * (chunked INIT/APPEND/FINALIZE) followed by tweet creation with
 * media_ids attached. Full implementation pending.
 */

export interface XPublishResult {
  success: boolean;
  postUrl?: string;
  tweetId?: string;
  error?: string;
}

/**
 * Publish an image post to X (Twitter).
 *
 * @param images - Image buffers (1080×1350 JPEG for 4:5 format)
 * @param caption - Tweet text (max 280 chars)
 * @param accessToken - X OAuth2 access token
 */
export async function publishToX(
  images: Buffer[],
  caption: string,
  accessToken: string
): Promise<XPublishResult> {
  // Placeholder — X API v2 media upload integration coming soon.
  // Will use POST /2/tweets with media.media_ids after chunked upload.
  void images;
  void caption;
  void accessToken;
  return {
    success: false,
    error:
      "X publishing is coming soon. " +
      "Please export your carousel and post it manually to X.",
  };
}
