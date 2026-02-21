"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  ImageIcon,
  Loader2,
  RefreshCw,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SlideTextOverlay } from "@/components/builder/SlideTextOverlay";
import { MobilePhoneFrame } from "@/components/builder/MobilePhoneFrame";
import {
  PLATFORM_PREVIEW_CONFIG,
  LETTERBOX_PREVIEW_CONFIG,
  MOBILE_ASPECT_RATIOS,
} from "@/lib/constants";
import type { PreviewPlatform, MobileAspectRatio } from "@/lib/constants";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import type { CarouselProject, CarouselSlide } from "@/lib/types";
import { KodaPostIcon } from "@/components/icons";
import { regenerateSlide } from "@/app/actions";

interface CarouselPreviewProps {
  project: CarouselProject;
  onEdit: (project: CarouselProject) => void;
  onBack?: () => void;
}

const SLIDE_TYPE_LABELS: Record<CarouselSlide["slideType"], string> = {
  hook: "Hook",
  story: "Story",
  closer: "Closer",
};

export function CarouselPreview({
  project,
  onEdit,
  onBack,
}: CarouselPreviewProps) {
  // -- Platform preview --
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>(
    (project.targetPlatforms[0] as PreviewPlatform) || "instagram"
  );
  const [previewMode, setPreviewMode] = useState<"platform" | "letterbox" | "mobile">("platform");
  const [previewTab, setPreviewTab] = useState<"platform" | "device">("platform");

  // -- Mobile preview state --
  const [mobileAspectRatio, setMobileAspectRatio] = useState<MobileAspectRatio>("19.5:9");

  // -- Computed values --
  const readySlides = useMemo(
    () => project.slides.filter((s) => s.status === "ready"),
    [project.slides]
  );
  const hasErrors = project.slides.some((s) => s.status === "error");

  // -- Camera filter styles for preview --
  const filterStyles = useMemo(
    () => getCameraFilterStyles(project.filterConfig ?? DEFAULT_FILTER_CONFIG),
    [project.filterConfig]
  );
  const grainSVG = useMemo(() => getGrainSVGDataUri(), []);

  const platformConfig = PLATFORM_PREVIEW_CONFIG[previewPlatform];

  // Aspect class for the image area (used in platform/letterbox modes)
  const previewAspectClass = previewMode === "letterbox"
    ? LETTERBOX_PREVIEW_CONFIG.aspectClass
    : platformConfig.aspectClass;

  // Phone screen aspect class (used inside the phone frame)
  const mobileScreenAspectClass = MOBILE_ASPECT_RATIOS[mobileAspectRatio].aspectClass;

  const gridScale = useMemo(() => {
    if (previewMode === "mobile") return 0.2;
    return previewPlatform === "tiktok" && previewMode !== "letterbox" ? 0.3 : 0.4;
  }, [previewMode, previewPlatform]);

  // Letterbox mode uses object-contain; mobile uses object-cover (the container provides letterboxing)
  const imageObjectFit = previewMode === "letterbox"
    ? "object-contain"
    : "object-cover";

  const gridColsClass = useMemo(() => {
    if (previewMode === "mobile") {
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
    }
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }, [previewMode]);

  // -- Pagination --
  const SLIDES_PER_PAGE = 6;

  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when mode changes to avoid landing on an invalid page
  useEffect(() => {
    setCurrentPage(0);
  }, [previewMode]);

  // Sync previewTab → previewMode
  useEffect(() => {
    if (previewTab === "device") {
      setPreviewMode("mobile");
    } else {
      setPreviewMode("platform");
    }
  }, [previewTab]);

  const totalPages = Math.ceil(project.slides.length / SLIDES_PER_PAGE);
  const paginatedSlides = useMemo(
    () => project.slides.slice(currentPage * SLIDES_PER_PAGE, (currentPage + 1) * SLIDES_PER_PAGE),
    [project.slides, currentPage, SLIDES_PER_PAGE]
  );

  // -- Retry state --
  const [retryingSlides, setRetryingSlides] = useState<Set<number>>(new Set());

  const handleRetrySlide = useCallback(async (slideIndex: number) => {
    setRetryingSlides((prev) => new Set(prev).add(slideIndex));
    try {
      const result = await regenerateSlide(project, slideIndex);
      if (result.success) {
        const updatedSlides = [...project.slides];
        updatedSlides[slideIndex] = result.data;
        onEdit({ ...project, slides: updatedSlides });
        toast.success(`Slide ${slideIndex + 1} regenerated`);
      } else {
        toast.error(`Slide ${slideIndex + 1} failed again`, {
          description: result.error,
        });
      }
    } catch {
      toast.error(`Slide ${slideIndex + 1} retry failed`);
    } finally {
      setRetryingSlides((prev) => {
        const next = new Set(prev);
        next.delete(slideIndex);
        return next;
      });
    }
  }, [project, onEdit]);

  const handleRetryAllFailed = useCallback(async () => {
    const failedIndices = project.slides
      .map((s, i) => (s.status === "error" ? i : -1))
      .filter((i) => i >= 0);
    if (failedIndices.length === 0) return;

    setRetryingSlides(new Set(failedIndices));
    let successCount = 0;

    for (const idx of failedIndices) {
      try {
        const result = await regenerateSlide(project, idx);
        if (result.success) {
          const updatedSlides = [...project.slides];
          updatedSlides[idx] = result.data;
          onEdit({ ...project, slides: updatedSlides });
          successCount++;
        }
      } catch {
        // Continue with remaining slides
      } finally {
        setRetryingSlides((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }
    }

    if (successCount === failedIndices.length) {
      toast.success("All failed slides regenerated");
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${failedIndices.length} slides recovered`);
    } else {
      toast.error("All retries failed");
    }
  }, [project, onEdit]);

  // -- Drag to reorder --
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDragStart = useCallback((position: number) => {
    dragItem.current = position;
  }, []);

  const handleDragEnter = useCallback((position: number) => {
    dragOver.current = position;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }

    const reordered = [...project.slides];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);

    const updated = reordered.map((slide, idx) => ({
      ...slide,
      position: idx,
    }));

    dragItem.current = null;
    dragOver.current = null;
    onEdit({ ...project, slides: updated });
  }, [project, onEdit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              &larr; Back
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold">Review</h2>
            <p className="text-sm text-muted-foreground">
              {readySlides.length} of {project.slides.length} slides ready
              {hasErrors && (
                <span className="text-amber-400">
                  {" "}({project.slides.filter(s => s.status === "error").length} failed)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Retry failed slides */}
          {hasErrors && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              onClick={handleRetryAllFailed}
              disabled={retryingSlides.size > 0}
            >
              {retryingSlides.size > 0 ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Failed
                </>
              )}
            </Button>
          )}
          {/* Scheduled badge */}
          {project.scheduledPublishAt && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              Scheduled {new Date(project.scheduledPublishAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Platform Preview / Device Preview tabs */}
      <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "platform" | "device")}>
        <TabsList>
          <TabsTrigger value="platform">Platform Preview</TabsTrigger>
          <TabsTrigger value="device">Device Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-3">
          <div className="flex gap-1 flex-wrap">
            {(["tiktok", "youtube_shorts", "instagram", "x", "linkedin"] as PreviewPlatform[]).map((platform) => {
              const config = PLATFORM_PREVIEW_CONFIG[platform];
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    setPreviewPlatform(platform);
                    setPreviewMode("platform");
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    previewMode === "platform" && previewPlatform === platform
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {config.label}
                  <span className="ml-1 opacity-60">{config.ratio}</span>
                </button>
              );
            })}
            {/* YouTube Community 1:1 square */}
            <button
              type="button"
              onClick={() => {
                setPreviewPlatform("youtube");
                setPreviewMode("platform");
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                previewMode === "platform" && previewPlatform === "youtube"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              YouTube
              <span className="ml-1 opacity-60">1:1</span>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="device" className="mt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Screen:</span>
              <div className="flex gap-1">
                {(Object.keys(MOBILE_ASPECT_RATIOS) as MobileAspectRatio[]).map((ratio) => {
                  const config = MOBILE_ASPECT_RATIOS[ratio];
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setMobileAspectRatio(ratio)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        mobileAspectRatio === ratio
                          ? "bg-secondary text-secondary-foreground ring-1 ring-primary/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                      title={config.description}
                    >
                      {ratio}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-muted-foreground/70">
                {MOBILE_ASPECT_RATIOS[mobileAspectRatio].description}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Slide grid — read-only with drag-to-reorder */}
      <div className={cn("grid gap-4", gridColsClass)}>
        {paginatedSlides.map((slide) => {
          // Shared slide content renderer to avoid duplication between mobile/normal modes
          const slideContent = (
            <>
              {slide.status === "generating" && (
                <div className="flex h-full items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {slide.status === "error" && (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-muted px-4 text-center">
                  {retryingSlides.has(slide.position) ? (
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 text-destructive" />
                      <p className="text-[10px] text-destructive">Failed</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetrySlide(slide.position);
                        }}
                        className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/25 transition-colors"
                      >
                        <RefreshCw className="h-2.5 w-2.5" />
                        Retry
                      </button>
                    </>
                  )}
                </div>
              )}
              {slide.status === "pending" && (
                <div className="flex h-full items-center justify-center bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              {slide.imageUrl && slide.status === "ready" && (
                <div className="relative h-full w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${slide.position + 1}`}
                    className={cn("h-full w-full", imageObjectFit)}
                    style={{ filter: filterStyles.imageFilter }}
                  />
                  {/* Filter gradient overlay */}
                  {filterStyles.overlayGradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: filterStyles.overlayGradient,
                        mixBlendMode: (filterStyles.overlayBlendMode || "normal") as React.CSSProperties["mixBlendMode"],
                      }}
                    />
                  )}
                  {/* Vignette overlay */}
                  {filterStyles.vignetteGradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: filterStyles.vignetteGradient }}
                    />
                  )}
                  {/* Grain overlay */}
                  {filterStyles.grainOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: grainSVG,
                        backgroundRepeat: "repeat",
                        opacity: filterStyles.grainOpacity,
                        mixBlendMode: "overlay",
                      }}
                    />
                  )}
                </div>
              )}
              {!slide.imageUrl && slide.status === "ready" && (
                // Text-only slide: styled gradient background
                <div
                  className="absolute inset-0"
                  style={{
                    background: slide.textOverlay?.styling?.backgroundColor
                      ? `linear-gradient(135deg, ${slide.textOverlay.styling.backgroundColor}, ${slide.textOverlay.styling.backgroundColor})`
                      : "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
                  }}
                />
              )}
              {slide.textOverlay && slide.status === "ready" && (
                <SlideTextOverlay overlay={slide.textOverlay} scale={gridScale} />
              )}
            </>
          );

          return (
            <Card
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(slide.position)}
              onDragEnter={() => handleDragEnter(slide.position)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "group relative overflow-hidden transition-shadow",
                "hover:shadow-md",
                slide.status === "error" && "ring-2 ring-destructive/50"
              )}
            >
              {/* Drag handle */}
              <div className="absolute left-1 top-1 z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>

              {/* Slide number badge */}
              <div className="absolute left-1.5 bottom-1.5 z-10 flex h-5 min-w-[20px] items-center justify-center rounded bg-black/60 px-1 text-[10px] font-bold text-white">
                {slide.position + 1}
              </div>

              {/* Source badge */}
              <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {slide.metadata?.source === "user_upload" ? (
                  <>
                    <KodaPostIcon className="h-2.5 w-2.5" />
                    Photo
                  </>
                ) : (
                  <>
                    <Type className="h-2.5 w-2.5" />
                    Text
                  </>
                )}
              </div>

              {/* Slide type tag */}
              <div className="absolute right-1.5 bottom-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
                {SLIDE_TYPE_LABELS[slide.slideType]}
              </div>

              {/* Image area with text overlay — wrapped in phone frame for mobile mode */}
              {previewMode === "mobile" ? (
                <MobilePhoneFrame
                  screenAspectClass={mobileScreenAspectClass}
                  totalSlides={readySlides.length}
                  currentSlide={slide.position}
                >
                  {/* Aspect-ratio-constrained container matching the platform image ratio.
                      Letterboxing comes from this being smaller than the phone screen.
                      Text overlays position correctly because they're relative to this container. */}
                  <div className={cn("relative w-full", previewAspectClass)}>
                    {slideContent}
                  </div>
                </MobilePhoneFrame>
              ) : (
                <div className={cn("relative bg-black", previewAspectClass)}>
                  {slideContent}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

    </div>
  );
}
