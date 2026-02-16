import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import {
  analyzeImage,
  generateCarousel,
  compositeSlideImages,
  generateCaption,
} from "@/app/actions";
import { mapToCarouselProject } from "@/lib/api/helpers";
import type { GenerateConfig } from "@/lib/api/helpers";
import type { UploadedImage } from "@/lib/types";

// =============================================================================
// Generation Pipeline
//
// Orchestrates the existing server actions into a linear pipeline for the
// headless API. Reuses analyzeImage, generateCarousel, compositeSlideImages,
// and generateCaption from src/app/actions.ts without any duplication.
// =============================================================================

/** The shape of the result stored in the jobs table */
export interface GenerationResult {
  caption: string | null;
  slides: {
    platform: string;
    slideIndex: number;
    imageBase64: string;
    format: "jpeg" | "png";
  }[];
  slideCount: number;
  platforms: string[];
}

/**
 * Runs the full generation pipeline for a job:
 * 1. Analyze each image (Claude Vision)
 * 2. Generate carousel (text overlays via Claude)
 * 3. Composite slide images (Sharp)
 * 4. Generate caption (Claude)
 *
 * Updates the job record in the database as each step completes.
 * On failure, sets the job status to "failed" with an error message.
 */
export async function processGenerationJob(
  jobId: string,
  config: GenerateConfig,
  uploadedImages: UploadedImage[]
): Promise<void> {
  const db = getDb();

  /** Helper to update job record */
  async function updateJob(
    updates: Partial<typeof jobs.$inferInsert>
  ): Promise<void> {
    await db.update(jobs).set(updates).where(eq(jobs.id, jobId));
  }

  try {
    await updateJob({
      status: "processing",
      startedAt: new Date().toISOString(),
      currentStep: "analyzing",
      progress: 5,
    });

    // -------------------------------------------------------------------------
    // Step 1: Analyze each image with Claude Vision
    // -------------------------------------------------------------------------
    for (let i = 0; i < uploadedImages.length; i++) {
      try {
        const result = await analyzeImage(uploadedImages[i].url);
        if (result.success) {
          uploadedImages[i].analysis = result.data;
        }
      } catch {
        // Non-fatal: image analysis is optional, generation can proceed
        console.warn(
          `[KodaPost API] Image analysis failed for ${uploadedImages[i].filename}, continuing`
        );
      }
      await updateJob({
        progress:
          5 + Math.round(((i + 1) / uploadedImages.length) * 25),
      });
    }

    // -------------------------------------------------------------------------
    // Step 2: Build project and generate carousel (text overlays)
    // -------------------------------------------------------------------------
    await updateJob({ currentStep: "generating", progress: 30 });

    const project = mapToCarouselProject(config, uploadedImages);
    const carouselResult = await generateCarousel(project);

    if (!carouselResult.success) {
      await updateJob({
        status: "failed",
        error: carouselResult.error,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    await updateJob({ progress: 55 });

    // -------------------------------------------------------------------------
    // Step 3: Composite slide images with Sharp
    // -------------------------------------------------------------------------
    await updateJob({ currentStep: "compositing", progress: 60 });

    const readySlides = carouselResult.data.slides.filter(
      (s) => s.status === "ready"
    );

    if (readySlides.length === 0) {
      await updateJob({
        status: "failed",
        error: "No slides were generated successfully",
        completedAt: new Date().toISOString(),
      });
      return;
    }

    const compositeResult = await compositeSlideImages(
      readySlides,
      config.platforms,
      carouselResult.data.filterConfig
    );

    if (!compositeResult.success) {
      await updateJob({
        status: "failed",
        error: compositeResult.error,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    await updateJob({ progress: 85 });

    // -------------------------------------------------------------------------
    // Step 4: Generate caption
    // -------------------------------------------------------------------------
    await updateJob({ currentStep: "captioning", progress: 85 });

    let caption: string | null = null;
    try {
      const captionResult = await generateCaption(
        config.theme,
        config.keywords || []
      );
      if (captionResult.success) {
        caption = captionResult.data;
      }
    } catch {
      // Non-fatal: caption generation is optional
      console.warn("[KodaPost API] Caption generation failed, continuing");
    }

    // -------------------------------------------------------------------------
    // Step 5: Store result
    // -------------------------------------------------------------------------
    const result: GenerationResult = {
      caption,
      slides: compositeResult.data.map((s) => ({
        platform: s.platform,
        slideIndex: s.slideIndex,
        imageBase64: s.imageBase64,
        format: s.format,
      })),
      slideCount: readySlides.length,
      platforms: config.platforms,
    };

    await updateJob({
      status: "completed",
      result: result as unknown as Record<string, unknown>,
      progress: 100,
      currentStep: "done",
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation pipeline failed";
    console.error("[KodaPost API] Pipeline error:", message);

    await updateJob({
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    }).catch(() => {
      // If even the job update fails, there's nothing we can do
    });
  }
}
