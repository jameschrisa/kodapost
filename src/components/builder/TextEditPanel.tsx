"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Crop,
  Italic,
  Move,
  Paintbrush,
  SunMoon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, isLightColor } from "@/lib/utils";
import { SlideTextOverlay } from "@/components/builder/SlideTextOverlay";
import {
  DEFAULT_OVERLAY_STYLING,
  DEFAULT_OVERLAY_PADDING,
  DEFAULT_FREE_POSITION,
  DEFAULT_GLOBAL_OVERLAY_STYLE,
  FREE_POSITION_FROM_ALIGNMENT,
  FREE_POSITION_X_FROM_HORIZONTAL,
  FONT_OPTIONS,
  PLATFORM_PREVIEW_CONFIG,
  COLOR_SCHEMES,
  DEFAULT_BG_PADDING,
} from "@/lib/constants";
import type { PreviewPlatform } from "@/lib/constants";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import { ImageCropDialog } from "@/components/builder/ImageCropDialog";
import { SaveProjectButton } from "@/components/shared/SaveProjectButton";
import { PLATFORM_IMAGE_SPECS } from "@/lib/constants";
import type { CarouselProject, CarouselSlide, TextOverlay } from "@/lib/types";

interface TextEditPanelProps {
  project: CarouselProject;
  onEdit: (project: CarouselProject) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TextEditPanel({ project, onEdit, onNext, onBack }: TextEditPanelProps) {
  const readySlides = useMemo(
    () => project.slides.filter((s) => s.status === "ready"),
    [project.slides]
  );

  // -- Camera filter styles for preview --
  const filterStyles = useMemo(
    () => getCameraFilterStyles(project.filterConfig ?? DEFAULT_FILTER_CONFIG),
    [project.filterConfig]
  );
  const grainSVG = useMemo(() => getGrainSVGDataUri(), []);

  // -- Selected slide --
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSlide = readySlides[selectedIndex] ?? null;

  // -- Crop dialog state --
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropSlide, setCropSlide] = useState<CarouselSlide | null>(null);

  // Compute aspect ratio from the first target platform
  const cropAspectRatio = useMemo(() => {
    const platform = project.targetPlatforms[0] ?? "instagram";
    const specKey = platform === "instagram"
      ? "instagram_feed"
      : platform === "linkedin"
        ? "linkedin_pdf"
        : platform as keyof typeof PLATFORM_IMAGE_SPECS;
    const spec = PLATFORM_IMAGE_SPECS[specKey as keyof typeof PLATFORM_IMAGE_SPECS];
    return spec ? spec.width / spec.height : 4 / 5;
  }, [project.targetPlatforms]);

  // -- Refresh key to force re-sync after Apply to All --
  const [styleRefreshKey, setStyleRefreshKey] = useState(0);

  // -- Per-slide editing state --
  const [editTextEnabled, setEditTextEnabled] = useState(true);
  const [editPrimary, setEditPrimary] = useState("");
  const [editFontFamily, setEditFontFamily] = useState(DEFAULT_OVERLAY_STYLING.fontFamily);
  const [editFontSizePrimary, setEditFontSizePrimary] = useState(DEFAULT_OVERLAY_STYLING.fontSize.primary);
  const [editFontSizeSecondary, setEditFontSizeSecondary] = useState(DEFAULT_OVERLAY_STYLING.fontSize.secondary);
  const [editTextAlign, setEditTextAlign] = useState<"left" | "center" | "right">("center");
  const [editFontStyle, setEditFontStyle] = useState<"normal" | "italic">("normal");
  const [editTextColor, setEditTextColor] = useState("#FFFFFF");
  const [editBgPadX, setEditBgPadX] = useState<number>(DEFAULT_BG_PADDING.x);
  const [editBgPadY, setEditBgPadY] = useState<number>(DEFAULT_BG_PADDING.y);

  // -- Drag state --
  const [isDragging, setIsDragging] = useState(false);
  const grabOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // -- Global style toolbar --
  const gos = project.globalOverlayStyle ?? DEFAULT_GLOBAL_OVERLAY_STYLE;
  const [globalToolbarOpen, setGlobalToolbarOpen] = useState(false);
  const [globalFontFamily, setGlobalFontFamily] = useState(gos.fontFamily);
  const [globalFontSizePrimary, setGlobalFontSizePrimary] = useState(gos.fontSize.primary);
  const globalFontSizeSecondary = gos.fontSize.secondary;
  const [globalVerticalAlign, setGlobalVerticalAlign] = useState<"top" | "center" | "bottom">(gos.alignment);
  const [globalShowHeadline, setGlobalShowHeadline] = useState(gos.showHeadline);
  const [globalTextAlign, setGlobalTextAlign] = useState<"left" | "center" | "right">(gos.textAlign ?? "center");
  const [globalFontStyle, setGlobalFontStyle] = useState<"normal" | "italic">(gos.fontStyle ?? "normal");
  const [globalTextColor, setGlobalTextColor] = useState(gos.textColor ?? "#FFFFFF");
  const [globalBgPadX, setGlobalBgPadX] = useState<number>(gos.backgroundPadding?.x ?? DEFAULT_BG_PADDING.x);
  const [globalBgPadY, setGlobalBgPadY] = useState<number>(gos.backgroundPadding?.y ?? DEFAULT_BG_PADDING.y);

  // -- Platform preview --
  const [previewPlatform] = useState<PreviewPlatform>(
    (project.targetPlatforms[0] as PreviewPlatform) || "instagram"
  );
  const platformConfig = PLATFORM_PREVIEW_CONFIG[previewPlatform];

  // Scale for the large preview (500px / 1080px ≈ 0.46)
  const previewScale = 0.46;

  // ── Load slide state when selection changes ──
  useEffect(() => {
    if (!selectedSlide) return;
    const overlay = selectedSlide.textOverlay;
    setEditTextEnabled(selectedSlide.textOverlayState?.enabled !== false);
    setEditPrimary(overlay?.content.primary ?? "");
    setEditFontFamily(overlay?.styling.fontFamily ?? DEFAULT_OVERLAY_STYLING.fontFamily);
    setEditFontSizePrimary(overlay?.styling.fontSize.primary ?? DEFAULT_OVERLAY_STYLING.fontSize.primary);
    setEditFontSizeSecondary(overlay?.styling.fontSize.secondary ?? DEFAULT_OVERLAY_STYLING.fontSize.secondary);
    setEditTextAlign(overlay?.styling.textAlign ?? "center");
    setEditFontStyle(overlay?.styling.fontStyle ?? "normal");
    setEditTextColor(overlay?.styling.textColor ?? "#FFFFFF");
    setEditBgPadX(overlay?.styling.backgroundPadding?.x ?? DEFAULT_BG_PADDING.x);
    setEditBgPadY(overlay?.styling.backgroundPadding?.y ?? DEFAULT_BG_PADDING.y);
  }, [selectedIndex, selectedSlide?.id, styleRefreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build live overlay from editing state ──
  const liveOverlay = useMemo<TextOverlay | null>(() => {
    if (!selectedSlide) return null;
    const existing = selectedSlide.textOverlay;
    const baseStyling = existing?.styling ?? { ...DEFAULT_OVERLAY_STYLING };
    const freePos = existing?.positioning?.freePosition ?? DEFAULT_FREE_POSITION;

    return {
      content: {
        primary: editPrimary,
        accent: existing?.content.accent,
      },
      styling: {
        ...baseStyling,
        fontFamily: editFontFamily,
        fontSize: { primary: editFontSizePrimary, secondary: editFontSizeSecondary },
        textAlign: editTextAlign,
        fontStyle: editFontStyle,
        textColor: editTextColor,
        backgroundColor: isLightColor(editTextColor) ? COLOR_SCHEMES.dark.backgroundColor : COLOR_SCHEMES.light.backgroundColor,
        backgroundPadding: { x: editBgPadX, y: editBgPadY },
      },
      positioning: {
        alignment: existing?.positioning?.alignment ?? "bottom",
        horizontalAlign: existing?.positioning?.horizontalAlign ?? "center",
        padding: existing?.positioning?.padding ?? { ...DEFAULT_OVERLAY_PADDING },
        freePosition: freePos,
      },
    };
  }, [selectedSlide, editPrimary, editFontFamily, editFontSizePrimary, editFontSizeSecondary, editTextAlign, editFontStyle, editTextColor, editBgPadX, editBgPadY]);

  // ── Auto-save with debounce (text/font changes) ──
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!selectedSlide || !liveOverlay) return;

    // Serialize to detect real changes vs no-ops
    const key = JSON.stringify(liveOverlay.content) + JSON.stringify(liveOverlay.styling) + String(editTextEnabled);
    if (key === lastSavedRef.current) return;

    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedRef.current = key;
      const updatedSlides = project.slides.map((s) => {
        if (s.id !== selectedSlide.id) return s;
        return {
          ...s,
          textOverlay: liveOverlay,
          textOverlayState: {
            slideId: s.id,
            enabled: editTextEnabled,
            source: "user_override" as const,
            lastModified: new Date().toISOString(),
            customizations: {
              textEdited: true,
              styleEdited: true,
              positionEdited: s.textOverlayState?.customizations?.positionEdited ?? false,
            },
          },
        };
      });
      onEdit({ ...project, slides: updatedSlides });
    }, 300);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [liveOverlay, selectedSlide, project, onEdit, editTextEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-slide text visibility toggle ──
  function toggleEditText(enabled: boolean) {
    setEditTextEnabled(enabled);
    if (!enabled) {
      setEditPrimary("");
    } else {
      setEditPrimary(selectedSlide?.aiGeneratedOverlay?.content.primary ?? "");
    }
  }

  // ── Drag-to-position using freePosition percentages ──

  function updateSlideFreePosition(x: number, y: number) {
    if (!selectedSlide) return;
    const updatedSlides = project.slides.map((s) => {
      if (s.id !== selectedSlide.id) return s;
      const existing = s.textOverlay;
      if (!existing) return s;
      return {
        ...s,
        textOverlay: {
          ...existing,
          positioning: {
            ...existing.positioning,
            freePosition: { x, y },
          },
        },
        textOverlayState: {
          slideId: s.id,
          enabled: true,
          source: "user_override" as const,
          lastModified: new Date().toISOString(),
          customizations: { textEdited: false, styleEdited: false, positionEdited: true },
        },
      };
    });
    onEdit({ ...project, slides: updatedSlides });
  }

  function handleDragMouseDown(e: React.MouseEvent) {
    if (!previewContainerRef.current || !liveOverlay) return;
    e.preventDefault();

    const rect = previewContainerRef.current.getBoundingClientRect();
    const freePos = liveOverlay.positioning.freePosition ?? DEFAULT_FREE_POSITION;

    // Where the text anchor currently is in pixel space
    const anchorPxX = (freePos.x / 100) * rect.width;
    const anchorPxY = (freePos.y / 100) * rect.height;

    // Mouse position relative to container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Store grab offset so text doesn't jump to cursor
    grabOffsetRef.current = {
      x: mouseX - anchorPxX,
      y: mouseY - anchorPxY,
    };
    setIsDragging(true);
  }

  function handleDragMouseMove(e: React.MouseEvent) {
    if (!isDragging || !grabOffsetRef.current || !previewContainerRef.current) return;
    e.preventDefault();

    const rect = previewContainerRef.current.getBoundingClientRect();

    // New anchor position = mouse minus grab offset
    const anchorX = e.clientX - rect.left - grabOffsetRef.current.x;
    const anchorY = e.clientY - rect.top - grabOffsetRef.current.y;

    // Convert to percentage — the key simplification
    const newX = Math.max(5, Math.min(95, (anchorX / rect.width) * 100));
    const newY = Math.max(5, Math.min(95, (anchorY / rect.height) * 100));

    updateSlideFreePosition(Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
  }

  function handleDragMouseUp() {
    setIsDragging(false);
    grabOffsetRef.current = null;
  }

  // Touch event wrappers for mobile
  function handleTouchStart(e: React.TouchEvent) {
    if (!previewContainerRef.current || !liveOverlay || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = previewContainerRef.current.getBoundingClientRect();
    const freePos = liveOverlay.positioning.freePosition ?? DEFAULT_FREE_POSITION;

    const anchorPxX = (freePos.x / 100) * rect.width;
    const anchorPxY = (freePos.y / 100) * rect.height;
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    grabOffsetRef.current = { x: touchX - anchorPxX, y: touchY - anchorPxY };
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || !grabOffsetRef.current || !previewContainerRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = previewContainerRef.current.getBoundingClientRect();

    const anchorX = touch.clientX - rect.left - grabOffsetRef.current.x;
    const anchorY = touch.clientY - rect.top - grabOffsetRef.current.y;

    const newX = Math.max(5, Math.min(95, (anchorX / rect.width) * 100));
    const newY = Math.max(5, Math.min(95, (anchorY / rect.height) * 100));

    updateSlideFreePosition(Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
  }

  // ── Apply Global Style to All ──
  function applyGlobalStyle() {
    const freePos = {
      x: FREE_POSITION_X_FROM_HORIZONTAL["center"],
      y: FREE_POSITION_FROM_ALIGNMENT[globalVerticalAlign].y,
    };

    const updatedSlides = project.slides.map((s) => {
      const existingOverlay = s.textOverlay;
      if (!existingOverlay) return s;

      // Determine text content based on visibility toggles
      const primaryText = globalShowHeadline
        ? (s.aiGeneratedOverlay?.content.primary || existingOverlay.content.primary || "")
        : "";

      return {
        ...s,
        textOverlay: {
          content: {
            primary: primaryText,
            accent: existingOverlay.content.accent,
          },
          styling: {
            ...existingOverlay.styling,
            fontFamily: globalFontFamily,
            fontSize: { primary: globalFontSizePrimary, secondary: globalFontSizeSecondary },
            textAlign: globalTextAlign,
            fontStyle: globalFontStyle,
            textColor: globalTextColor,
            backgroundColor: isLightColor(globalTextColor) ? COLOR_SCHEMES.dark.backgroundColor : COLOR_SCHEMES.light.backgroundColor,
            backgroundPadding: { x: globalBgPadX, y: globalBgPadY },
          },
          positioning: {
            ...existingOverlay.positioning,
            freePosition: freePos,
          },
        },
        textOverlayState: {
          slideId: s.id,
          enabled: true,
          source: "preset_applied" as const,
          lastModified: new Date().toISOString(),
          customizations: { textEdited: false, styleEdited: true, positionEdited: true },
        },
      };
    });

    onEdit({
      ...project,
      slides: updatedSlides,
      globalOverlayStyle: {
        fontFamily: globalFontFamily,
        fontSize: { primary: globalFontSizePrimary, secondary: globalFontSizeSecondary },
        fontWeight: gos.fontWeight,
        textColor: globalTextColor,
        backgroundColor: isLightColor(globalTextColor) ? COLOR_SCHEMES.dark.backgroundColor : COLOR_SCHEMES.light.backgroundColor,
        textShadow: gos.textShadow,
        alignment: globalVerticalAlign,
        horizontalAlign: "center" as const,
        padding: gos.padding,
        showHeadline: globalShowHeadline,
        showSubtitle: false,
        freePosition: freePos,
        textAlign: globalTextAlign,
        fontStyle: globalFontStyle,
        backgroundPadding: { x: globalBgPadX, y: globalBgPadY },
      },
    });

    toast.success(`Style applied to all ${project.slides.length} slides`);
    // Force local edit state to re-sync from updated project
    setStyleRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Editorial</h2>
            <p className="text-sm text-muted-foreground">
              Drag to position text. Changes save automatically.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SaveProjectButton project={project} />
          <Button onClick={onNext} className="gap-2">
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Global Style Toolbar — only for carousel mode (multiple slides) */}
      {(project.postMode ?? "carousel") === "carousel" && (
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setGlobalToolbarOpen(!globalToolbarOpen)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <Paintbrush className="h-4 w-4" />
          Style All Slides
          {globalToolbarOpen ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
        </button>
        {globalToolbarOpen && (
          <div className="border-t px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Font */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font</Label>
                <Select value={globalFontFamily} onValueChange={setGlobalFontFamily}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__sep_sans" disabled>Sans Serif</SelectItem>
                    {FONT_OPTIONS.filter((f) => f.category === "sans-serif").map((font) => (
                      <SelectItem key={font.label} value={font.label}>{font.label}</SelectItem>
                    ))}
                    <SelectItem value="__sep_serif" disabled>Serif</SelectItem>
                    {FONT_OPTIONS.filter((f) => f.category === "serif" || f.category === "display").map((font) => (
                      <SelectItem key={font.label} value={font.label}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Headline Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Headline Size</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{globalFontSizePrimary}px</span>
                </div>
                <Slider min={24} max={96} step={2} value={[globalFontSizePrimary]} onValueChange={([v]) => setGlobalFontSizePrimary(v)} />
              </div>
              {/* Vertical Position */}
              <div className="space-y-1.5">
                <Label className="text-xs">Vertical Position</Label>
                <Select value={globalVerticalAlign} onValueChange={(v) => setGlobalVerticalAlign(v as "top" | "center" | "bottom")}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Text Alignment + Italic + Color Scheme */}
              <div className="space-y-1.5">
                <Label className="text-xs">Text Align</Label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setGlobalTextAlign(align)}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        globalTextAlign === align
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                      {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                      {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                  <div className="w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => setGlobalFontStyle(globalFontStyle === "italic" ? "normal" : "italic")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      globalFontStyle === "italic"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-px bg-border mx-1" />
                  {/* Text color presets + custom picker */}
                  <button
                    type="button"
                    onClick={() => setGlobalTextColor(COLOR_SCHEMES.dark.textColor)}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      globalTextColor === COLOR_SCHEMES.dark.textColor
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="White text"
                  >
                    <SunMoon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalTextColor(COLOR_SCHEMES.light.textColor)}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      globalTextColor === COLOR_SCHEMES.light.textColor
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="Dark text"
                  >
                    <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] font-bold">A</span>
                  </button>
                  {/* Custom text color picker */}
                  <label className="relative h-7 w-7 cursor-pointer rounded-md" title="Custom text color">
                    <input
                      type="color"
                      value={globalTextColor}
                      onChange={(e) => setGlobalTextColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                      className={cn(
                        "h-7 w-7 rounded-md border-2 transition-all",
                        globalTextColor !== COLOR_SCHEMES.dark.textColor && globalTextColor !== COLOR_SCHEMES.light.textColor
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-muted-foreground/30"
                      )}
                      style={{ backgroundColor: globalTextColor }}
                    />
                  </label>
                </div>
              </div>
            </div>
            {/* Background Padding */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Bg Padding H</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{globalBgPadX}px</span>
                </div>
                <Slider min={0} max={40} step={1} value={[globalBgPadX]} onValueChange={([v]) => setGlobalBgPadX(v)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Bg Padding V</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{globalBgPadY}px</span>
                </div>
                <Slider min={0} max={30} step={1} value={[globalBgPadY]} onValueChange={([v]) => setGlobalBgPadY(v)} />
              </div>
            </div>
            {/* Visibility toggles + Apply */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch id="glob-headline" checked={globalShowHeadline} onCheckedChange={setGlobalShowHeadline} />
                <Label htmlFor="glob-headline" className="text-xs">Show Headline</Label>
              </div>
              <Button onClick={applyGlobalStyle} size="sm" className="gap-2 ml-auto shrink-0">
                <Paintbrush className="h-3.5 w-3.5" />
                Apply to All
              </Button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Main editing area: sidebar + preview + controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
        {/* Left sidebar: slide thumbnails */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[650px] pb-2 lg:pb-0">
          {readySlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "group relative shrink-0 w-20 lg:w-full overflow-hidden rounded-lg border-2 transition-all",
                idx === selectedIndex
                  ? "border-primary shadow-md ring-1 ring-primary/30"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <div className={cn("relative bg-black", platformConfig.aspectClass)}>
                {slide.imageUrl && (
                  <div className="relative h-full w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.imageUrl}
                      alt={`Slide ${slide.position + 1}`}
                      className="h-full w-full object-cover"
                      style={{ filter: filterStyles.imageFilter }}
                    />
                  </div>
                )}
                {!slide.imageUrl && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: slide.textOverlay?.styling?.backgroundColor
                        ? slide.textOverlay.styling.backgroundColor
                        : "#1e1e1e",
                    }}
                  />
                )}
                {slide.textOverlay && (
                  <SlideTextOverlay overlay={slide.textOverlay} scale={0.15} />
                )}
              </div>
              <div className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                {slide.position + 1}
              </div>
              {slide.imageUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCropSlide(slide);
                    setCropDialogOpen(true);
                  }}
                  className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  title="Crop image"
                >
                  <Crop className="h-2.5 w-2.5" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Right: large preview + inline controls */}
        <div className="space-y-4">
          {/* Large draggable preview */}
          <div className="flex justify-center">
            <div
              ref={previewContainerRef}
              onMouseDown={handleDragMouseDown}
              onMouseMove={handleDragMouseMove}
              onMouseUp={handleDragMouseUp}
              onMouseLeave={handleDragMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragMouseUp}
              className={cn(
                "relative w-full max-w-[500px] overflow-hidden rounded-lg bg-black shadow-lg select-none",
                platformConfig.aspectClass,
                isDragging ? "cursor-grabbing" : "cursor-move"
              )}
            >
              {selectedSlide?.imageUrl && (
                <div className="relative h-full w-full overflow-hidden pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSlide.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    style={{ filter: filterStyles.imageFilter }}
                  />
                  {filterStyles.overlayGradient && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: filterStyles.overlayGradient,
                        mixBlendMode: (filterStyles.overlayBlendMode || "normal") as React.CSSProperties["mixBlendMode"],
                      }}
                    />
                  )}
                  {filterStyles.vignetteGradient && (
                    <div className="absolute inset-0" style={{ background: filterStyles.vignetteGradient }} />
                  )}
                  {filterStyles.grainOpacity > 0 && (
                    <div
                      className="absolute inset-0"
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
              {selectedSlide && !selectedSlide.imageUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: selectedSlide.textOverlay?.styling?.backgroundColor
                      ? `linear-gradient(135deg, ${selectedSlide.textOverlay.styling.backgroundColor}, ${selectedSlide.textOverlay.styling.backgroundColor})`
                      : "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
                  }}
                />
              )}
              {liveOverlay && (
                <SlideTextOverlay overlay={liveOverlay} scale={previewScale} interactive />
              )}
              {/* Drag hint */}
              {!isDragging && liveOverlay?.content.primary && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-white/80 pointer-events-none">
                  <Move className="h-3 w-3" />
                  Drag to position
                </div>
              )}
              {!selectedSlide && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-white/50">No slides available</p>
                </div>
              )}
            </div>
          </div>

          {/* Inline text editing controls */}
          {selectedSlide && (
            <Tabs defaultValue="format" className="max-w-[500px] mx-auto">
              <TabsList data-tour="tour-edit-panel" className="w-full mb-3">
                <TabsTrigger value="format" className="flex-1">Format</TabsTrigger>
                <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
              </TabsList>

              {/* Format tab: styling controls */}
              <TabsContent value="format" className="space-y-4 mt-0">
                {/* 1. Icon toolbar: alignment + italic + text color */}
                <div className="flex items-center gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setEditTextAlign(align)}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        editTextAlign === align
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                      {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                      {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                  <div className="w-px bg-border mx-1 h-6" />
                  <button
                    type="button"
                    onClick={() => setEditFontStyle(editFontStyle === "italic" ? "normal" : "italic")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      editFontStyle === "italic"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-px bg-border mx-1 h-6" />
                  {/* Text color presets + custom picker */}
                  <button
                    type="button"
                    onClick={() => setEditTextColor(COLOR_SCHEMES.dark.textColor)}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      editTextColor === COLOR_SCHEMES.dark.textColor
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="White text"
                  >
                    <SunMoon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTextColor(COLOR_SCHEMES.light.textColor)}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      editTextColor === COLOR_SCHEMES.light.textColor
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title="Dark text"
                  >
                    <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] font-bold">A</span>
                  </button>
                  {/* Custom text color picker */}
                  <label className="relative h-7 w-7 cursor-pointer rounded-md" title="Custom text color">
                    <input
                      type="color"
                      value={editTextColor}
                      onChange={(e) => setEditTextColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                      className={cn(
                        "h-7 w-7 rounded-md border-2 transition-all",
                        editTextColor !== COLOR_SCHEMES.dark.textColor && editTextColor !== COLOR_SCHEMES.light.textColor
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-muted-foreground/30"
                      )}
                      style={{ backgroundColor: editTextColor }}
                    />
                  </label>
                </div>

                {/* 2. Font family */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Font</Label>
                  <Select value={editFontFamily} onValueChange={setEditFontFamily}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__sep_sans" disabled>Sans Serif</SelectItem>
                      {FONT_OPTIONS.filter((f) => f.category === "sans-serif").map((font) => (
                        <SelectItem key={font.label} value={font.label}>{font.label}</SelectItem>
                      ))}
                      <SelectItem value="__sep_serif" disabled>Serif</SelectItem>
                      {FONT_OPTIONS.filter((f) => f.category === "serif" || f.category === "display").map((font) => (
                        <SelectItem key={font.label} value={font.label}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Headline size */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Headline Size</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{editFontSizePrimary}px</span>
                  </div>
                  <Slider
                    min={24} max={96} step={2}
                    value={[editFontSizePrimary]}
                    onValueChange={([v]) => setEditFontSizePrimary(v)}
                  />
                </div>

                {/* 4. Background padding */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Background Padding</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Horizontal</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{editBgPadX}px</span>
                      </div>
                      <Slider min={0} max={40} step={1} value={[editBgPadX]} onValueChange={([v]) => setEditBgPadX(v)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Vertical</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{editBgPadY}px</span>
                      </div>
                      <Slider min={0} max={30} step={1} value={[editBgPadY]} onValueChange={([v]) => setEditBgPadY(v)} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Content tab: text input controls */}
              <TabsContent value="content" className="space-y-4 mt-0">
                {/* Show/hide text toggle for this slide */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Show text on this slide</Label>
                  <Switch
                    checked={editTextEnabled}
                    onCheckedChange={toggleEditText}
                    aria-label="Toggle text visibility for this slide"
                  />
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Headline</Label>
                  <Textarea
                    value={editPrimary}
                    onChange={(e) => setEditPrimary(e.target.value)}
                    placeholder={editTextEnabled ? "Main headline text" : "Text hidden for this slide"}
                    className={cn("text-sm resize-none", !editTextEnabled && "opacity-40")}
                    rows={3}
                    disabled={!editTextEnabled}
                  />
                </div>

              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Crop Dialog */}
      {cropSlide && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open) setCropSlide(null);
          }}
          slide={cropSlide}
          aspectRatio={cropAspectRatio}
          onApply={(cropArea) => {
            const updatedSlides = project.slides.map((s) =>
              s.id === cropSlide.id ? { ...s, cropArea } : s
            );
            onEdit({ ...project, slides: updatedSlides });
          }}
          onReset={() => {
            const updatedSlides = project.slides.map((s) =>
              s.id === cropSlide.id ? { ...s, cropArea: undefined } : s
            );
            onEdit({ ...project, slides: updatedSlides });
          }}
        />
      )}
    </div>
  );
}
