/**
 * TikTok Content Posting API — Photo Carousel Publishing
 *
 * Flow:
 * 1. Initialize photo post with content/init endpoint
 * 2. Upload each image to the provided upload URLs
 * 3. Poll publish status until complete
 */

const TIKTOK_API = "https://open.tiktokapis.com";
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 3000;

export interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  error?: string;
}

/**
 * Publish a photo carousel to TikTok.
 *
 * @param images - Image buffers (JPEG recommended)
 * @param caption - Post description
 * @param accessToken - TikTok OAuth access token
 */
export async function publishToTikTok(
  images: Buffer[],
  caption: string,
  accessToken: string
): Promise<TikTokPublishResult> {
  try {
    if (images.length < 2 || images.length > 35) {
      return {
        success: false,
        error: `TikTok photo posts require 2-35 images, got ${images.length}`,
      };
    }

    // 1. Initialize the photo post
    const initRes = await fetch(`${TIKTOK_API}/v2/post/publish/content/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 2200),
          privacy_level: "SELF_ONLY", // Start as private, user can change in TikTok app
          disable_comment: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          media_type: "PHOTO",
          photo_cover_index: 0,
          photo_images: images.map(() => ({
            image_type: "JPEG",
          })),
        },
      }),
    });

    if (!initRes.ok) {
      const err = await initRes.text();
      return { success: false, error: `TikTok init failed: ${err}` };
    }

    const initData = await initRes.json();

    if (initData.error?.code !== "ok" && initData.error?.code) {
      return {
        success: false,
        error: `TikTok init error: ${initData.error.message || initData.error.code}`,
      };
    }

    if (!initData.data) {
      return {
        success: false,
        error: `TikTok init returned no data: ${JSON.stringify(initData).slice(0, 200)}`,
      };
    }

    const publishId = initData.data.publish_id;
    if (!publishId) {
      return {
        success: false,
        error: "TikTok did not return a publish ID",
      };
    }

    const uploadUrls: string[] = (initData.data.photo_images || []).map(
      (img: { upload_url: string }) => img.upload_url
    );

    if (uploadUrls.length !== images.length) {
      return {
        success: false,
        error: `TikTok returned ${uploadUrls.length} upload URLs but we have ${images.length} images`,
      };
    }

    // 2. Upload each image
    for (let i = 0; i < images.length; i++) {
      const uploadRes = await fetch(uploadUrls[i], {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": images[i].length.toString(),
        },
        body: new Uint8Array(images[i]),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        return { success: false, error: `Failed to upload image ${i + 1}: ${err}` };
      }
    }

    // 3. Poll publish status
    const result = await pollPublishStatus(publishId, accessToken);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "TikTok publish failed",
    };
  }
}

async function pollPublishStatus(
  publishId: string,
  accessToken: string
): Promise<TikTokPublishResult> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await fetch(`${TIKTOK_API}/v2/post/publish/status/fetch/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    if (res.ok) {
      const data = await res.json();
      const status = data.data?.status;

      if (status === "PUBLISH_COMPLETE") {
        return { success: true, publishId };
      }

      if (status === "FAILED") {
        return {
          success: false,
          publishId,
          error: `TikTok publish failed: ${data.data?.fail_reason || "unknown"}`,
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    success: false,
    publishId,
    error: "Timed out waiting for TikTok to process the post",
  };
}
