import type { Bot } from "grammy";
import type { UploadedImage } from "@/lib/types";

// =============================================================================
// Telegram Bot Helper Utilities
//
// Functions for downloading photos from Telegram and converting them into
// the UploadedImage format expected by the KodaPost generation pipeline.
// =============================================================================

/**
 * Downloads a photo from Telegram by file_id and converts it to an UploadedImage
 * with a base64 data URI (same format as the web UI uploads).
 */
export async function downloadTelegramPhoto(
  bot: Bot,
  fileId: string,
  index: number
): Promise<UploadedImage> {
  // Get file info from Telegram
  const file = await bot.api.getFile(fileId);

  if (!file.file_path) {
    throw new Error(`No file_path returned for Telegram file_id: ${fileId}`);
  }

  // Build the download URL
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  // Download the file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download Telegram photo: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  // Determine mime type from file path
  const ext = file.file_path.split(".").pop()?.toLowerCase() || "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const mimeType = mimeMap[ext] || "image/jpeg";

  return {
    id: `tg-img-${index}`,
    url: `data:${mimeType};base64,${base64}`,
    filename: `telegram-photo-${index}.${ext}`,
    uploadedAt: new Date().toISOString(),
    usedInSlides: [],
  };
}

/**
 * Converts a Telegram photo (already downloaded as a Buffer) to an UploadedImage.
 */
export function telegramPhotoToUploadedImage(
  buffer: Buffer,
  index: number,
  mimeType: string = "image/jpeg"
): UploadedImage {
  const base64 = buffer.toString("base64");
  const ext = mimeType.split("/")[1] || "jpg";

  return {
    id: `tg-img-${index}`,
    url: `data:${mimeType};base64,${base64}`,
    filename: `telegram-photo-${index}.${ext}`,
    uploadedAt: new Date().toISOString(),
    usedInSlides: [],
  };
}
