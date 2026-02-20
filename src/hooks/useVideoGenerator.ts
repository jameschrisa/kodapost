"use client";

/**
 * Hook for generating video reels from carousel slides + audio.
 *
 * Uses FFmpeg.wasm (single-threaded) for client-side MP4 encoding.
 * Pipeline: compositeSlideImages (server) → canvas frame rendering → FFmpeg encode → audio mix.
 */

import { useCallback, useRef, useState } from "react";
import type { CarouselProject, CarouselSlide, VideoSettings } from "@/lib/types";
import type { FilterConfig } from "@/lib/types";
import { DEFAULT_VIDEO_SETTINGS } from "@/lib/constants";
import {
  base64ToImageBitmap,
  calculateVideoTiming,
  canvasFrameToBytes,
  renderFrameToCanvas,
} from "@/lib/video-utils";
import { compositeSlideImages } from "@/app/actions";
import { trimAudioBlob, hasTrimApplied } from "@/lib/audio-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VideoGenStage =
  | "idle"
  | "loading"       // Loading FFmpeg.wasm
  | "compositing"   // Server-side slide compositing
  | "rendering"     // Client-side canvas frame rendering
  | "encoding"      // FFmpeg video encoding
  | "mixing"        // Muxing audio into video
  | "done"
  | "error";

const STAGE_LABELS: Record<VideoGenStage, string> = {
  idle: "",
  loading: "Loading video engine\u2026",
  compositing: "Compositing slides\u2026",
  rendering: "Rendering frames\u2026",
  encoding: "Encoding video\u2026",
  mixing: "Adding audio\u2026",
  done: "Video ready!",
  error: "Generation failed",
};

export interface VideoGenParams {
  project: CarouselProject;
  platform: string;
  settings?: VideoSettings;
}

export interface UseVideoGeneratorReturn {
  generateVideo: (params: VideoGenParams) => Promise<Blob | null>;
  progress: number;
  stage: VideoGenStage;
  stageLabel: string;
  cancel: () => void;
  isGenerating: boolean;
}

// ---------------------------------------------------------------------------
// Singleton FFmpeg instance (lazy-loaded, cached across renders)
// ---------------------------------------------------------------------------

let ffmpegInstance: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let ffmpegLoading: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFFmpeg(
  onProgress?: (p: number) => void
): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();

    // Load the single-threaded core from unpkg CDN (cached by browser)
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoading = null;
    onProgress?.(100);
    return ffmpeg;
  })();

  return ffmpegLoading;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVideoGenerator(): UseVideoGeneratorReturn {
  const [stage, setStage] = useState<VideoGenStage>("idle");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStage("idle");
    setProgress(0);
  }, []);

  const generateVideo = useCallback(
    async (params: VideoGenParams): Promise<Blob | null> => {
      const { project, platform, settings: overrideSettings } = params;
      const settings = overrideSettings ?? project.videoSettings ?? DEFAULT_VIDEO_SETTINGS;

      const abortController = new AbortController();
      abortRef.current = abortController;

      const readySlides = project.slides.filter(
        (s: CarouselSlide) => s.status === "ready"
      );
      if (readySlides.length === 0) {
        setStage("error");
        return null;
      }

      try {
        // -----------------------------------------------------------------
        // Stage 1: Load FFmpeg.wasm
        // -----------------------------------------------------------------
        setStage("loading");
        setProgress(0);
        const ffmpeg = await getFFmpeg((p) => setProgress(p));
        if (abortController.signal.aborted) return null;

        // -----------------------------------------------------------------
        // Stage 2: Composite slides via server action
        // -----------------------------------------------------------------
        setStage("compositing");
        setProgress(0);

        // Build lightweight slides (strip base64 images to avoid payload size issues)
        const lightSlides: CarouselSlide[] = readySlides.map((s) => ({
          ...s,
          imageUrl: s.imageUrl?.startsWith("data:")
            ? s.imageUrl  // keep data URIs — server needs them
            : s.imageUrl,
        }));

        const compositeResult = await compositeSlideImages(
          lightSlides,
          [platform],
          project.filterConfig as FilterConfig | undefined
        );

        if (!compositeResult.success) {
          throw new Error(
            ("error" in compositeResult ? (compositeResult as { error?: string }).error : undefined)
              ?? "Compositing failed"
          );
        }
        if (abortController.signal.aborted) return null;

        // Decode base64 images to ImageBitmaps
        const slideImages: ImageBitmap[] = [];
        const sortedResults = compositeResult.data
          .filter((r) => r.platform === platform)
          .sort((a, b) => a.slideIndex - b.slideIndex);

        for (let i = 0; i < sortedResults.length; i++) {
          const img = await base64ToImageBitmap(
            sortedResults[i].imageBase64,
            sortedResults[i].format
          );
          slideImages.push(img);
          setProgress(Math.round(((i + 1) / sortedResults.length) * 100));
        }
        if (abortController.signal.aborted) return null;

        // -----------------------------------------------------------------
        // Stage 3: Render frames to canvas
        // -----------------------------------------------------------------
        setStage("rendering");
        setProgress(0);

        const timing = calculateVideoTiming(
          slideImages.length,
          project.audioClip,
          settings
        );

        // Get dimensions from the first image
        const width = slideImages[0].width;
        const height = slideImages[0].height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to create canvas context");

        // Render each frame and write to FFmpeg filesystem
        for (let f = 0; f < timing.totalFrames; f++) {
          renderFrameToCanvas(ctx, slideImages, f, timing, settings.transition);
          const frameBytes = await canvasFrameToBytes(
            canvas,
            settings.quality === "high" ? 0.95 : 0.85
          );

          const frameName = `frame_${String(f).padStart(6, "0")}.jpg`;
          await ffmpeg.writeFile(frameName, frameBytes);

          if (f % 5 === 0 || f === timing.totalFrames - 1) {
            setProgress(Math.round(((f + 1) / timing.totalFrames) * 100));
          }
          if (abortController.signal.aborted) return null;
        }

        // -----------------------------------------------------------------
        // Stage 4: Encode video with FFmpeg
        // -----------------------------------------------------------------
        setStage("encoding");
        setProgress(0);

        // Track encoding progress
        const progressHandler = ({ progress: p }: { progress: number }) => {
          setProgress(Math.round(Math.min(p, 1) * 100));
        };
        ffmpeg.on("progress", progressHandler);

        const crf = settings.quality === "high" ? "18" : "23";
        const exitCode = await ffmpeg.exec([
          "-framerate", String(timing.fps),
          "-i", "frame_%06d.jpg",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-crf", crf,
          "-preset", "fast",
          "-movflags", "+faststart",
          "video_only.mp4",
        ]);

        ffmpeg.off("progress", progressHandler);

        if (exitCode !== 0) throw new Error("FFmpeg encoding failed");
        if (abortController.signal.aborted) return null;

        // -----------------------------------------------------------------
        // Stage 5: Mix audio (if present)
        // -----------------------------------------------------------------
        let outputFileName = "video_only.mp4";

        if (project.audioClip?.objectUrl) {
          setStage("mixing");
          setProgress(0);

          const clip = project.audioClip;
          const needsTrim = hasTrimApplied(clip.trimStart, clip.trimEnd, clip.duration);

          let audioBytes: Uint8Array;
          let audioExt: string;

          if (needsTrim) {
            const trimmedBlob = await trimAudioBlob(
              clip.objectUrl,
              clip.trimStart ?? 0,
              clip.trimEnd ?? clip.duration
            );
            audioBytes = new Uint8Array(await trimmedBlob.arrayBuffer());
            audioExt = "wav";
          } else {
            const audioRes = await fetch(clip.objectUrl);
            const audioBlob = await audioRes.blob();
            audioBytes = new Uint8Array(await audioBlob.arrayBuffer());
            audioExt = clip.mimeType.includes("mp3")
              ? "mp3"
              : clip.mimeType.includes("wav")
                ? "wav"
                : clip.mimeType.includes("mp4") || clip.mimeType.includes("m4a")
                  ? "m4a"
                  : clip.mimeType.includes("ogg")
                    ? "ogg"
                    : "webm";
          }

          await ffmpeg.writeFile(`audio.${audioExt}`, audioBytes);

          const mixProgressHandler = ({ progress: p }: { progress: number }) => {
            setProgress(Math.round(Math.min(p, 1) * 100));
          };
          ffmpeg.on("progress", mixProgressHandler);

          const mixCode = await ffmpeg.exec([
            "-i", "video_only.mp4",
            "-i", `audio.${audioExt}`,
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            "-movflags", "+faststart",
            "output.mp4",
          ]);

          ffmpeg.off("progress", mixProgressHandler);

          if (mixCode !== 0) {
            // Audio mux failed — fall back to video-only
            console.warn("[KodaPost] Audio mixing failed, using video-only output");
          } else {
            outputFileName = "output.mp4";
          }

          // Clean up audio file
          try { await ffmpeg.deleteFile(`audio.${audioExt}`); } catch { /* ignore */ }
        }

        // -----------------------------------------------------------------
        // Read output and clean up
        // -----------------------------------------------------------------
        setStage("done");
        setProgress(100);

        const outputData = await ffmpeg.readFile(outputFileName);
        // FFmpeg readFile returns FileData (Uint8Array | string).
        // Convert to ArrayBuffer to avoid SharedArrayBuffer type incompatibility.
        let arrayBuf: ArrayBuffer;
        if (outputData instanceof Uint8Array) {
          // Copy bytes into a plain ArrayBuffer
          arrayBuf = new ArrayBuffer(outputData.byteLength);
          new Uint8Array(arrayBuf).set(outputData);
        } else {
          arrayBuf = new TextEncoder().encode(outputData as string).buffer as ArrayBuffer;
        }
        const outputBlob = new Blob([arrayBuf], { type: "video/mp4" });

        // Clean up frame files and output files
        cleanupFFmpegFiles(ffmpeg, timing.totalFrames, outputFileName).catch(
          () => {}
        );

        return outputBlob;
      } catch (err) {
        if (abortController.signal.aborted) return null;
        console.error("[KodaPost] Video generation failed:", err);
        setStage("error");
        return null;
      }
    },
    []
  );

  return {
    generateVideo,
    progress,
    stage,
    stageLabel: STAGE_LABELS[stage],
    cancel,
    isGenerating: stage !== "idle" && stage !== "done" && stage !== "error",
  };
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

async function cleanupFFmpegFiles(
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg,
  totalFrames: number,
  outputFileName: string
): Promise<void> {
  // Delete frame files
  for (let f = 0; f < totalFrames; f++) {
    const name = `frame_${String(f).padStart(6, "0")}.jpg`;
    try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
  }
  // Delete output files
  try { await ffmpeg.deleteFile("video_only.mp4"); } catch { /* ignore */ }
  if (outputFileName !== "video_only.mp4") {
    try { await ffmpeg.deleteFile(outputFileName); } catch { /* ignore */ }
  }
}
