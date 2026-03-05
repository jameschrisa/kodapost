import type { Bot } from "grammy";
import sharp from "sharp";
import type { UploadedImage } from "@/lib/types";

// =============================================================================
// Telegram Bot Helper Utilities
//
// Functions for downloading photos from Telegram and converting them into
// the UploadedImage format expected by the KodaPost generation pipeline.
// =============================================================================

/** Max dimension on longest side (matches web UI client-side resize) */
const MAX_DIMENSION = 2048;
/** JPEG quality for resized output */
const JPEG_QUALITY = 85;

/**
 * Resizes an image buffer to max 2048px on longest side and compresses to JPEG.
 * This matches the client-side resize applied to web uploads, keeping Telegram
 * photos at parity and well under Vercel's 4.5 MB response limit.
 */
async function resizeToJpeg(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

/**
 * Downloads a photo from Telegram by file_id, resizes it to max 2048px,
 * and converts to an UploadedImage with a base64 data URI.
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
  const rawBuffer = Buffer.from(arrayBuffer);

  // Resize to max 2048px JPEG (same as web client-side resize)
  const resizedBuffer = await resizeToJpeg(rawBuffer);
  const base64 = resizedBuffer.toString("base64");

  return {
    id: `tg-img-${index}`,
    url: `data:image/jpeg;base64,${base64}`,
    filename: `telegram-photo-${index}.jpg`,
    uploadedAt: new Date().toISOString(),
    usedInSlides: [],
  };
}

/**
 * Converts a Telegram photo (already downloaded as a Buffer) to an UploadedImage.
 * Resizes to max 2048px JPEG.
 */
export async function telegramPhotoToUploadedImage(
  buffer: Buffer,
  index: number
): Promise<UploadedImage> {
  const resizedBuffer = await resizeToJpeg(buffer);
  const base64 = resizedBuffer.toString("base64");

  return {
    id: `tg-img-${index}`,
    url: `data:image/jpeg;base64,${base64}`,
    filename: `telegram-photo-${index}.jpg`,
    uploadedAt: new Date().toISOString(),
    usedInSlides: [],
  };
}
