/**
 * Video generation utilities for rendering carousel slides into video frames.
 *
 * Handles timing calculations, canvas-based frame rendering with transitions,
 * and image decoding for the video generation pipeline.
 */

import type { AudioClip, SlideTransition, VideoSettings } from "./types";

// -----------------------------------------------------------------------------
// Timing Calculations
// -----------------------------------------------------------------------------

export interface VideoTiming {
  /** Total video duration in seconds */
  totalDuration: number;
  /** Duration per slide in seconds */
  slideDuration: number;
  /** Duration of transition between slides in seconds */
  transitionDuration: number;
  /** Total number of frames */
  totalFrames: number;
  /** Frames per second */
  fps: number;
}

/**
 * Calculate video timing based on slide count, audio, and settings.
 *
 * In "match-audio" mode: slide duration is auto-calculated to fill the audio
 * length. In "custom" mode: uses the explicit slideDuration setting.
 *
 * Transition time is "shared" — the transition overlaps between two slides,
 * so total time = (slideCount × slideDuration) - ((slideCount - 1) × transitionDuration).
 */
export function calculateVideoTiming(
  slideCount: number,
  audioClip: AudioClip | undefined,
  settings: VideoSettings
): VideoTiming {
  const { fps, transitionDuration: rawTransDur } = settings;
  const transitionDuration = slideCount > 1 ? rawTransDur : 0;

  let slideDuration: number;

  if (settings.timingMode === "match-audio" && audioClip) {
    // Calculate effective audio duration (trimmed)
    const audioStart = audioClip.trimStart ?? 0;
    const audioEnd = audioClip.trimEnd ?? audioClip.duration;
    const audioDuration = Math.max(1, audioEnd - audioStart);

    // Solve for slideDuration:
    // totalDuration = slideCount * slideDuration - (slideCount - 1) * transitionDuration
    // audioDuration = slideCount * slideDuration - (slideCount - 1) * transitionDuration
    // slideDuration = (audioDuration + (slideCount - 1) * transitionDuration) / slideCount
    slideDuration = Math.max(
      1,
      (audioDuration + (slideCount - 1) * transitionDuration) / slideCount
    );
  } else {
    slideDuration = settings.slideDuration;
  }

  // Ensure transition doesn't exceed half the slide duration
  const effectiveTransition = Math.min(transitionDuration, slideDuration / 2);

  const totalDuration =
    slideCount * slideDuration - (slideCount - 1) * effectiveTransition;
  const totalFrames = Math.ceil(totalDuration * fps);

  return {
    totalDuration,
    slideDuration,
    transitionDuration: effectiveTransition,
    totalFrames,
    fps,
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
 *
 * Returns:
 * - slideA: primary slide index
 * - slideB: secondary slide index (only during transitions)
 * - blendFactor: 0 = fully slideA, 1 = fully slideB (transition progress)
 */
export function getFrameSlideInfo(
  time: number,
  slideCount: number,
  slideDuration: number,
  transitionDuration: number
): { slideA: number; slideB: number | null; blendFactor: number } {
  if (slideCount <= 0) {
    return { slideA: 0, slideB: null, blendFactor: 0 };
  }

  // The "effective" duration per slide step (overlap-adjusted)
  const step = slideDuration - transitionDuration;

  // Which step are we in?
  const rawIndex = step > 0 ? time / step : 0;
  const slideA = Math.min(Math.floor(rawIndex), slideCount - 1);

  // Time within this slide's segment
  const slideStartTime = slideA * step;
  const elapsed = time - slideStartTime;

  // Are we in the transition zone at the END of this slide?
  const transitionStart = slideDuration - transitionDuration;

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
  const { fps, slideDuration, transitionDuration } = timing;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const time = frameIndex / fps;

  const { slideA, slideB, blendFactor } = getFrameSlideInfo(
    time,
    slideImages.length,
    slideDuration,
    transitionDuration
  );

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
