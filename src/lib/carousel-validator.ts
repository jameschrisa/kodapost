import type { CarouselProject, ValidationResult } from "./types";

const MIN_SLIDES = 2;
const MAX_SLIDES = 12;

/**
 * Validates a carousel project for generation readiness.
 *
 * Checks required fields, slide count bounds, and image uploads.
 * Extra slides beyond uploaded image count become text-only (no AI generation).
 * Returns blocking errors, non-blocking warnings, and whether generation can proceed.
 */
export function validateCarouselReadiness(
  project: CarouselProject
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. At least 1 uploaded image
  if (project.uploadedImages.length === 0) {
    errors.push("At least 1 image must be uploaded before generating.");
  }

  // 2. Slide count bounds
  if (project.slideCount < MIN_SLIDES) {
    errors.push(`Slide count must be at least ${MIN_SLIDES}. Currently: ${project.slideCount}.`);
  } else if (project.slideCount > MAX_SLIDES) {
    errors.push(`Slide count cannot exceed ${MAX_SLIDES}. Currently: ${project.slideCount}.`);
  }

  // 3. Theme is provided
  if (!project.theme || project.theme.trim().length === 0) {
    errors.push("A theme must be selected before generating.");
  }

  // 4. Camera style is selected (0 = "No Emulation", 1-10 = camera profiles)
  if (project.cameraProfileId === undefined || project.cameraProfileId === null || project.cameraProfileId < 0) {
    errors.push("A camera style must be selected.");
  }

  // 5. Warn if some slides will be text-only (no image background)
  if (
    project.uploadedImages.length > 0 &&
    project.slideCount > project.uploadedImages.length
  ) {
    const textOnlyStart = project.uploadedImages.length + 1;
    const textOnlyEnd = project.slideCount;
    warnings.push(
      `Slides ${textOnlyStart}–${textOnlyEnd} will be text-only (no background image). ` +
      `Upload more photos or reduce slide count for full image coverage.`
    );
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    canProceed: valid,
  };
}
