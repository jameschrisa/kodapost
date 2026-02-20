"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Film,
  ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Music,
  Package,
  Play,
  Plus,
  RotateCcw,
  Send,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { PLATFORM_IMAGE_SPECS } from "@/lib/constants";
import { loadSettings } from "@/lib/storage";
import { compositeSlideImages } from "@/app/actions";
import { trimAudioBlob, hasTrimApplied } from "@/lib/audio-utils";
import { useVideoGenerator } from "@/hooks/useVideoGenerator";
import { DEFAULT_VIDEO_SETTINGS } from "@/lib/constants";
import { logActivity } from "@/lib/activity-log";
import type { CarouselProject } from "@/lib/types";
import type { OAuthConnection } from "@/lib/types";

type Platform = "instagram" | "tiktok" | "linkedin" | "youtube" | "reddit" | "lemon8";

export const PLATFORMS: {
  key: Platform;
  label: string;
  icon: React.ReactNode;
  specKey: keyof typeof PLATFORM_IMAGE_SPECS;
  formatNote: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    specKey: "instagram_feed",
    formatNote: "Carousel post",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.2 8.2 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z" />
      </svg>
    ),
    specKey: "tiktok",
    formatNote: "Photo carousel",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    specKey: "linkedin_pdf",
    formatNote: "PDF document carousel",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: <Youtube className="h-4 w-4" />,
    specKey: "youtube_community",
    formatNote: "Community post",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    specKey: "reddit_gallery",
    formatNote: "Gallery post",
  },
  {
    key: "lemon8",
    label: "Lemon8",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
    specKey: "lemon8_post",
    formatNote: "Photo post",
  },
];

interface PublishPanelProps {
  project: CarouselProject;
  onComplete: () => void;
  onBack?: () => void;
}

export function PublishPanel({ project, onComplete, onBack }: PublishPanelProps) {
  const [selected, setSelected] = useState<Set<Platform>>(
    () => new Set(project.targetPlatforms)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [caption, setCaption] = useState(project.caption ?? "");
  const [isPosting, setIsPosting] = useState(false);
  const [postingPlatform, setPostingPlatform] = useState<Platform | null>(null);
  const [exportMode, setExportMode] = useState<"images" | "nanocast" | "video">(
    project.audioClip?.objectUrl ? "video" : "images"
  );
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video generator hook
  const {
    generateVideo,
    progress: videoProgress,
    stageLabel: videoStageLabel,
    cancel: cancelVideo,
    isGenerating: isVideoGenerating,
  } = useVideoGenerator();

  // Pre-select platforms from saved settings
  useEffect(() => {
    const settings = loadSettings();
    const activePlatforms = settings.socialAccounts
      .filter((a) => a.active)
      .map((a) => a.platform);
    if (activePlatforms.length > 0) {
      setSelected(new Set(activePlatforms));
    }
  }, []);

  // Fetch OAuth connection status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/auth/status");
        if (res.ok) {
          const data = await res.json();
          setConnections(data.connections || []);
        }
      } catch {
        // Silently fail — post buttons just won't show
      }
    }
    fetchStatus();
  }, []);

  const readySlides = project.slides.filter((s) => s.status === "ready");

  function togglePlatform(platform: Platform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  const connectedPlatforms = connections.filter((c) => c.connected);

  // Ref guard to prevent double-click race condition
  const postingRef = useRef(false);

  async function handlePost(platform: Platform) {
    if (isPosting || postingRef.current) return;
    postingRef.current = true;
    setIsPosting(true);
    setPostingPlatform(platform);

    try {
      // 1. Composite images for this platform
      const result = await compositeSlideImages(readySlides, [platform], project.filterConfig);

      if (!result.success) {
        toast.error("Post failed", { description: result.error });
        return;
      }

      // 2. Extract base64 images for this platform
      const slideImages = result.data
        .filter((item) => item.platform === platform)
        .map((item) => item.imageBase64);

      if (slideImages.length === 0) {
        toast.error("Post failed", { description: "No images to post" });
        return;
      }

      // 3. Send to publish API (append attribution if enabled)
      const finalCaption =
        includeAttribution && project.audioClip?.attribution
          ? `${caption}\n\n🎵 ${project.audioClip.attribution.attributionText}`
          : caption;

      const publishRes = await fetch(`/api/publish/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideImages, caption: finalCaption }),
      });

      const publishData = await publishRes.json();

      if (publishData.success) {
        const displayName = PLATFORMS.find((p) => p.key === platform)?.label || platform;
        toast.success(`Posted to ${displayName}!`, {
          description: publishData.postUrl
            ? "Your carousel is live."
            : "Your carousel has been published.",
        });
      } else {
        toast.error("Post failed", {
          description: publishData.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Publishing failed. Please try again.";
      toast.error("Post failed", { description: message });
    } finally {
      setIsPosting(false);
      setPostingPlatform(null);
      postingRef.current = false;
    }
  }

  async function handleExport() {
    if (selected.size === 0 || isExporting) return;
    setIsExporting(true);

    try {
      const platforms = Array.from(selected);

      // 1. Composite images on the server (Sharp + SVG overlays)
      const result = await compositeSlideImages(readySlides, platforms, project.filterConfig);

      if (!result.success) {
        toast.error("Export failed", { description: result.error });
        return;
      }

      // 2. Package into a ZIP with folders per platform
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const item of result.data) {
        const ext = item.format === "png" ? "png" : "jpg";
        const folder = zip.folder(item.platform);
        if (folder) {
          folder.file(
            `slide-${item.slideIndex + 1}.${ext}`,
            item.imageBase64,
            { base64: true }
          );
        }
      }

      // 3. Include audio clip if nano-cast mode and audio present
      let audioFilename: string | undefined;
      let exportedAudioDuration = project.audioClip?.duration ?? 0;
      if (exportMode === "nanocast" && project.audioClip?.objectUrl) {
        try {
          const clip = project.audioClip;
          const needsTrim = hasTrimApplied(clip.trimStart, clip.trimEnd, clip.duration);

          let audioArrayBuffer: ArrayBuffer;
          let ext: string;

          if (needsTrim) {
            // Trim audio using Web Audio API → outputs WAV
            const trimmedBlob = await trimAudioBlob(
              clip.objectUrl,
              clip.trimStart ?? 0,
              clip.trimEnd ?? clip.duration
            );
            audioArrayBuffer = await trimmedBlob.arrayBuffer();
            ext = "wav";
            exportedAudioDuration = (clip.trimEnd ?? clip.duration) - (clip.trimStart ?? 0);
          } else {
            // No trim needed — use original format
            const audioRes = await fetch(clip.objectUrl);
            const audioBlob = await audioRes.blob();
            audioArrayBuffer = await audioBlob.arrayBuffer();
            ext = clip.mimeType.includes("mp3")
              ? "mp3"
              : clip.mimeType.includes("wav")
                ? "wav"
                : clip.mimeType.includes("mp4") || clip.mimeType.includes("m4a")
                  ? "m4a"
                  : clip.mimeType.includes("ogg")
                    ? "ogg"
                    : "webm";
          }

          audioFilename = `${clip.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
          const audioFolder = zip.folder("audio");
          if (audioFolder) {
            audioFolder.file(audioFilename, audioArrayBuffer);
            // Include attribution text if from music library
            if (clip.attribution) {
              audioFolder.file(
                "attribution.txt",
                `Track: ${clip.attribution.trackTitle}\n` +
                  `Artist: ${clip.attribution.artistName}\n` +
                  `Platform: ${clip.attribution.platform}\n` +
                  `License: ${clip.attribution.license}\n` +
                  `URL: ${clip.attribution.trackUrl}\n\n` +
                  clip.attribution.attributionText
              );
            }
          }
        } catch {
          // Audio fetch failed — export images without audio
          console.warn("Failed to include audio in export");
        }
      }

      // 4. Include manifest.json for nano-cast packages
      if (exportMode === "nanocast") {
        const finalCaption =
          includeAttribution && project.audioClip?.attribution
            ? `${caption}\n\n🎵 ${project.audioClip.attribution.attributionText}`
            : caption;

        const manifest = {
          version: 1,
          projectName: project.projectName || "Untitled",
          slideCount: readySlides.length,
          platforms,
          caption: finalCaption || undefined,
          audio: project.audioClip
            ? {
                filename: audioFilename,
                duration: exportedAudioDuration,
                source: project.audioClip.source,
                trimmed: hasTrimApplied(
                  project.audioClip.trimStart,
                  project.audioClip.trimEnd,
                  project.audioClip.duration
                ),
                attribution: project.audioClip.attribution?.attributionText,
              }
            : undefined,
          exportedAt: new Date().toISOString(),
        };

        zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      }

      // 5. Generate ZIP and trigger download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportMode === "nanocast"
        ? `kodapost-nanocast-${Date.now()}.zip`
        : `kodapost-carousel-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsComplete(true);

      const platformNames = platforms
        .map((p) => PLATFORMS.find((pl) => pl.key === p)?.label)
        .filter(Boolean)
        .join(", ");

      logActivity("post_exported", `Exported ${readySlides.length} slides for ${platformNames}`);

      toast.success(
        exportMode === "nanocast" ? "Nano-cast package ready" : "Export complete",
        {
          description: `${readySlides.length} slides packaged for ${platformNames}.${
            exportMode === "nanocast" && project.audioClip?.objectUrl ? " Includes audio." : ""
          }`,
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Export failed. Please try again.";
      toast.error("Export failed", { description: message });
    } finally {
      setIsExporting(false);
    }
  }

  // Video generation handler
  const handleGenerateVideo = useCallback(async () => {
    if (selected.size === 0 || isVideoGenerating) return;

    // Use the first selected platform for video dimensions
    const platform = Array.from(selected)[0];

    const blob = await generateVideo({
      project,
      platform,
      settings: project.videoSettings ?? DEFAULT_VIDEO_SETTINGS,
    });

    if (blob) {
      // Revoke previous URL if any
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setIsComplete(true);

      toast.success("Video reel generated!", {
        description: `${readySlides.length}-slide reel ready for ${
          PLATFORMS.find((p) => p.key === platform)?.label ?? platform
        }.`,
      });
    } else {
      toast.error("Video generation failed", {
        description: "Please try again or use image export.",
      });
    }
  }, [selected, isVideoGenerating, generateVideo, project, readySlides.length, videoUrl]);

  // Download generated video
  const handleDownloadVideo = useCallback(() => {
    if (!videoBlob || !videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    const platform = Array.from(selected)[0] ?? "reel";
    a.download = `kodapost-${platform}-reel-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Video downloaded!");
    logActivity("video_exported", `Exported video reel for ${platform}`);
  }, [videoBlob, videoUrl, selected]);

  // Clean up video URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // -- Exporting state --
  if (isExporting) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 py-12">
        <LoadingSpinner size="lg" text="Preparing your export..." />
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Packaging {readySlides.length} slides for{" "}
          {Array.from(selected)
            .map((p) => PLATFORMS.find((pl) => pl.key === p)?.label)
            .join(", ")}
        </p>
      </div>
    );
  }

  // -- Success state --
  if (isComplete) {
    const wasNanoCast = exportMode === "nanocast" && project.audioClip?.objectUrl;
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          wasNanoCast ? "bg-purple-500/10" : "bg-green-500/10"
        )}>
          {wasNanoCast ? (
            <Package className="h-8 w-8 text-purple-400" />
          ) : (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {wasNanoCast ? "Nano-Cast Package Ready" : "Carousel Ready"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {readySlides.length} slides exported for{" "}
            {Array.from(selected)
              .map((p) => PLATFORMS.find((pl) => pl.key === p)?.label)
              .join(", ")}
          </p>
          {wasNanoCast && project.audioClip && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-purple-400">
              <Music className="h-3.5 w-3.5" />
              <span>Includes {project.audioClip.name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onComplete} className="gap-2">
            <Plus className="h-4 w-4" />
            New Carousel
          </Button>
          <Button
            onClick={() => setIsComplete(false)}
            variant="ghost"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Back to Export
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back to Review
        </Button>
      )}
      <div>
        <h2 className="text-lg font-semibold">Publish</h2>
        <p className="text-sm text-muted-foreground">
          Select platforms and export your {readySlides.length}-slide carousel.
        </p>
      </div>

      {/* Platform selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Platforms</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const isActive = selected.has(platform.key);
            const spec = PLATFORM_IMAGE_SPECS[platform.specKey];

            return (
              <Card
                key={platform.key}
                role="button"
                tabIndex={0}
                onClick={() => togglePlatform(platform.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePlatform(platform.key);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive
                    ? "ring-2 ring-primary shadow-sm"
                    : "hover:ring-1 hover:ring-muted-foreground/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {platform.icon}
                      </span>
                      <span className="text-sm font-medium">
                        {platform.label}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isActive && <Check className="h-3 w-3" />}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>{platform.formatNote}</p>
                    <p>
                      {spec.aspectRatio} &middot; {spec.width}&times;
                      {spec.height} &middot; {spec.format}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Export mode selector */}
      {selected.size > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Export Mode</p>
          <div className={cn("grid gap-3", project.audioClip?.objectUrl ? "grid-cols-3" : "grid-cols-2")}>
            {/* Video Reel — primary when audio present */}
            {project.audioClip?.objectUrl && (
              <button
                type="button"
                onClick={() => setExportMode("video")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  exportMode === "video"
                    ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                )}
              >
                <Film
                  className={cn(
                    "h-5 w-5 shrink-0",
                    exportMode === "video"
                      ? "text-purple-400"
                      : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="text-sm font-medium">Video Reel</p>
                  <p className="text-[11px] text-muted-foreground">
                    MP4 with slides + audio
                  </p>
                </div>
              </button>
            )}
            {/* Export Package */}
            {project.audioClip?.objectUrl && (
              <button
                type="button"
                onClick={() => setExportMode("nanocast")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  exportMode === "nanocast"
                    ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                )}
              >
                <Package
                  className={cn(
                    "h-5 w-5 shrink-0",
                    exportMode === "nanocast"
                      ? "text-purple-400"
                      : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="text-sm font-medium">Export Package</p>
                  <p className="text-[11px] text-muted-foreground">
                    Images + audio + manifest
                  </p>
                </div>
              </button>
            )}
            {/* Images Only */}
            <button
              type="button"
              onClick={() => setExportMode("images")}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                exportMode === "images"
                  ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
                  : "border-muted-foreground/20 hover:border-muted-foreground/40"
              )}
            >
              <ImageIcon
                className={cn(
                  "h-5 w-5 shrink-0",
                  exportMode === "images"
                    ? "text-purple-400"
                    : "text-muted-foreground"
                )}
              />
              <div>
                <p className="text-sm font-medium">Images Only</p>
                <p className="text-[11px] text-muted-foreground">
                  ZIP with platform images
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Export summary */}
      {selected.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Export Summary</p>
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <p>
                {readySlides.length} slides &times; {selected.size} platform
                {selected.size !== 1 && "s"} ={" "}
                <span className="font-medium text-foreground">
                  {readySlides.length * selected.size} images
                </span>
              </p>
              {project.audioClip?.objectUrl && (exportMode === "nanocast" || exportMode === "video") && (
                <div className="flex items-center gap-2 mt-1">
                  <Music className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    {project.audioClip.name} &middot;{" "}
                    {(() => {
                      const clip = project.audioClip;
                      if (!clip) return "";
                      const isTrimmed = hasTrimApplied(
                        clip.trimStart,
                        clip.trimEnd,
                        clip.duration
                      );
                      const dur = isTrimmed
                        ? (clip.trimEnd ?? clip.duration) -
                          (clip.trimStart ?? 0)
                        : clip.duration;
                      return `${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, "0")}${isTrimmed ? " (trimmed)" : ""}`;
                    })()}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      project.audioClip.source === "recording"
                        ? "bg-red-500/10 text-red-400"
                        : project.audioClip.source === "library"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-blue-500/10 text-blue-400"
                    )}
                  >
                    {project.audioClip.source === "recording"
                      ? "Voice"
                      : project.audioClip.source === "library"
                        ? "Library"
                        : "Upload"}
                  </span>
                </div>
              )}
              <p>
                {exportMode === "video"
                  ? "MP4 video reel with transitions and audio."
                  : exportMode === "nanocast" && project.audioClip?.objectUrl
                    ? "Nano-cast package with images, audio & manifest."
                    : "ZIP with platform folders."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video generation UI */}
      {exportMode === "video" && (
        <div className="space-y-3">
          {/* Progress bar during generation */}
          {isVideoGenerating && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{videoStageLabel}</span>
                  <span className="text-xs text-muted-foreground">{videoProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelVideo}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Video preview after generation */}
          {videoUrl && !isVideoGenerating && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Film className="h-4 w-4 text-purple-400" />
                  Video Preview
                </p>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg border"
                  style={{ maxHeight: 400 }}
                />
                <Button
                  size="lg"
                  className="w-full gap-2 text-base bg-purple-500 hover:bg-purple-600"
                  onClick={handleDownloadVideo}
                >
                  <Download className="h-5 w-5" />
                  Download Video Reel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generate button (when no video yet or to regenerate) */}
          {!isVideoGenerating && (
            <Button
              size="lg"
              className="w-full gap-2 text-base bg-purple-500 hover:bg-purple-600"
              disabled={selected.size === 0}
              onClick={handleGenerateVideo}
            >
              {videoUrl ? (
                <>
                  <RotateCcw className="h-5 w-5" />
                  Regenerate Video
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Generate Video Reel
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Download button (for non-video modes) */}
      {exportMode !== "video" && (
        <Button
          size="lg"
          className="w-full gap-2 text-base"
          disabled={selected.size === 0 || isExporting}
          onClick={handleExport}
        >
          {isExporting ? (
            <>
              <Download className="h-5 w-5 animate-bounce" />
              Preparing Export...
            </>
          ) : (
            <>
              {exportMode === "nanocast" && project.audioClip?.objectUrl ? (
                <Package className="h-5 w-5" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {exportMode === "nanocast" && project.audioClip?.objectUrl
                ? "Download Export Package"
                : "Download Carousel"}
            </>
          )}
        </Button>
      )}

      {/* Copy caption to clipboard — useful for manual posting */}
      {project.caption && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={async () => {
            let text = project.caption ?? "";
            if (includeAttribution && project.audioClip?.attribution) {
              text += `\n\n🎵 ${project.audioClip.attribution.attributionText}`;
            }
            try {
              await navigator.clipboard.writeText(text);
              toast.success("Caption copied to clipboard");
            } catch {
              toast.error("Could not copy to clipboard");
            }
          }}
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copy Caption to Clipboard
        </Button>
      )}

      {/* Post Directly section — only shown when platforms are connected */}
      {connectedPlatforms.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="text-sm font-semibold">Post Directly</h3>
            <p className="text-xs text-muted-foreground">
              Publish your carousel directly to connected platforms.
            </p>
          </div>

          {/* Caption input */}
          <div className="space-y-2">
            <Label htmlFor="post-caption" className="text-sm">
              Caption
            </Label>
            <Textarea
              id="post-caption"
              placeholder="Write a caption for your post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {caption.length} / 2200 characters
            </p>
          </div>

          {/* Attribution checkbox — shown when audio has attribution info */}
          {project.audioClip?.attribution && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAttribution}
                  onChange={(e) => setIncludeAttribution(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-muted-foreground/30 accent-purple-500"
                />
                <span className="text-xs text-muted-foreground">
                  Include music credit in caption
                </span>
              </label>
              {includeAttribution && (
                <div className="flex items-start gap-2 rounded-md bg-purple-500/5 border border-purple-500/10 px-3 py-2">
                  <Music className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    🎵 {project.audioClip.attribution.attributionText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Post buttons for each connected platform */}
          <div className="grid gap-2">
            {connectedPlatforms.map((conn) => {
              const platformInfo = PLATFORMS.find((p) => p.key === conn.platform);
              if (!platformInfo) return null;

              const isThisPosting =
                isPosting && postingPlatform === conn.platform;

              return (
                <Button
                  key={conn.platform}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  disabled={isPosting || readySlides.length === 0}
                  onClick={() => handlePost(conn.platform)}
                >
                  {isThisPosting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="flex items-center gap-2">
                    {platformInfo.icon}
                    {isThisPosting
                      ? `Posting to ${platformInfo.label}...`
                      : `Post to ${platformInfo.label}`}
                  </span>
                  {conn.platformUsername && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      @{conn.platformUsername}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
