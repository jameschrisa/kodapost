import type { ImageSourceStrategy, SlideImageSource } from "./types";

type SlideType = "hook" | "story" | "closer";

/**
 * Returns the narrative role of a slide based on its position in the carousel.
 * - Position 0 is always the hook
 * - Last position is always the closer
 * - Everything in between is story
 */
function getSlideType(position: number, totalSlides: number): SlideType {
  if (position === 0) return "hook";
  if (position === totalSlides - 1) return "closer";
  return "story";
}

/**
 * Allocates images to slide positions using sequential assignment:
 * uploaded images fill slots left-to-right, and any remaining slots
 * become text-only (no image background).
 */
function sequentialAllocation(
  uploadedCount: number,
  totalSlides: number
): SlideImageSource[] {
  const allocation: SlideImageSource[] = [];

  for (let i = 0; i < totalSlides; i++) {
    if (i < uploadedCount) {
      allocation.push({
        slidePosition: i,
        source: "user_upload",
        referenceImageIndex: i,
      });
    } else {
      allocation.push({
        slidePosition: i,
        source: "text_only",
      });
    }
  }

  return allocation;
}

/**
 * Calculates the complete image source strategy for a carousel project.
 *
 * Determines how many slides use uploaded images vs text-only,
 * and produces a per-slide allocation plan.
 *
 * @param uploadedImageCount - Number of images the user has uploaded
 * @param targetSlideCount   - Total slides in the carousel (2–12)
 * @param allocationMode     - Algorithm for assigning images to slots
 * @returns A complete ImageSourceStrategy with ratio analysis and allocation
 */
export function calculateImageSourceStrategy(
  uploadedImageCount: number,
  targetSlideCount: number,
  allocationMode: "sequential" | "smart_auto" | "manual" = "sequential"
): ImageSourceStrategy {
  const uploaded = Math.min(uploadedImageCount, targetSlideCount);
  const textOnlyCount = Math.max(0, targetSlideCount - uploaded);
  const percentage = targetSlideCount > 0
    ? Math.round((uploaded / targetSlideCount) * 100)
    : 0;

  let sourceAllocation: SlideImageSource[];

  switch (allocationMode) {
    case "sequential":
      sourceAllocation = sequentialAllocation(uploaded, targetSlideCount);
      break;
    case "smart_auto":
    case "manual":
      // MVP: fall back to sequential for unimplemented modes
      sourceAllocation = sequentialAllocation(uploaded, targetSlideCount);
      break;
  }

  return {
    totalSlides: targetSlideCount,
    uploadedImages: uploaded,
    requiredAIGenerated: 0, // No AI generation — text-only for extra slides
    ratio: {
      uploaded,
      generated: textOnlyCount,
      percentage,
    },
    meetsRecommendation: uploaded > 0,
    sourceAllocation,
    allocationMode,
  };
}

export { getSlideType };
