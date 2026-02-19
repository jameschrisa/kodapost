import { DEFAULT_GLOBAL_OVERLAY_STYLE } from "./constants";
import type { CarouselProject, ValidationResult } from "./types";

const MIN_SLIDES = 2;
const MAX_SLIDES = 12;

/**
 * Validates a carousel project for generation readiness.
 *
 * Checks required fields, slide count bounds, image uploads, headline coverage,
 * and caption presence. Returns blocking errors, non-blocking warnings, and
 * whether generation can proceed.
 */
export function validateCarouselReadiness(
  project: CarouselProject
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const postMode = project.postMode ?? "carousel";
  const showHeadline = project.globalOverlayStyle?.showHeadline ?? DEFAULT_GLOBAL_OVERLAY_STYLE.showHeadline;

  // 1. At least 1 uploaded image
  if (project.uploadedImages.length === 0) {
    errors.push("At least 1 image must be uploaded before generating.");
  }

  // 2. Slide count bounds (only for carousel mode)
  if (postMode === "carousel") {
    if (project.slideCount < MIN_SLIDES) {
      errors.push(`Slide count must be at least ${MIN_SLIDES}. Currently: ${project.slideCount}.`);
    } else if (project.slideCount > MAX_SLIDES) {
      errors.push(`Slide count cannot exceed ${MAX_SLIDES}. Currently: ${project.slideCount}.`);
    }
  }

  // 3. Story / theme is provided
  if (!project.theme || project.theme.trim().length === 0) {
    errors.push("Tell your story first — describe the moment or feeling you want to share.");
  }

  // 4. Caption is required for both single posts and carousels
  if (!project.caption || project.caption.trim().length === 0) {
    errors.push("A social caption is required. Write your own or generate one from your story.");
  }

  // 5. Carousel-specific: slides without images must have headline coverage
  if (postMode === "carousel") {
    const imageCount = project.uploadedImages.length;
    const emptySlideCount = Math.max(0, project.slideCount - imageCount);

    if (emptySlideCount > 0 && !showHeadline) {
      // Slides without images AND headline disabled = empty slides (blocked)
      errors.push(
        `${emptySlideCount} slide${emptySlideCount !== 1 ? "s" : ""} will have no image and no headline. ` +
        `Enable headline text or upload more images to cover all slides.`
      );
    } else if (emptySlideCount > 0 && showHeadline) {
      // Warn that some slides are text-only
      const textOnlyStart = imageCount + 1;
      const textOnlyEnd = project.slideCount;
      warnings.push(
        `Slides ${textOnlyStart}–${textOnlyEnd} will be text-only with headline overlays (no background image). ` +
        `Upload more photos or reduce slide count for full image coverage.`
      );
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    canProceed: valid,
  };
}
