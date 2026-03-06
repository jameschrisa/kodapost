import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import heicConvert from "heic-convert";

export const maxDuration = 60;
const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches ImageUploader limit
const MAX_DIMENSION = 2048; // Cap output to 2048px on longest side
// Vercel response body limit is 4.5 MB. Keep well under with resized + compressed output.
const JPEG_QUALITY = 85;

function memMB(): string {
  const { rss, heapUsed } = process.memoryUsage();
  return `rss=${(rss / 1024 / 1024).toFixed(0)}MB heap=${(heapUsed / 1024 / 1024).toFixed(0)}MB`;
}

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
  // Require auth when Clerk is enabled to prevent resource abuse
  if (isClerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const requestId = Math.random().toString(36).slice(2, 8);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = file instanceof File ? file.name : "unknown";
    console.info(
      `[convert-image][${requestId}] START file=${fileName} size=${(file.size / 1024).toFixed(0)}KB ${memMB()}`
    );

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    console.info(
      `[convert-image][${requestId}] Buffer ready ${memMB()} +${Date.now() - startTime}ms`
    );

    let decodedBuffer: Buffer;
    let conversionPath: string;

    try {
      // Fast path: Sharp with native HEIC support (if codec is available)
      decodedBuffer = await sharp(inputBuffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
      conversionPath = "sharp-native";
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
      console.info(
        `[convert-image][${requestId}] Sharp HEIC codec unavailable, using heic-convert fallback ${memMB()}`
      );

      const heicStart = Date.now();
      let jpegRaw: Buffer = Buffer.from(
        await heicConvert({
          buffer: inputBuffer as unknown as ArrayBufferLike,
          format: "JPEG",
          quality: 0.92,
        })
      );
      console.info(
        `[convert-image][${requestId}] heic-convert done rawJpeg=${(jpegRaw.length / 1024 / 1024).toFixed(1)}MB +${Date.now() - heicStart}ms ${memMB()}`
      );

      // heic-convert outputs full-resolution JPEG. Pass through Sharp to
      // resize and compress so the response stays under Vercel's 4.5 MB limit.
      const resizeStart = Date.now();
      decodedBuffer = await sharp(jpegRaw)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
      // Release the full-res buffer immediately to reduce memory pressure
      jpegRaw = Buffer.alloc(0);
      console.info(
        `[convert-image][${requestId}] Sharp resize done output=${(decodedBuffer.length / 1024).toFixed(0)}KB +${Date.now() - resizeStart}ms ${memMB()}`
      );
      conversionPath = "heic-convert+sharp";
    }

    const base64 = decodedBuffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;

    const totalMs = Date.now() - startTime;
    console.info(
      `[convert-image][${requestId}] SUCCESS path=${conversionPath} original=${(file.size / 1024).toFixed(0)}KB output=${(decodedBuffer.length / 1024).toFixed(0)}KB responseBody=${(dataUri.length / 1024).toFixed(0)}KB total=${totalMs}ms ${memMB()}`
    );

    return NextResponse.json({
      success: true,
      dataUri,
      format: "jpeg",
      originalSize: file.size,
      convertedSize: decodedBuffer.length,
      debug: {
        requestId,
        conversionPath,
        totalMs,
        heapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    const stack = error instanceof Error ? error.stack : undefined;
    const totalMs = Date.now() - startTime;

    console.error(
      `[convert-image][${requestId}] FAILED after ${totalMs}ms: ${message} ${memMB()}`
    );
    if (stack) {
      console.error(`[convert-image][${requestId}] Stack: ${stack}`);
    }

    // Provide a user-friendly error for common failure modes
    let userMessage = "Image conversion failed. The file may be corrupted or in an unsupported format.";
    if (message.includes("Input buffer contains unsupported image format")) {
      userMessage = "This image format is not supported. Please use JPEG, PNG, WebP, or HEIC.";
    } else if (message.includes("memory") || message.includes("heap") || message.includes("allocation")) {
      userMessage = "Image is too large to process on the server. Try a smaller file or use Safari which converts HEIC natively.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        debug: { requestId, totalMs, serverError: message },
      },
      { status: 500 }
    );
  }
}
