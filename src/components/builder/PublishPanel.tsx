"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Film,
  ImageIcon,
  Info,
  Instagram,
  Linkedin,
  Loader2,
  Music,
  Package,
  Play,
  Plus,
  RotateCcw,
  Send,
  Shield,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { PLATFORM_IMAGE_SPECS, PLATFORM_RULES, type PlatformRulesKey } from "@/lib/constants";
import { loadSettings, saveSettings } from "@/lib/storage";
import { compositeSlideImages } from "@/app/actions";
import { trimAudioBlob, hasTrimApplied } from "@/lib/audio-utils";
import { useVideoGenerator } from "@/hooks/useVideoGenerator";
import { DEFAULT_VIDEO_SETTINGS } from "@/lib/constants";
import { logActivity } from "@/lib/activity-log";
import { logExport, addEntry, isTestModeEnabled } from "@/lib/test-mode";
import { useLoadingStore } from "@/lib/stores/loading-store";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useUserInfo } from "@/hooks/useUserInfo";
import RegisterProvenanceButton from "@/components/provenance/RegisterProvenanceButton";
import { KodaPostIcon } from "@/components/icons/KodaPostIcon";
import type { CarouselProject, OAuthConnection, Platform, BrandWatermarkSettings } from "@/lib/types";

export const PLATFORMS: {
  key: Platform;
  label: string;
  icon: React.ReactNode;
  specKey: keyof typeof PLATFORM_IMAGE_SPECS;
  formatNote: string;
  publishMode?: "direct" | "export";
  comingSoon?: boolean;
}[] = [
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
    publishMode: "direct",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    specKey: "instagram_feed",
    formatNote: "Carousel post",
    publishMode: "direct",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: <Youtube className="h-4 w-4" />,
    specKey: "youtube_community",
    formatNote: "Community post · 1:1",
    publishMode: "export",
  },
  {
    key: "youtube_shorts",
    label: "YouTube Shorts",
    icon: <Youtube className="h-4 w-4" />,
    specKey: "youtube_shorts",
    formatNote: "Vertical Shorts · 9:16",
    publishMode: "export",
  },
  {
    key: "x",
    label: "X/Twitter",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
    specKey: "x_post",
    formatNote: "Image post · max 4 images",
    publishMode: "export",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    specKey: "linkedin_pdf",
    formatNote: "PDF document carousel",
    publishMode: "direct",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
      </svg>
    ),
    specKey: "reddit_gallery",
    formatNote: "Gallery post",
    publishMode: "export",
    comingSoon: true,
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
  const [expandedRules, setExpandedRules] = useState(false);
  const [provenanceEnabled, setProvenanceEnabled] = useState(false);
  const [watermarkMode, setWatermarkMode] = useState<BrandWatermarkSettings["mode"]>("text");
  const [brandWatermark, setBrandWatermark] = useState<BrandWatermarkSettings | null>(null);
  const [watermarkText, setWatermarkText] = useState("Made with KodaPost");
  const [connectionError, setConnectionError] = useState(false);
  const [provenanceHashes, setProvenanceHashes] = useState<string[]>([]);
  const [provenancePerceptualHashes, setProvenancePerceptualHashes] = useState<string[]>([]);
  const [provenancePlatform, setProvenancePlatform] = useState<string | undefined>();
  const [provenancePostId, setProvenancePostId] = useState<string | undefined>();
  const cancelExportRef = useRef(false);
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video generator hook
  const {
    generateVideo,
    progress: videoProgress,
    stageLabel: videoStageLabel,
    errorMessage: videoErrorMessage,
    cancel: cancelVideo,
    isGenerating: isVideoGenerating,
  } = useVideoGenerator();

  const { startLoading: startGlobalLoading, stopLoading: stopGlobalLoading } = useLoadingStore();
  const { canAccessFeature } = useUserPlan();
  const hasProvenance = canAccessFeature("creator_provenance");
  const { firstName, lastName } = useUserInfo();
  const creatorName = brandWatermark?.creatorName
    || [firstName, lastName].filter(Boolean).join(" ")
    || "Creator";

  // Initialize watermark text - "Made with KodaPost" is the default
  // Only override if user has explicitly set a different text in settings
  useEffect(() => {
    const settings = loadSettings();
    if (settings.brandWatermark?.watermarkText) {
      setWatermarkText(settings.brandWatermark.watermarkText);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up video blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // Pre-select platforms from saved settings and load brand watermark config
  // If no platforms are configured, default to Instagram so export/video works immediately
  useEffect(() => {
    const settings = loadSettings();
    const activePlatforms = settings.socialAccounts
      .filter((a) => a.active)
      .map((a) => a.platform);
    if (activePlatforms.length > 0) {
      setSelected(new Set(activePlatforms));
    } else if (project.targetPlatforms.length === 0 || selected.size === 0) {
      setSelected(new Set(["instagram" as Platform]));
    }
    if (settings.brandWatermark) {
      setBrandWatermark(settings.brandWatermark);
      setWatermarkMode(settings.brandWatermark.mode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch OAuth connection status
  const fetchConnectionStatus = useCallback(async () => {
    try {
      setConnectionError(false);
      const res = await fetch("/api/auth/status");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch {
      setConnectionError(true);
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

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

  // Only show "Post Directly" buttons for platforms that are both connected
  // AND checked in the platform selection grid above.
  const connectedPlatforms = connections.filter(
    (c) => c.connected && selected.has(c.platform as Platform)
  );

  // Ref guard to prevent double-click race condition
  const postingRef = useRef(false);

  async function handlePost(platform: Platform) {
    if (isPosting || postingRef.current) return;
    postingRef.current = true;
    setIsPosting(true);
    setPostingPlatform(platform);
    const platformLabel = PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
    startGlobalLoading(`publish-${platform}`, `Publishing to ${platformLabel}…`);

    try {
      // 1. Composite images for this platform
      const provenanceConfig = hasProvenance && provenanceEnabled
        ? {
            creatorName,
            watermarkMode: watermarkMode,
            watermarkText: watermarkText || "Made with KodaPost",
            logoBase64: brandWatermark?.logoDataUri
              ? brandWatermark.logoDataUri.replace(/^data:[^;]+;base64,/, "")
              : undefined,
            logoPosition: brandWatermark?.position ?? "southeast",
            logoOpacity: brandWatermark?.opacity ?? 0.3,
            logoScale: brandWatermark?.scale ?? 0.15,
          } as const
        : undefined;
      // Batch compositing: use batch size of 1 for 9:16 to stay under response limits
      const platformSpec = PLATFORM_IMAGE_SPECS[PLATFORMS.find(p => p.key === platform)?.specKey ?? "instagram_feed"];
      const BATCH_SIZE = (platformSpec && platformSpec.height >= 1920) ? 1 : 2;
      console.log(`[Publish] Starting publish: ${readySlides.length} slides for ${platform}, batchSize=${BATCH_SIZE}`);
      if (isTestModeEnabled()) {
        logExport("Publish started", { platform, slides: readySlides.length, batchSize: BATCH_SIZE, spec: platformSpec });
      }
      const allData: { platform: string; slideIndex: number; imageBase64: string; format: "jpeg" | "png"; imageHash?: string; perceptualHash?: string }[] = [];
      const allWarnings: string[] = [];

      // Enforce per-platform max carousel images client-side (hard cap at 10)
      const rules = PLATFORM_RULES[platform as PlatformRulesKey];
      const maxImages = Math.min(rules?.maxCarouselImages ?? 10, 10);
      const platformSlides = readySlides.slice(0, maxImages);

      for (let batchStart = 0; batchStart < platformSlides.length; batchStart += BATCH_SIZE) {
        const batch = platformSlides.slice(batchStart, batchStart + BATCH_SIZE);
        console.log(`[Publish] Processing batch ${batchStart / BATCH_SIZE + 1}: slides ${batchStart + 1}-${batchStart + batch.length}`);
        const batchStartTime = Date.now();
        const batchResult = await Promise.race([
          compositeSlideImages(batch, [platform], project.filterConfig, provenanceConfig),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 55_000)),
        ]);
        const batchElapsed = Date.now() - batchStartTime;
        console.log(`[Publish] Batch completed in ${batchElapsed}ms, result: ${batchResult ? (batchResult.success ? "success" : "error") : "empty"}`);

        if (!batchResult) {
          const isTimeout = batchElapsed >= 54_000;
          const errMsg = isTimeout ? "Timeout" : "Empty response";
          console.error(`[Publish] ${errMsg} for batch starting at slide ${batchStart + 1} (${batchElapsed}ms)`);
          if (isTestModeEnabled()) {
            addEntry("error", "publish", `${errMsg} at slide ${batchStart + 1}`, { batchElapsed, batchSize: BATCH_SIZE, platform });
          }
          toast.error("Post failed", {
            description: isTimeout
              ? "Processing timed out. Try disabling filters or watermarks, or use fewer slides."
              : "Server returned an empty response. Your slides may be too large. Try fewer or smaller images.",
          });
          return;
        }
        if (!batchResult.success) {
          console.error(`[Publish] Batch error: ${batchResult.error}`);
          if (isTestModeEnabled()) {
            addEntry("error", "publish", `Batch error: ${batchResult.error}`, { batchElapsed, platform });
          }
          toast.error("Post failed", { description: batchResult.error });
          return;
        }

        for (const item of batchResult.data) {
          allData.push({ ...item, slideIndex: batchStart + item.slideIndex });
        }
        if (batchResult.warnings?.length) {
          allWarnings.push(...batchResult.warnings);
        }
      }

      if (allWarnings.length > 0) {
        toast.warning("Export completed with warnings", {
          description: allWarnings.join("; "),
        });
      }

      const result = { success: true as const, data: allData, warnings: allWarnings.length > 0 ? allWarnings : undefined };

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

        // Capture image hashes and post ID for provenance registration
        const hashes = result.data
          .filter((item) => item.imageHash)
          .map((item) => item.imageHash as string);
        const pHashes = result.data
          .filter((item) => item.perceptualHash)
          .map((item) => item.perceptualHash as string);
        if (hashes.length > 0) {
          setProvenanceHashes(hashes);
          setProvenancePerceptualHashes(pHashes);
          setProvenancePlatform(platform);
          setProvenancePostId(publishData.postId ?? publishData.id);
        }
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
      stopGlobalLoading(`publish-${platform}`);
      postingRef.current = false;
    }
  }

  async function handleExport() {
    if (selected.size === 0 || isExporting) return;
    cancelExportRef.current = false;
    setIsExporting(true);

    // Safety timeout: auto-cancel after 2 minutes
    exportTimeoutRef.current = setTimeout(() => {
      cancelExportRef.current = true;
      setIsExporting(false);
      toast.error("Export timed out", {
        description: "The export took too long. Please try again with fewer slides or platforms.",
      });
    }, 120_000);

    try {
      const platforms = Array.from(selected);

      // 1. Composite images on the server (Sharp + SVG overlays)
      const provenanceConfig = hasProvenance && provenanceEnabled
        ? {
            creatorName,
            watermarkMode: watermarkMode,
            watermarkText: watermarkText || "Made with KodaPost",
            logoBase64: brandWatermark?.logoDataUri
              ? brandWatermark.logoDataUri.replace(/^data:[^;]+;base64,/, "")
              : undefined,
            logoPosition: brandWatermark?.position ?? "southeast",
            logoOpacity: brandWatermark?.opacity ?? 0.3,
            logoScale: brandWatermark?.scale ?? 0.15,
          } as const
        : undefined;
      // Batch compositing: process slides per platform per server call.
      // Use batch size of 1 for 9:16 (TikTok/Shorts) to stay under Vercel's ~6MB response limit.
      // For smaller aspect ratios, batch 2 at a time.
      const is916 = platforms.some(p => {
        const spec = PLATFORM_IMAGE_SPECS[PLATFORMS.find(pp => pp.key === p)?.specKey ?? "instagram_feed"];
        return spec && spec.height >= 1920;
      });
      const BATCH_SIZE = is916 ? 1 : 2;
      console.log(`[Export] Starting export: ${readySlides.length} slides, ${platforms.length} platforms, batchSize=${BATCH_SIZE}`);
      if (isTestModeEnabled()) {
        logExport("Export started", { platforms, slides: readySlides.length, batchSize: BATCH_SIZE, is916 });
      }
      const allResults: { platform: string; slideIndex: number; imageBase64: string; format: "jpeg" | "png"; imageHash?: string; perceptualHash?: string }[] = [];
      const allWarnings: string[] = [];

      for (const platform of platforms) {
        if (cancelExportRef.current) return;

        // Enforce per-platform max carousel images client-side (hard cap at 10)
        const rules = PLATFORM_RULES[platform as PlatformRulesKey];
        const maxImages = Math.min(rules?.maxCarouselImages ?? 10, 10);
        const platformSlides = readySlides.slice(0, maxImages);
        if (platformSlides.length < readySlides.length) {
          allWarnings.push(`${platform}: limited to ${maxImages} images per platform rules`);
        }

        for (let batchStart = 0; batchStart < platformSlides.length; batchStart += BATCH_SIZE) {
          if (cancelExportRef.current) return;

          const batch = platformSlides.slice(batchStart, batchStart + BATCH_SIZE);
          console.log(`[Export] ${platform}: processing batch ${batchStart / BATCH_SIZE + 1}, slides ${batchStart + 1}-${batchStart + batch.length}`);
          const batchStartTime = Date.now();
          const batchResult = await Promise.race([
            compositeSlideImages(batch, [platform], project.filterConfig, provenanceConfig),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 55_000)),
          ]);
          const batchElapsed = Date.now() - batchStartTime;
          console.log(`[Export] ${platform}: batch completed in ${batchElapsed}ms, result: ${batchResult ? (batchResult.success ? "success" : "error") : "empty"}`);

          if (!batchResult) {
            const isTimeout = batchElapsed >= 54_000;
            const errMsg = isTimeout ? "timeout" : "empty response";
            console.error(`[Export] ${platform}: ${errMsg} for batch at slide ${batchStart + 1} (${batchElapsed}ms)`);
            if (isTestModeEnabled()) {
              addEntry("error", "export", `${platform}: ${errMsg} at slide ${batchStart + 1}`, { batchElapsed, batchSize: BATCH_SIZE, platform });
            }
            toast.error("Export failed", {
              description: isTimeout
                ? "Processing timed out. Try disabling filters or watermarks, or use fewer slides."
                : "Server returned an empty response. Your slides may be too large. Try fewer or smaller images.",
            });
            return;
          }
          if (!batchResult.success) {
            console.error(`[Export] ${platform}: batch error: ${batchResult.error}`);
            if (isTestModeEnabled()) {
              addEntry("error", "export", `${platform}: ${batchResult.error}`, { batchElapsed, platform });
            }
            toast.error("Export failed", { description: batchResult.error });
            return;
          }

          // Remap slideIndex to the global index
          for (const item of batchResult.data) {
            allResults.push({ ...item, slideIndex: batchStart + item.slideIndex });
          }
          if (batchResult.warnings?.length) {
            allWarnings.push(...batchResult.warnings);
          }
        }
      }

      if (cancelExportRef.current) return;

      if (allResults.length === 0) {
        toast.error("Export failed", { description: "No images could be composited. Try re-uploading your images." });
        return;
      }

      if (allWarnings.length > 0) {
        toast.warning("Export completed with warnings", {
          description: allWarnings.join("; "),
        });
      }

      // Create a result-like object for the packaging step below
      const result = { success: true as const, data: allResults, warnings: allWarnings.length > 0 ? allWarnings : undefined };

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

      // Capture image hashes for provenance registration
      const hashes = result.data
        .filter((item) => item.imageHash)
        .map((item) => item.imageHash as string);
      const pHashes = result.data
        .filter((item) => item.perceptualHash)
        .map((item) => item.perceptualHash as string);
      if (hashes.length > 0) {
        setProvenanceHashes(hashes);
        setProvenancePerceptualHashes(pHashes);
        setProvenancePlatform(platforms[0]);
      }

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
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = null;
      }
      setIsExporting(false);
    }
  }

  // Video generation handler
  const handleGenerateVideo = useCallback(async () => {
    if (selected.size === 0 || isVideoGenerating) return;

    // Use the first selected platform for video dimensions
    const platform = Array.from(selected)[0];

    try {
      const videoProvenanceConfig = hasProvenance && provenanceEnabled
        ? {
            creatorName,
            watermarkMode: watermarkMode,
            watermarkText: watermarkText || "Made with KodaPost",
            logoBase64: brandWatermark?.logoDataUri
              ? brandWatermark.logoDataUri.replace(/^data:[^;]+;base64,/, "")
              : undefined,
            logoPosition: brandWatermark?.position ?? "southeast",
            logoOpacity: brandWatermark?.opacity ?? 0.3,
            logoScale: brandWatermark?.scale ?? 0.15,
          }
        : undefined;

      const blob = await generateVideo({
        project,
        platform,
        settings: project.videoSettings ?? DEFAULT_VIDEO_SETTINGS,
        provenanceConfig: videoProvenanceConfig,
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
          description: videoErrorMessage || "Please try again or use image export.",
        });
      }
    } catch (error) {
      toast.error("Video generation failed", {
        description: error instanceof Error ? error.message : "Please try again or use image export.",
      });
    }
  }, [selected, isVideoGenerating, generateVideo, project, readySlides.length, videoUrl, videoErrorMessage, hasProvenance, provenanceEnabled, creatorName, watermarkMode, watermarkText, brandWatermark]);

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
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => {
            cancelExportRef.current = true;
            setIsExporting(false);
            toast("Export cancelled");
          }}
        >
          Cancel Export
        </Button>
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
    <div data-tour="tour-publish-panel" className="space-y-6">
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
        <p className="text-[11px] text-muted-foreground">
          Select platforms for image dimensions. No account connection needed to download or generate video reels.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const isActive = selected.has(platform.key);
            const spec = PLATFORM_IMAGE_SPECS[platform.specKey];
            const isComingSoon = platform.comingSoon === true;

            return (
              <Card
                key={platform.key}
                role="button"
                tabIndex={isComingSoon ? -1 : 0}
                onClick={() => !isComingSoon && togglePlatform(platform.key)}
                onKeyDown={(e) => {
                  if (isComingSoon) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePlatform(platform.key);
                  }
                }}
                className={cn(
                  "transition-all",
                  isComingSoon
                    ? "opacity-60 cursor-default"
                    : "cursor-pointer",
                  isActive && !isComingSoon
                    ? "ring-2 ring-primary shadow-sm"
                    : !isComingSoon && "hover:ring-1 hover:ring-muted-foreground/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          isActive && !isComingSoon
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {platform.icon}
                      </span>
                      <span className="text-sm font-medium">
                        {platform.label}
                      </span>
                      {isComingSoon && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    {!isComingSoon && (
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
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>{platform.formatNote}</p>
                    <p>
                      {spec.aspectRatio} &middot; {spec.width}&times;
                      {spec.height} &middot; {spec.format}
                    </p>
                    {platform.publishMode === "export" && !isComingSoon && (
                      <p className="text-[10px] italic">Export and post manually</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Platform requirements: compact notifications + expandable details */}
      {selected.size > 0 && (() => {
        const selectedRules = Array.from(selected)
          .filter((p): p is PlatformRulesKey => p in PLATFORM_RULES)
          .map((p) => ({ platform: p, rules: PLATFORM_RULES[p] }));

        if (selectedRules.length === 0) return null;

        const PLATFORM_LABELS: Record<string, string> = {
          instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn",
          youtube: "YouTube", youtube_shorts: "YouTube Shorts", x: "X",
        };

        // Collect project-specific warnings
        const warnings: string[] = [];
        for (const { platform, rules } of selectedRules) {
          const label = PLATFORM_LABELS[platform] ?? platform;
          if (!rules.supportsCarousel && readySlides.length > 1) {
            warnings.push(`${label}: single image only. First slide will be used.`);
          } else if (rules.maxCarouselImages < readySlides.length) {
            warnings.push(`${label}: max ${rules.maxCarouselImages} images. First ${rules.maxCarouselImages} exported.`);
          }
          if (platform === "youtube_shorts") {
            warnings.push("YouTube Shorts: keep content within 4:5 safe zone (top/bottom 285px are covered by UI).");
          }
        }

        // Build compact requirement summaries per platform
        const summaries = selectedRules.map(({ platform, rules }) => {
          const label = PLATFORM_LABELS[platform] ?? platform;
          const CAROUSEL_TYPES: Record<string, string> = {
            native_swipe: "Swipeable", photo_mode: "Photo Mode",
            pdf_document: "PDF", vertical_swipe: "Vertical swipe",
            multi_image_grid: "Grid",
          };
          const type = CAROUSEL_TYPES[rules.carouselType] ?? rules.carouselType;
          return { label, type, maxImages: rules.maxCarouselImages, captionMax: rules.captionMax, hashtagOptimal: rules.hashtagOptimal };
        });

        return (
          <div className="space-y-2">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-500/90 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Compact platform requirement chips */}
            <div className="flex flex-wrap gap-1.5">
              {summaries.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0 text-primary/50" />
                  {s.label}: {s.type}, max {s.maxImages} images, {s.hashtagOptimal.min}-{s.hashtagOptimal.max} hashtags
                </span>
              ))}
            </div>

            {/* Expandable full details */}
            <button
              type="button"
              onClick={() => setExpandedRules(!expandedRules)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn("h-3 w-3 transition-transform", expandedRules && "rotate-180")} />
              {expandedRules ? "Hide" : "Show"} platform guidelines
            </button>

            {expandedRules && (
              <div className="space-y-2 pl-1">
                {selectedRules.map(({ platform, rules }) => (
                  <div key={platform} className="rounded-md border border-border bg-muted/20 p-2.5 space-y-1.5">
                    <p className="text-[11px] font-medium text-foreground/80">{PLATFORM_LABELS[platform] ?? platform}</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      <div className="space-y-0.5">
                        {rules.requirements.map((r, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground leading-snug">· {r}</p>
                        ))}
                      </div>
                      <div className="space-y-0.5">
                        {rules.bestPractices.slice(0, 3).map((r, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground leading-snug flex gap-1">
                            <Info className="h-2.5 w-2.5 shrink-0 mt-0.5 text-primary/50" />
                            {r}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Export mode selector */}
      {selected.size > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Export Mode</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {/* Video Reel — always available */}
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
                  {project.audioClip?.objectUrl ? "MP4 with slides + audio" : "MP4 slideshow video"}
                </p>
              </div>
            </button>
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

      {/* Creator Provenance — toggle + watermark mode (Standard + Pro only) */}
      {selected.size > 0 && hasProvenance && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-medium">Creator Provenance</p>
            </div>
            <Switch
              checked={provenanceEnabled}
              onCheckedChange={setProvenanceEnabled}
              aria-label="Toggle Creator Provenance"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Embed your name, timestamp, and a unique image fingerprint into every export.
          </p>

          {provenanceEnabled && (
            <>
              {/* Watermark mode selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Watermark Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "text" as const, label: "Visible Text", desc: `"${watermarkText.slice(0, 30)}${watermarkText.length > 30 ? "..." : ""}"` },
                    { value: "logo" as const, label: "Brand Logo", desc: brandWatermark?.logoDataUri ? "Your uploaded logo" : "Upload a logo first" },
                    { value: "hidden" as const, label: "Hidden Only", desc: "EXIF metadata, no visible mark" },
                    { value: "logo_and_hidden" as const, label: "Logo + Hidden", desc: "Logo watermark + metadata" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWatermarkMode(opt.value)}
                      disabled={
                        (opt.value === "logo" || opt.value === "logo_and_hidden") &&
                        !brandWatermark?.logoDataUri
                      }
                      className={cn(
                        "rounded-lg border p-2.5 text-left transition-all text-xs",
                        watermarkMode === opt.value
                          ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400"
                          : "border-muted-foreground/20 hover:border-muted-foreground/40",
                        (opt.value === "logo" || opt.value === "logo_and_hidden") &&
                          !brandWatermark?.logoDataUri &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

          {/* Watermark text input (only for text mode) */}
          {watermarkMode === "text" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Watermark Text</Label>
              <div className="relative">
                <Input
                  value={watermarkText}
                  onChange={(e) => {
                    const text = e.target.value.slice(0, 50);
                    setWatermarkText(text);
                    const settings = loadSettings();
                    const updated = { ...settings.brandWatermark, watermarkText: text };
                    saveSettings({ ...settings, brandWatermark: updated as BrandWatermarkSettings });
                  }}
                  maxLength={50}
                  className="h-8 text-xs pr-12"
                  placeholder="Made with KodaPost"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                  {watermarkText.length}/50
                </span>
              </div>
            </div>
          )}

          {/* Logo mode: show default KodaPost logo or uploaded brand logo */}
          {(watermarkMode === "logo" || watermarkMode === "logo_and_hidden") && (
            <>
              {!brandWatermark?.logoDataUri ? (
                <div className="space-y-2">
                  {/* Default KodaPost logo */}
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50 p-1">
                      <KodaPostIcon size={24} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">KodaPost Logo (default)</p>
                      <p className="text-[10px] text-muted-foreground">Upload your own brand logo to replace</p>
                    </div>
                  </div>
                  {/* Upload option */}
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">Upload a PNG logo (max 500KB, 64-512px wide)</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 500 * 1024) {
                            toast.error("Logo too large", { description: "Max 500KB" });
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUri = reader.result as string;
                            const img = new Image();
                            img.onload = () => {
                              if (img.width < 64 || img.width > 512) {
                                toast.error("Invalid dimensions", { description: "Logo must be 64-512px wide" });
                                return;
                              }
                              const updated: BrandWatermarkSettings = {
                                logoDataUri: dataUri,
                                mode: watermarkMode,
                                position: brandWatermark?.position ?? "southeast",
                                opacity: brandWatermark?.opacity ?? 0.3,
                                scale: brandWatermark?.scale ?? 0.15,
                                creatorName,
                              };
                              setBrandWatermark(updated);
                              const settings = loadSettings();
                              saveSettings({ ...settings, brandWatermark: updated });
                              toast.success("Logo uploaded");
                            };
                            img.src = dataUri;
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors">
                        <Upload className="h-3 w-3" />
                        Upload Brand Logo
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  {/* Uploaded logo preview */}
                  <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/20 p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandWatermark.logoDataUri}
                      alt="Brand logo"
                      className="h-10 w-10 rounded object-contain bg-muted/50 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Brand Logo</p>
                      <p className="text-[10px] text-muted-foreground">
                        {brandWatermark.position} &middot; {Math.round(brandWatermark.opacity * 100)}% opacity &middot; {Math.round(brandWatermark.scale * 100)}% scale
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...brandWatermark, logoDataUri: null };
                        setBrandWatermark(updated);
                        const settings = loadSettings();
                        saveSettings({ ...settings, brandWatermark: updated });
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Position, opacity, scale controls */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted-foreground w-14 shrink-0">Position</label>
                      <select
                        value={brandWatermark.position}
                        onChange={(e) => {
                          const updated = { ...brandWatermark, position: e.target.value as BrandWatermarkSettings["position"] };
                          setBrandWatermark(updated);
                          const settings = loadSettings();
                          saveSettings({ ...settings, brandWatermark: updated });
                        }}
                        className="h-7 flex-1 rounded border border-muted-foreground/20 bg-transparent px-2 text-xs"
                      >
                        <option value="southeast">Bottom Right</option>
                        <option value="southwest">Bottom Left</option>
                        <option value="northeast">Top Right</option>
                        <option value="northwest">Top Left</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted-foreground w-14 shrink-0">Opacity</label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={Math.round(brandWatermark.opacity * 100)}
                        onChange={(e) => {
                          const updated = { ...brandWatermark, opacity: parseInt(e.target.value) / 100 };
                          setBrandWatermark(updated);
                          const settings = loadSettings();
                          saveSettings({ ...settings, brandWatermark: updated });
                        }}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="text-[11px] text-muted-foreground w-8 text-right">{Math.round(brandWatermark.opacity * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted-foreground w-14 shrink-0">Scale</label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={Math.round(brandWatermark.scale * 100)}
                        onChange={(e) => {
                          const updated = { ...brandWatermark, scale: parseInt(e.target.value) / 100 };
                          setBrandWatermark(updated);
                          const settings = loadSettings();
                          saveSettings({ ...settings, brandWatermark: updated });
                        }}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="text-[11px] text-muted-foreground w-8 text-right">{Math.round(brandWatermark.scale * 100)}%</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
            </>
          )}
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
                  Download Phonographic Reel
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
                  Regenerate Phonographic Reel
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {project.audioClip?.objectUrl ? "Generate Phonographic Reel" : "Generate Video Reel"}
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
                ? "Download Phonographic Reel Package"
                : "Download Image Carousel"}
            </>
          )}
        </Button>
      )}

      {/* Connection error warning */}
      {connectionError && connectedPlatforms.length === 0 && (
        <p className="text-xs text-amber-500">
          Could not check platform connections.{" "}
          <button type="button" onClick={fetchConnectionStatus} className="underline hover:text-amber-400">
            Retry
          </button>
        </p>
      )}

      {/* Post Directly section — only shown when platforms are connected */}
      {connectedPlatforms.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="text-sm font-semibold">Post Directly</h3>
            <p className="text-xs text-muted-foreground">
              Publish directly to the connected platforms you&apos;ve selected above.
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

          {/* Provenance registration — shown after successful publish/export when hashes are available */}
          {hasProvenance && provenanceHashes.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <RegisterProvenanceButton
                imageHashes={provenanceHashes}
                perceptualHashes={provenancePerceptualHashes}
                creatorName={creatorName}
                slideCount={readySlides.length}
                postId={provenancePostId}
                platform={provenancePlatform}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
