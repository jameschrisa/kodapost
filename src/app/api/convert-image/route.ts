import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches ImageUploader limit
const MAX_DIMENSION = 2048; // Cap output to 2048px on longest side
// Vercel response body limit is 4.5 MB. Keep well under with resized + compressed output.
const JPEG_QUALITY = 85;

/**
 * POST /api/convert-image
 *
 * Converts HEIC/HEIF images to JPEG (resized to max 2048px).
 * Accepts multipart form data with a single "file" field.
 * Returns the converted JPEG as a base64 data URI in JSON.
 *
 * Strategy: Try Sharp first (fast native path). If Sharp lacks the HEVC
 * codec for HEIC decoding, fall back to heic-convert (pure JS decoder),
 * then pass the raw JPEG through Sharp for resize + compression.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let decodedBuffer: Buffer;

    try {
      // Fast path: Sharp with native HEIC support (if codec is available)
      decodedBuffer = await sharp(inputBuffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    } catch (sharpError) {
      const msg =
        sharpError instanceof Error ? sharpError.message : String(sharpError);
      const isHeicCodecMissing =
        msg.includes("compression format") ||
        msg.includes("heif") ||
        msg.includes("unsupported") ||
        msg.includes("bad seek");

      if (!isHeicCodecMissing) throw sharpError; // Re-throw non-HEIC errors

      // Fallback: heic-convert (pure JS HEIC decoder) → raw JPEG bytes
      // NOTE: heic-convert v2 expects a Node Buffer (iterable), NOT an ArrayBuffer.
      console.info("[KodaPost] Sharp HEIC codec unavailable, using heic-convert fallback");
      const jpegResult = await heicConvert({
        buffer: inputBuffer as unknown as ArrayBufferLike,
        format: "JPEG",
        quality: 0.92,
      });

      // heic-convert outputs full-resolution JPEG. Pass through Sharp to
      // resize and compress so the response stays under Vercel's 4.5 MB limit.
      decodedBuffer = await sharp(Buffer.from(jpegResult))
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    }

    const base64 = decodedBuffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUri,
      format: "jpeg",
      originalSize: file.size,
      convertedSize: decodedBuffer.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    console.error("[KodaPost] Image conversion error:", message);

    // Provide a user-friendly error for common failure modes
    let userMessage = "Image conversion failed. The file may be corrupted or in an unsupported format.";
    if (message.includes("Input buffer contains unsupported image format")) {
      userMessage = "This image format is not supported. Please use JPEG, PNG, WebP, or HEIC.";
    } else if (message.includes("memory")) {
      userMessage = "Image is too large to process. Try a smaller file.";
    }

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
