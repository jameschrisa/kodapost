"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  GripVertical,
  ImageIcon,
  Loader2,
  Send,
  Smartphone,
  Type,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlideTextOverlay } from "@/components/builder/SlideTextOverlay";
import { MobilePhoneFrame } from "@/components/builder/MobilePhoneFrame";
import {
  PLATFORM_PREVIEW_CONFIG,
  LETTERBOX_PREVIEW_CONFIG,
  MOBILE_ASPECT_RATIOS,
} from "@/lib/constants";
import type { PreviewPlatform, MobileAspectRatio } from "@/lib/constants";
import { PublishDialog } from "@/components/builder/PublishDialog";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import type { CarouselProject, CarouselSlide } from "@/lib/types";
import { KodaPostIcon } from "@/components/icons";

interface CarouselPreviewProps {
  project: CarouselProject;
  onEdit: (project: CarouselProject) => void;
  onPublish: () => void;
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
  onPublish,
  onBack,
}: CarouselPreviewProps) {
  // -- Platform preview --
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>(
    (project.targetPlatforms[0] as PreviewPlatform) || "instagram"
  );
  const [previewMode, setPreviewMode] = useState<"platform" | "letterbox" | "mobile">("platform");

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

  const totalPages = Math.ceil(project.slides.length / SLIDES_PER_PAGE);
  const paginatedSlides = useMemo(
    () => project.slides.slice(currentPage * SLIDES_PER_PAGE, (currentPage + 1) * SLIDES_PER_PAGE),
    [project.slides, currentPage, SLIDES_PER_PAGE]
  );

  // -- Publish dialog state --
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

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
              {hasErrors && " (some slides had errors)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Scheduled badge */}
          {project.scheduledPublishAt && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              Scheduled {new Date(project.scheduledPublishAt).toLocaleDateString()}
            </div>
          )}
          <Button variant="outline" onClick={onPublish} className="gap-2" disabled={readySlides.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setPublishDialogOpen(true)} className="gap-2" disabled={readySlides.length === 0}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Platform preview selector — shows ALL platforms + letterbox */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Preview as:</span>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(PLATFORM_PREVIEW_CONFIG) as PreviewPlatform[]).map((platform) => {
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
          <button
            type="button"
            onClick={() => setPreviewMode(previewMode === "letterbox" ? "platform" : "letterbox")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              previewMode === "letterbox"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Letterbox
            <span className="ml-1 opacity-60">{LETTERBOX_PREVIEW_CONFIG.ratio}</span>
          </button>

          {/* Divider */}
          <div className="mx-1 h-5 w-px bg-border" />

          {/* Mobile device preview */}
          <button
            type="button"
            onClick={() => setPreviewMode(previewMode === "mobile" ? "platform" : "mobile")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5",
              previewMode === "mobile"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
        </div>
      </div>

      {/* Mobile preview sub-controls */}
      {previewMode === "mobile" && (
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
      )}

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
                <div className="flex h-full flex-col items-center justify-center gap-1 bg-muted px-4 text-center">
                  <ImageIcon className="h-6 w-6 text-destructive" />
                  <p className="text-xs text-destructive">Generation failed</p>
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

      {/* Publish dialog */}
      <PublishDialog
        project={project}
        onProjectUpdate={onEdit}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
      />
    </div>
  );
}
