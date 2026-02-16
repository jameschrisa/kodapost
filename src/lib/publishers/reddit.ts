/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Reddit Gallery Posts — Carousel Publishing (Placeholder)
 *
 * Reddit supports gallery posts (multiple images in a single post)
 * via the Reddit API. This adapter is a placeholder for future
 * implementation using the Reddit OAuth2 API.
 *
 * Requirements:
 * - Reddit account with posting permissions
 * - Reddit OAuth with submit and identity scopes
 * - Images: 1:1 (1200×1200) recommended for gallery posts
 */

export interface RedditPublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

/**
 * Publish an image gallery to a Reddit subreddit.
 *
 * @param images - Image buffers (1200×1200 PNG)
 * @param caption - Post title (max 300 chars)
 * @param accessToken - Reddit OAuth access token
 * @param subreddit - Target subreddit name (without r/)
 */
export async function publishToReddit(
  images: Buffer[],
  caption: string,
  accessToken: string,
  subreddit: string
): Promise<RedditPublishResult> {
  // Placeholder — Reddit gallery post API integration coming soon.
  // Will use the Reddit API's /api/submit endpoint with kind=gallery
  // to create multi-image gallery posts.
  return {
    success: false,
    error:
      "Reddit gallery post publishing is coming soon. " +
      "Please export your carousel and upload it manually to Reddit.",
  };
}
