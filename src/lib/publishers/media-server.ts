/**
 * Temporary Image Hosting for Instagram
 *
 * Instagram's Graph API requires publicly accessible image URLs for carousel uploads.
 * This module writes images to /tmp/ and generates URLs that map to our media API route.
 */

import { writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const TMP_PREFIX = "nf-media-";

/**
 * Save images to a temporary directory and return URL paths for them.
 *
 * @param images - Image buffers to save
 * @param baseUrl - App base URL (e.g., "http://localhost:3000")
 * @returns Object with image URLs and the temp directory path for cleanup
 */
export async function saveTemporaryImages(
  images: Buffer[],
  baseUrl: string
): Promise<{ urls: string[]; tempDir: string }> {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const dirName = `${TMP_PREFIX}${sessionId}`;
  const tempDir = path.join("/tmp", dirName);

  await mkdir(tempDir, { recursive: true });

  const urls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const filename = `slide-${i + 1}-${sessionId}.jpg`;
    const filePath = path.join(tempDir, filename);
    await writeFile(filePath, images[i]);
    urls.push(`${baseUrl}/api/media/${filename}`);
  }

  return { urls, tempDir };
}

/**
 * Clean up temporary image files after publishing.
 */
export async function cleanupTemporaryImages(tempDir: string): Promise<void> {
  try {
    if (existsSync(tempDir) && tempDir.includes(TMP_PREFIX)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Non-critical — temp files will be cleaned up by OS eventually
  }
}
