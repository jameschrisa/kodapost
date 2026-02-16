import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CarouselProject } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a deterministic hash string from generation-affecting project fields.
 * Used to detect whether re-generation is needed when returning to the Configure step.
 */
export function computeConfigHash(project: CarouselProject): string {
  const relevantFields = {
    theme: project.theme,
    keywords: project.keywords,
    slideCount: project.slideCount,
    cameraProfileId: project.cameraProfileId,
    analogCreativityMode: project.analogCreativityMode,
    imageAllocationMode: project.imageAllocationMode,
    targetPlatforms: project.targetPlatforms,
    captionStyle: project.captionStyle,
    filterConfig: project.filterConfig,
    globalOverlayStyle: project.globalOverlayStyle,
    uploadedImageIds: project.uploadedImages.map(img => img.id),
    csvOverrides: project.csvOverrides,
    storyTranscription: project.storyTranscription,
  };
  return JSON.stringify(relevantFields);
}

// =============================================================================
// Image Conversion Helpers
// =============================================================================

/**
 * Converts a blob URL to a base64 data URI.
 * This is necessary because blob: URLs only exist in the browser's memory
 * and cannot be sent to server actions or external APIs.
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Parses a base64 data URI into its components.
 * Returns the media type and raw base64 data.
 * e.g. "data:image/jpeg;base64,/9j/4AAQ..." → { mediaType: "image/jpeg", data: "/9j/4AAQ..." }
 */
export function parseDataUri(dataUri: string): { mediaType: string; data: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

// =============================================================================
// Color Helpers
// =============================================================================

/**
 * Determines if a hex color is "light" (high perceived brightness).
 * Uses the YIQ formula for perceived brightness.
 * Returns true for light colors (like #FFFFFF), false for dark (like #1A1A1A).
 * Used to conditionally apply text shadows — shadows only on light text.
 */
export function isLightColor(hex: string): boolean {
  // Strip # prefix if present
  const clean = hex.replace(/^#/, "");
  if (clean.length < 6) return true; // fallback for short/invalid values
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // YIQ perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// =============================================================================
// Error Handling Helpers
// =============================================================================

/**
 * Extracts a human-readable message from any error type.
 * Handles Error instances, string errors, API error shapes, and unknowns.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Logs an API error to the console with context and returns
 * a user-friendly message. Used in server actions and client code.
 */
export function handleAPIError(error: unknown): string {
  const message = formatError(error);
  console.error("[KodaPost API Error]", message, error);
  return message;
}
