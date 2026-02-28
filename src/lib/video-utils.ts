/**
 * Video generation utilities for rendering carousel slides into video frames.
 *
 * Handles timing calculations, canvas-based frame rendering with transitions,
 * and image decoding for the video generation pipeline.
 *
 * Supports per-slide duration overrides: individual slides can have custom
 * durations while the remaining slides share the default/auto-calculated time.
 */

import type { AudioClip, SlideTransition, VideoSettings } from "./types";

// -----------------------------------------------------------------------------
// Timing Calculations
// -----------------------------------------------------------------------------

export interface VideoTiming {
  /** Total video duration in seconds */
  totalDuration: number;
  /** Default duration per slide (used for slides without overrides) */
  defaultSlideDuration: number;
  /** Per-slide durations array (length = slideCount). Each entry is the
   *  effective duration for that slide index, accounting for overrides. */
  slideDurations: number[];
  /** Duration of transition between slides in seconds */
  transitionDuration: number;
  /** Total number of frames */
  totalFrames: number;
  /** Frames per second */
  fps: number;
  /** Cumulative start times for each slide (length = slideCount).
   *  Precomputed for efficient frame lookup. */
  slideStartTimes: number[];
}

/**
 * Calculate video timing based on slide count, audio, settings, and
 * optional per-slide duration overrides.
 *
 * In "match-audio" mode: default slide duration is auto-calculated to fill
 * the audio length (after subtracting time claimed by overridden slides).
 * In "custom" mode: uses the explicit slideDuration setting as the default.
 *
 * Transition time is "shared" — the transition overlaps between two slides,
 * so total time = sum(slideDurations) - ((slideCount - 1) × transitionDuration).
 */
export function calculateVideoTiming(
  slideCount: number,
  audioClip: AudioClip | undefined,
  settings: VideoSettings,
  /** Per-slide duration overrides. Array index = slide index.
   *  `undefined` entries use the default duration. */
  slideOverrides?: (number | undefined)[]
): VideoTiming {
  const { fps, transitionDuration: rawTransDur } = settings;
  const transitionDuration = slideCount > 1 ? rawTransDur : 0;

  // Count overrides vs auto slides
  const overrides = slideOverrides ?? [];
  let overrideCount = 0;
  let totalOverrideTime = 0;
  for (let i = 0; i < slideCount; i++) {
    const ov = overrides[i];
    if (ov !== undefined && ov > 0) {
      overrideCount++;
      totalOverrideTime += ov;
    }
  }
  const autoCount = slideCount - overrideCount;

  // Calculate default slide duration
  let defaultSlideDuration: number;

  if (settings.timingMode === "match-audio" && audioClip) {
    // Calculate effective audio duration (trimmed)
    const audioStart = audioClip.trimStart ?? 0;
    const audioEnd = audioClip.trimEnd ?? audioClip.duration;
    const audioDuration = Math.max(1, audioEnd - audioStart);

    // Total "slide time" budget (transitions overlap, so each saves transitionDuration)
    const totalAvailable = audioDuration + (slideCount - 1) * transitionDuration;

    if (autoCount > 0) {
      // Distribute remaining time evenly across non-overridden slides
      const remainingForAuto = totalAvailable - totalOverrideTime;
      defaultSlideDuration = Math.max(1, remainingForAuto / autoCount);
    } else {
      // All slides have overrides — use the average override as default (for display)
      defaultSlideDuration = slideCount > 0 ? totalOverrideTime / slideCount : settings.slideDuration;
    }
  } else {
    defaultSlideDuration = settings.slideDuration;
  }

  // Build per-slide durations array
  const slideDurations: number[] = [];
  for (let i = 0; i < slideCount; i++) {
    const ov = overrides[i];
    slideDurations.push(ov !== undefined && ov > 0 ? ov : defaultSlideDuration);
  }

  // Ensure transition doesn't exceed half the shortest slide duration
  const minDuration = slideDurations.length > 0 ? Math.min(...slideDurations) : defaultSlideDuration;
  const effectiveTransition = Math.min(transitionDuration, minDuration / 2);

  // Compute cumulative start times (accounting for overlapping transitions)
  const slideStartTimes: number[] = [];
  for (let i = 0; i < slideCount; i++) {
    if (i === 0) {
      slideStartTimes.push(0);
    } else {
      slideStartTimes.push(slideStartTimes[i - 1] + slideDurations[i - 1] - effectiveTransition);
    }
  }

  // Total duration = last slide start + last slide duration
  const totalDuration = slideCount > 0
    ? slideStartTimes[slideCount - 1] + slideDurations[slideCount - 1]
    : 0;
  const totalFrames = Math.ceil(totalDuration * fps);

  return {
    totalDuration,
    defaultSlideDuration,
    slideDurations,
    transitionDuration: effectiveTransition,
    totalFrames,
    fps,
    slideStartTimes,
  };
}

// -----------------------------------------------------------------------------
// Image Decoding
// -----------------------------------------------------------------------------

/**
 * Convert a base64-encoded image string to an ImageBitmap for fast canvas drawing.
 * ImageBitmap is decoded off the main thread and can be drawn with drawImage().
 */
export async function base64ToImageBitmap(
  base64: string,
  format: "jpeg" | "png" = "jpeg"
): Promise<ImageBitmap> {
  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return createImageBitmap(blob);
}

// -----------------------------------------------------------------------------
// Frame Rendering
// -----------------------------------------------------------------------------

/**
 * Determine which slide(s) are visible at a given time and the blend factor.
 * Uses precomputed slideStartTimes for efficient lookup with variable durations.
 *
 * Returns:
 * - slideA: primary slide index
 * - slideB: secondary slide index (only during transitions)
 * - blendFactor: 0 = fully slideA, 1 = fully slideB (transition progress)
 */
export function getFrameSlideInfo(
  time: number,
  timing: VideoTiming
): { slideA: number; slideB: number | null; blendFactor: number } {
  const { slideDurations, slideStartTimes, transitionDuration } = timing;
  const slideCount = slideDurations.length;

  if (slideCount <= 0) {
    return { slideA: 0, slideB: null, blendFactor: 0 };
  }

  // Find the active slide via linear scan of start times
  // (binary search would be faster for large counts, but carousels are typically < 35 slides)
  let slideA = 0;
  for (let i = 0; i < slideCount; i++) {
    if (slideStartTimes[i] <= time) {
      slideA = i;
    } else {
      break;
    }
  }

  // Time elapsed within this slide's segment
  const elapsed = time - slideStartTimes[slideA];

  // Are we in the transition zone at the END of this slide?
  const transitionStart = slideDurations[slideA] - transitionDuration;

  if (
    slideA < slideCount - 1 &&
    transitionDuration > 0 &&
    elapsed >= transitionStart
  ) {
    const slideB = slideA + 1;
    const transitionElapsed = elapsed - transitionStart;
    const blendFactor = Math.min(1, transitionElapsed / transitionDuration);
    return { slideA, slideB, blendFactor };
  }

  return { slideA, slideB: null, blendFactor: 0 };
}

/**
 * Render a single video frame to a canvas context.
 *
 * Draws the appropriate slide(s) with transition effects applied.
 * The slideImages array should contain pre-decoded ImageBitmap objects
 * at the target resolution.
 */
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  slideImages: ImageBitmap[],
  frameIndex: number,
  timing: VideoTiming,
  transition: SlideTransition
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const time = frameIndex / timing.fps;

  const { slideA, slideB, blendFactor } = getFrameSlideInfo(time, timing);

  const imgA = slideImages[slideA];
  if (!imgA) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (slideB === null || blendFactor === 0 || transition === "none") {
    // No transition — draw single slide
    ctx.drawImage(imgA, 0, 0, width, height);
    return;
  }

  const imgB = slideImages[slideB];
  if (!imgB) {
    ctx.drawImage(imgA, 0, 0, width, height);
    return;
  }

  switch (transition) {
    case "crossfade": {
      // Draw slide A, then overlay slide B with increasing opacity
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, 0, 0, width, height);
      ctx.globalAlpha = blendFactor;
      ctx.drawImage(imgB, 0, 0, width, height);
      ctx.globalAlpha = 1;
      break;
    }
    case "slide": {
      // Slide A moves left, slide B enters from right
      const offset = Math.round(blendFactor * width);
      ctx.drawImage(imgA, -offset, 0, width, height);
      ctx.drawImage(imgB, width - offset, 0, width, height);
      break;
    }
    default: {
      ctx.drawImage(imgA, 0, 0, width, height);
    }
  }
}

/**
 * Export a canvas frame as a JPEG Uint8Array for FFmpeg consumption.
 * Uses lower quality (0.85) to balance file size and encoding speed.
 */
export async function canvasFrameToBytes(
  canvas: HTMLCanvasElement,
  quality = 0.85
): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export canvas frame"));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = () => reject(new Error("Failed to read frame blob"));
        reader.readAsArrayBuffer(blob);
      },
      "image/jpeg",
      quality
    );
  });
}
