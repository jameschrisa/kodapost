/**
 * Instagram Graph API — Carousel Publishing
 *
 * Flow:
 * 1. Upload each image as a carousel item (requires publicly accessible URL)
 * 2. Create carousel container with all item IDs
 * 3. Publish the carousel container
 * 4. Poll until publish completes
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2000;

export interface InstagramPublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}

/**
 * Publish a photo carousel to Instagram.
 *
 * @param imageUrls - Publicly accessible URLs for each image
 * @param caption - Post caption (max 2200 chars)
 * @param accessToken - Long-lived Instagram access token
 * @param igUserId - Instagram Business Account ID
 */
export async function publishToInstagram(
  imageUrls: string[],
  caption: string,
  accessToken: string,
  igUserId: string
): Promise<InstagramPublishResult> {
  try {
    if (!igUserId) {
      return { success: false, error: "Instagram Business Account ID is missing. Please reconnect in Settings." };
    }

    if (imageUrls.length < 2 || imageUrls.length > 10) {
      return {
        success: false,
        error: `Instagram carousels require 2-10 images, got ${imageUrls.length}`,
      };
    }

    // 1. Create individual carousel items
    const itemCreationIds: string[] = [];

    for (const url of imageUrls) {
      const res = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Failed to create carousel item: ${err}` };
      }

      const data = await res.json();
      if (!data.id) {
        return {
          success: false,
          error: `Instagram API did not return a media ID: ${JSON.stringify(data.error || data).slice(0, 200)}`,
        };
      }
      itemCreationIds.push(data.id);
    }

    // 2. Create the carousel container
    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption,
        children: itemCreationIds.join(","),
        access_token: accessToken,
      }),
    });

    if (!containerRes.ok) {
      const err = await containerRes.text();
      return { success: false, error: `Failed to create carousel container: ${err}` };
    }

    const containerData = await containerRes.json();
    const containerId = containerData.id;

    if (!containerId) {
      return {
        success: false,
        error: `Instagram did not return a container ID: ${JSON.stringify(containerData.error || containerData).slice(0, 200)}`,
      };
    }

    // 3. Wait for container to be ready, then publish
    await waitForContainerReady(containerId, accessToken);

    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      const err = await publishRes.text();
      return { success: false, error: `Failed to publish carousel: ${err}` };
    }

    const publishData = await publishRes.json();
    const postId = publishData.id;

    // 4. Get the permalink
    let permalink: string | undefined;
    try {
      const mediaRes = await fetch(
        `${GRAPH_API}/${postId}?fields=permalink&access_token=${accessToken}`
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        permalink = mediaData.permalink;
      }
    } catch {
      // Permalink fetch is non-critical
    }

    return { success: true, postId, permalink };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Instagram publish failed",
    };
  }
}

async function waitForContainerReady(
  containerId: string,
  accessToken: string
): Promise<void> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status_code === "FINISHED") return;
      if (data.status_code === "ERROR") {
        throw new Error(`Container processing failed: ${data.status || "unknown error"}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for Instagram to process images");
}
