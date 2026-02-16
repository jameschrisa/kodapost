import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authenticateApiKey } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import {
  generateId,
  validateGenerateConfig,
} from "@/lib/api/helpers";
import { processGenerationJob } from "@/lib/api/generate-pipeline";
import type { UploadedImage } from "@/lib/types";

// Allow up to 60s on Vercel Hobby, 300s on Pro
export const maxDuration = 60;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_IMAGES = 12;

/**
 * POST /api/v1/generate
 *
 * Main carousel generation endpoint. Accepts multipart/form-data with:
 *   - config (string): JSON configuration object
 *   - images (files, multiple): JPEG, PNG, or WebP image files
 *
 * Runs the full pipeline synchronously within the request:
 *   1. Analyze images (Claude Vision)
 *   2. Generate carousel (text overlays via Claude)
 *   3. Composite slides (Sharp)
 *   4. Generate caption (Claude)
 *
 * Returns the completed result with composited images as base64.
 */
export async function POST(request: NextRequest) {
  // -------------------------------------------------------------------------
  // 1. Authentication
  // -------------------------------------------------------------------------
  const auth = await authenticateApiKey(request);
  if (!auth.success) return auth.response;

  // -------------------------------------------------------------------------
  // 2. Parse multipart form data
  // -------------------------------------------------------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request. Expected multipart/form-data with 'config' and 'images' fields.",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Parse config JSON
  const configRaw = formData.get("config");
  if (!configRaw || typeof configRaw !== "string") {
    return NextResponse.json(
      {
        error: 'Missing "config" field. Provide a JSON string with theme and platforms.',
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  let parsedConfigJson: unknown;
  try {
    parsedConfigJson = JSON.parse(configRaw);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in config field", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const validation = validateGenerateConfig(parsedConfigJson);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: validation.errors,
      },
      { status: 400 }
    );
  }
  const config = validation.parsed!;

  // Parse image files
  const imageFiles = formData.getAll("images") as File[];
  if (imageFiles.length === 0) {
    return NextResponse.json(
      {
        error: 'No images provided. Add one or more image files as "images" fields.',
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  if (imageFiles.length > MAX_IMAGES) {
    return NextResponse.json(
      {
        error: `Too many images. Maximum is ${MAX_IMAGES}.`,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Validate each image
  for (const file of imageFiles) {
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid image file in upload", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Image "${file.name}" exceeds 10 MB limit`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Image "${file.name}" has unsupported type "${file.type}". Accepted: JPEG, PNG, WebP.`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }
  }

  // -------------------------------------------------------------------------
  // 3. Convert uploaded files to base64 data URIs (UploadedImage format)
  // -------------------------------------------------------------------------
  const uploadedImages: UploadedImage[] = await Promise.all(
    imageFiles.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";

      return {
        id: `api-img-${index}`,
        url: `data:${mimeType};base64,${base64}`,
        filename: file.name || `image-${index}.jpg`,
        uploadedAt: new Date().toISOString(),
        usedInSlides: [],
      };
    })
  );

  // -------------------------------------------------------------------------
  // 4. Create job record
  // -------------------------------------------------------------------------
  const db = getDb();
  const jobId = generateId("job");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.insert(jobs).values({
    id: jobId,
    apiKeyId: auth.data.apiKeyId,
    status: "pending",
    inputConfig: {
      theme: config.theme,
      platforms: config.platforms,
      slideCount: config.slideCount,
      keywords: config.keywords,
      imageCount: uploadedImages.length,
    } as unknown as Record<string, unknown>,
    createdAt: now.toISOString(),
    expiresAt,
  });

  // -------------------------------------------------------------------------
  // 5. Run generation pipeline (synchronous within this request)
  // -------------------------------------------------------------------------
  await processGenerationJob(jobId, config, uploadedImages);

  // -------------------------------------------------------------------------
  // 6. Return result
  // -------------------------------------------------------------------------
  const [completedJob] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!completedJob) {
    return NextResponse.json(
      { error: "Job record not found", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  if (completedJob.status === "completed") {
    return NextResponse.json({
      jobId,
      status: "completed",
      result: completedJob.result,
    });
  }

  // Job failed
  return NextResponse.json(
    {
      jobId,
      status: completedJob.status,
      error: completedJob.error || "Generation failed",
      code: "GENERATION_FAILED",
    },
    { status: 500 }
  );
}
