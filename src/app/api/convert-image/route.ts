import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import heicConvert from "heic-convert";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches ImageUploader limit

/**
 * POST /api/convert-image
 *
 * Converts HEIC/HEIF images to JPEG.
 * Accepts multipart form data with a single "file" field.
 * Returns the converted JPEG as a base64 data URI in JSON.
 *
 * Strategy: Try Sharp first (fast native path). If Sharp lacks the HEVC
 * codec for HEIC decoding, fall back to heic-convert (pure JS decoder).
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

    let outputBuffer: Buffer;

    try {
      // Fast path: Sharp with native HEIC support (if codec is available)
      outputBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 92 })
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

      // Fallback: heic-convert (pure JS HEIC decoder) → JPEG bytes
      // NOTE: heic-convert v2 expects a Node Buffer (iterable), NOT an ArrayBuffer.
      // Passing ArrayBuffer causes "Spread syntax requires ...iterable" errors.
      console.info("[KodaPost] Sharp HEIC codec unavailable, using heic-convert fallback");
      const jpegResult = await heicConvert({
        buffer: inputBuffer as unknown as ArrayBufferLike,
        format: "JPEG",
        quality: 0.92,
      });

      outputBuffer = Buffer.from(jpegResult);
    }

    const base64 = outputBuffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUri,
      format: "jpeg",
      originalSize: file.size,
      convertedSize: outputBuffer.length,
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
