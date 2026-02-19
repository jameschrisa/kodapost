"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, FileSpreadsheet, Image as ImageIcon, ImagePlus, Layers, Loader2, Mic, MicOff, RotateCcw, Save, SlidersHorizontal, Sparkles, Trash2, Type, Wand2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants, buttonTapScale } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeInput } from "@/components/shared/ThemeInput";
import { SlideCountSelector } from "@/components/shared/SlideCountSelector";
import { CameraSelector } from "@/components/shared/CameraSelector";
import { SaveProjectButton } from "@/components/shared/SaveProjectButton";
import { FilterSelector } from "@/components/shared/FilterSelector";
import { ImageSourceIndicator } from "@/components/builder/ImageSourceIndicator";
import { CSVImportDialog } from "@/components/builder/CSVImportDialog";
import { CardHelpIcon } from "@/components/shared/CardHelpIcon";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { validateCarouselReadiness } from "@/lib/carousel-validator";
import { generateCaption } from "@/app/actions";
import { DEFAULT_GLOBAL_OVERLAY_STYLE } from "@/lib/constants";
import { PREDEFINED_FILTERS, CAMERA_FILTER_MAP, DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import Image from "next/image";
import { loadFilterTemplates, saveFilterTemplates } from "@/lib/storage";
import { cn, computeConfigHash } from "@/lib/utils";
import type { CarouselProject, FilterTemplate, PredefinedFilterName, FilterConfig, PostMode } from "@/lib/types";

interface ConfigurationPanelProps {
  project: CarouselProject;
  onUpdate: (project: CarouselProject) => void;
  onGenerate: () => void | Promise<void>;
  onContinue?: () => void;
  onBack?: () => void;
}

export function ConfigurationPanel({
  project,
  onUpdate,
  onGenerate,
  onContinue,
  onBack,
}: ConfigurationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [filterTuneOpen, setFilterTuneOpen] = useState(false);
  const [carouselWarningOpen, setCarouselWarningOpen] = useState(false);

  // Headline visibility — derived from globalOverlayStyle or default
  const showHeadline = project.globalOverlayStyle?.showHeadline ?? DEFAULT_GLOBAL_OVERLAY_STYLE.showHeadline;

  function updateShowHeadline(value: boolean) {
    const gos = project.globalOverlayStyle ?? { ...DEFAULT_GLOBAL_OVERLAY_STYLE };
    onUpdate({ ...project, globalOverlayStyle: { ...gos, showHeadline: value } });
  }

  // Subtitle visibility — derived from globalOverlayStyle or default (OFF)
  const showSubtitle = project.globalOverlayStyle?.showSubtitle ?? DEFAULT_GLOBAL_OVERLAY_STYLE.showSubtitle;

  function updateShowSubtitle(value: boolean) {
    const gos = project.globalOverlayStyle ?? { ...DEFAULT_GLOBAL_OVERLAY_STYLE };
    onUpdate({ ...project, globalOverlayStyle: { ...gos, showSubtitle: value } });
  }

  // Filter template state
  const [savedTemplates, setSavedTemplates] = useState<FilterTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);

  // Load saved templates on mount
  useEffect(() => {
    setSavedTemplates(loadFilterTemplates());
  }, []);

  // Current filter config (derived from project or defaults)
  const filterConfig: FilterConfig = project.filterConfig ?? DEFAULT_FILTER_CONFIG;

  // Memoized CSS filter styles for the live preview
  const filterStyles = useMemo(() => getCameraFilterStyles(filterConfig), [filterConfig]);
  const grainSVG = useMemo(() => getGrainSVGDataUri(), []);

  function updateFilterConfig(updates: Partial<FilterConfig>) {
    onUpdate({ ...project, filterConfig: { ...filterConfig, ...updates } });
  }

  function handleFilterSelect(filterName: PredefinedFilterName) {
    const preset = PREDEFINED_FILTERS[filterName];
    updateFilterConfig({
      predefinedFilter: filterName,
      customParams: { ...preset.defaultCustomParams },
    });
  }

  function handleCustomParamChange(param: string, value: number) {
    updateFilterConfig({
      customParams: { ...filterConfig.customParams, [param]: value },
    });
  }

  function resetFilterToCamera() {
    if (project.cameraProfileId === 0) {
      // "No Emulation" — reset to defaults (no filter, all params zero)
      updateFilterConfig({ ...DEFAULT_FILTER_CONFIG });
      return;
    }
    const mapping = CAMERA_FILTER_MAP[project.cameraProfileId];
    if (mapping) {
      updateFilterConfig({
        predefinedFilter: mapping.filter,
        customParams: { ...mapping.customParams },
      });
    } else {
      updateFilterConfig({ ...DEFAULT_FILTER_CONFIG });
    }
  }

  // ── Filter Template CRUD ──
  function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) {
      toast.error("Enter a template name");
      return;
    }
    const newTemplate: FilterTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      filterConfig: { ...filterConfig, customParams: { ...filterConfig.customParams } },
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    saveFilterTemplates(updated);
    setTemplateName("");
    setShowSaveTemplate(false);
    toast.success(`Template "${name}" saved`);
  }

  function handleApplyTemplate(tpl: FilterTemplate) {
    updateFilterConfig({
      predefinedFilter: tpl.filterConfig.predefinedFilter,
      customParams: { ...tpl.filterConfig.customParams },
    });
    toast.success(`Applied "${tpl.name}"`);
  }

  function handleDeleteTemplate(id: string) {
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    saveFilterTemplates(updated);
    toast.success("Template deleted");
  }

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState(project.storyTranscription ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Caption generation state
  const [captionText, setCaptionText] = useState(project.caption ?? "");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Sync caption text to project on changes
  useEffect(() => {
    if (captionText !== (project.caption ?? "")) {
      const timer = setTimeout(() => {
        onUpdate({ ...project, caption: captionText || undefined });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [captionText]); // eslint-disable-line react-hooks/exhaustive-deps

  const validation = useMemo(
    () => validateCarouselReadiness(project),
    [project]
  );

  function updateField<K extends keyof CarouselProject>(
    key: K,
    value: CarouselProject[K]
  ) {
    onUpdate({ ...project, [key]: value });
  }



  // ── Audio Recording ──
  function startRecording() {
    // Web Speech API — not all browsers support this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRecognitionAPI = w?.SpeechRecognition || w?.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition not supported", {
        description: "Try using Chrome or Edge browser.",
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTranscription(transcript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // Only show toast for meaningful errors — not for user-cancel or silence
      const silent = ["no-speech", "aborted"];
      if (!silent.includes(event.error)) {
        toast.error("Microphone error", {
          description:
            event.error === "not-allowed"
              ? "Microphone access was denied. Check your browser permissions."
              : event.error,
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (transcription) {
      // Save transcription and copy it into the story field
      onUpdate({
        ...project,
        storyTranscription: transcription,
        theme: transcription.slice(0, 300), // ThemeInput max length is 300
      });
    }
  }

  // ── AI Caption Generation ──
  async function handleGenerateCaption() {
    if (!project.theme) {
      toast.error("Enter a theme first");
      return;
    }
    setIsGeneratingCaption(true);
    try {
      const audioCtx = project.audioClip?.source === "library" && project.audioClip.attribution
        ? {
            source: project.audioClip.source as "recording" | "upload" | "library",
            trackTitle: project.audioClip.attribution.trackTitle,
            artistName: project.audioClip.attribution.artistName,
          }
        : project.audioClip?.source
          ? { source: project.audioClip.source as "recording" | "upload" | "library" }
          : undefined;

      const result = await generateCaption(
        project.theme,
        project.keywords,
        project.storyTranscription,
        audioCtx,
        project.captionStyle,
        project.customCaptionStyle
      );
      if (result.success) {
        setCaptionText(result.data);
        onUpdate({ ...project, caption: result.data });
        toast.success("Caption generated!");
      } else {
        toast.error("Caption generation failed", { description: result.error });
      }
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  // ── CSV Import ──
  function handleCSVImport(data: { primary: string; secondary?: string }[]) {
    onUpdate({ ...project, csvOverrides: data });
    toast.success(`Imported text for ${data.length} slides`, {
      description: "Headlines will be applied during generation.",
    });
  }

  async function handleGenerate() {
    if (isGenerating) return;
    // Mark that user attempted — this makes validation errors visible
    setHasAttemptedGenerate(true);
    if (!validation.canProceed) return;
    setIsGenerating(true);
    try {
      await onGenerate();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Generation failed", { description: message });
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Generation progress animation
  const [generationProgress, setGenerationProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setGenerationProgress(0);
      const totalSlides = (project.postMode ?? "carousel") === "single" ? 1 : project.slideCount;
      const stepDuration = Math.max(2000, 8000 / totalSlides); // ~8s total spread across slides
      let current = 0;
      progressInterval.current = setInterval(() => {
        current += 1;
        if (current < totalSlides) {
          setGenerationProgress(current);
        } else {
          if (progressInterval.current) clearInterval(progressInterval.current);
        }
      }, stepDuration);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isGenerating) {
    const isSingle = (project.postMode ?? "carousel") === "single";
    const totalSlides = isSingle ? 1 : project.slideCount;
    const progressPct = Math.min(95, ((generationProgress + 1) / totalSlides) * 90);
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 py-12">
        <LoadingSpinner size="lg" text={isSingle ? "Generating your post..." : "Generating your carousel..."} />
        <div className="max-w-xs text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            AI is crafting your {isSingle ? "post" : "slides"} with the{" "}
            <span className="font-medium text-foreground">
              {project.theme || "selected"}
            </span>{" "}
            theme.
          </p>
          {!isSingle && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                Crafting slide {Math.min(generationProgress + 1, totalSlides)} of {totalSlides}...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back button */}
      {onBack && (
        <motion.div variants={staggerItemVariants}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back to Upload
          </Button>
        </motion.div>
      )}

      {/* 0. Post Mode */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Post Type</CardTitle>
            <CardHelpIcon title="Post Type">
              Choose between a single image post or a multi-slide carousel.
              Single posts use one image with optional text overlay and caption.
              Carousels let you tell a story across multiple slides.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {([
              { mode: "single" as PostMode, label: "Single Post", description: "One image, one story", icon: ImageIcon },
              { mode: "carousel" as PostMode, label: "Carousel", description: "Multi-slide storytelling", icon: Layers },
            ]).map(({ mode, label, description, icon: Icon }) => {
              const isSelected = (project.postMode ?? "carousel") === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    // Show warning when switching to carousel with ≤1 image
                    if (mode === "carousel" && project.uploadedImages.length <= 1) {
                      setCarouselWarningOpen(true);
                      return;
                    }
                    updateField("postMode", mode);
                    if (mode === "single") {
                      updateField("slideCount", 1);
                    } else if (project.slideCount < 2) {
                      updateField("slideCount", 5);
                    }
                    // Auto-enable headline for carousel mode
                    if (mode === "carousel") {
                      updateShowHeadline(true);
                    }
                  }}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/10 shadow-sm"
                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? "text-purple-400" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* 1. Your Story */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Your Story</CardTitle>
              <CardHelpIcon title="Your Story">
                Describe the moment, scene, or feeling you want to share. This drives
                AI-generated headlines and captions for your {(project.postMode ?? "carousel") === "single" ? "post" : "carousel"}.
                You can type or tap the mic to speak.
              </CardHelpIcon>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={handleGenerateCaption}
              disabled={isGeneratingCaption || !project.theme}
            >
              {isGeneratingCaption ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {captionText.trim() ? "Refining..." : "Creating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  {captionText.trim() ? "Refine caption" : "Create a caption"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Story textarea with inline mic button */}
          <ThemeInput
            value={project.theme}
            onChange={(value) => updateField("theme", value)}
            trailingAction={
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                }`}
                title={isRecording ? "Stop recording" : "Speak your story"}
                aria-label={isRecording ? "Stop recording" : "Speak your story"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            }
          />

          {/* Audio transcription preview */}
          {(transcription || isRecording) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {isRecording ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      Listening...
                    </span>
                  ) : (
                    "Transcription"
                  )}
                </Label>
                {transcription && !isRecording && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setTranscription("");
                      onUpdate({ ...project, storyTranscription: undefined });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2 min-h-[2rem]">
                {transcription || "Speak into your microphone..."}
              </p>
            </div>
          )}

          {/* Vibe selector — replaces tags */}
          <div className="space-y-2">
            <Label className="text-xs">Vibe</Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "relatable", label: "Relatable", emoji: "💬" },
                { value: "inspirational", label: "Inspirational", emoji: "✨" },
                { value: "promotional", label: "Promotional", emoji: "📢" },
                { value: "controversial", label: "Controversial", emoji: "🔥" },
                { value: "observational", label: "Observational", emoji: "👀" },
              ] as const).map(({ value, label, emoji }) => {
                const isActive = project.keywords.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const next = isActive
                        ? project.keywords.filter((k) => k !== value)
                        : [...project.keywords, value];
                      updateField("keywords", next);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/40"
                        : "bg-muted text-muted-foreground border border-transparent hover:bg-muted-foreground/10"
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose the tone of your story. This shapes how AI crafts your caption and headlines.
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* 2. Text Overlay Toggles */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Text Overlays</CardTitle>
              <CardHelpIcon title="Text Overlays">
                Control which text elements appear on your {(project.postMode ?? "carousel") === "single" ? "post" : "slides"}.
                Headlines are the main text; subtitles are smaller supporting text below.
                You can also toggle these per-slide in the Editorial step.
              </CardHelpIcon>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setCsvImportOpen(true)}
                title="Import your own headlines and subtitles from a CSV file instead of using AI-generated text."
              >
                <FileSpreadsheet className="h-3 w-3" />
                Import
              </Button>
              <CardHelpIcon title="CSV Import">
                Import a CSV file with your own headlines and subtitles instead of
                AI-generated text. Your file should have columns for headline (or
                title/primary) and optionally subtitle (or caption/secondary).
                Each row maps to a slide.
              </CardHelpIcon>
              {project.csvOverrides && (
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {project.csvOverrides.length} rows
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Headline toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Headlines</p>
              <p className="text-xs text-muted-foreground">
                {showHeadline
                  ? "Image headlines generated from your story"
                  : "No headline text — images only"}
              </p>
            </div>
            <Switch
              checked={showHeadline}
              onCheckedChange={updateShowHeadline}
              aria-label="Toggle headline visibility"
            />
          </div>

          {/* Subtitle toggle — only shown when headlines are on */}
          {showHeadline && (
            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-sm font-medium">Subtitles</p>
                <p className="text-xs text-muted-foreground">
                  {showSubtitle
                    ? "Supporting text below each headline"
                    : "Off — enable per-slide in Editorial"}
                </p>
              </div>
              <Switch
                checked={showSubtitle}
                onCheckedChange={updateShowSubtitle}
                aria-label="Toggle subtitle visibility"
              />
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* 3. Social Caption (Required) — auto-generates from story, editable */}
      <motion.div variants={staggerItemVariants}>
      <Card className={hasAttemptedGenerate && !captionText.trim() ? "border-destructive/50" : ""}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Social Caption</CardTitle>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
              Required
            </span>
            <CardHelpIcon title="Social Caption">
              Your caption is crafted from your story and vibes above. Write your own or
              use the &ldquo;Create a caption&rdquo; button in the Story card — then refine it as many times as you like.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your own caption, or use 'Create a caption' in the Story card above..."
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className={cn(
              "text-xs tabular-nums",
              captionText.length > 2200
                ? "text-destructive font-medium"
                : captionText.length > 1800
                  ? "text-amber-400"
                  : "text-muted-foreground"
            )}>
              {captionText.length.toLocaleString()} / 2,200
              {captionText.length > 2200 && " (over limit)"}
            </p>
            {!captionText.trim() && project.theme.trim() && (
              <p className="text-xs text-purple-400">
                ✨ Story ready — tap <span className="font-medium">Create a caption</span> above
              </p>
            )}
          </div>

          {/* Writing style selector */}
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Writing Style</Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "storyteller" as const, label: "Storyteller", emoji: "📖" },
                { value: "minimalist" as const, label: "Minimalist", emoji: "✏️" },
                { value: "data_driven" as const, label: "Data-Driven", emoji: "📊" },
                { value: "witty" as const, label: "Witty", emoji: "😄" },
                { value: "educational" as const, label: "Educational", emoji: "🎓" },
                { value: "poetic" as const, label: "Poetic", emoji: "🪶" },
              ]).map(({ value, label, emoji }) => {
                const isActive = (project.captionStyle ?? "storyteller") === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      updateField("captionStyle", value);
                      updateField("customCaptionStyle", undefined);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/40"
                        : "bg-muted text-muted-foreground border border-transparent hover:bg-muted-foreground/10"
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                );
              })}
              {/* Custom style option */}
              <button
                type="button"
                onClick={() => updateField("captionStyle", "custom")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  project.captionStyle === "custom"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/40"
                    : "bg-muted text-muted-foreground border border-transparent hover:bg-muted-foreground/10"
                }`}
              >
                <span>✍️</span>
                Custom
              </button>
            </div>
            {project.captionStyle === "custom" && (
              <Input
                placeholder="Describe your writing style (e.g., 'casual Gen-Z slang with emoji')"
                value={project.customCaptionStyle ?? ""}
                onChange={(e) => updateField("customCaptionStyle", e.target.value)}
                className="h-8 text-sm mt-2"
                maxLength={120}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Shapes how AI generates captions and headline text.
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* 4. Slides & Images — unified card (carousel mode only) */}
      {(project.postMode ?? "carousel") === "carousel" && (
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Slides &amp; Images</CardTitle>
            <CardHelpIcon title="Slides & Images">
              Set how many slides your carousel will have and see how your
              uploaded images are distributed across them. The slide count
              defaults to your uploaded image count — increase it to add
              text-only slides.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SlideCountSelector
            value={project.slideCount}
            onChange={(count) => updateField("slideCount", count)}
          />
          <ImageSourceIndicator project={project} />
        </CardContent>
      </Card>
      </motion.div>
      )}

      {/* 5. Camera Style */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Vintage Digital Camera Emulations</CardTitle>
            <CardHelpIcon title="Camera Emulation">
              Select a vintage camera style to apply to your images. Each
              camera has a unique visual aesthetic &mdash; from Polaroid warmth
              to disposable camera grain.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent>
          <CameraSelector
            value={project.cameraProfileId}
            onChange={(id) => {
              if (id === 0) {
                // "No Emulation" — reset to defaults (no filter, all params zero)
                onUpdate({
                  ...project,
                  cameraProfileId: 0,
                  filterConfig: { ...DEFAULT_FILTER_CONFIG },
                });
              } else {
                const mapping = CAMERA_FILTER_MAP[id];
                if (mapping) {
                  onUpdate({
                    ...project,
                    cameraProfileId: id,
                    filterConfig: {
                      predefinedFilter: mapping.filter,
                      customParams: { ...mapping.customParams },
                    },
                  });
                } else {
                  updateField("cameraProfileId", id);
                }
              }
            }}
          />
        </CardContent>
      </Card>
      </motion.div>

      {/* 6. Photo Filters */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Retro Photo Filters</CardTitle>
              <CardHelpIcon title="Image Filters">
                Apply Instagram-style filters and fine-tune film
                characteristics like grain, bloom, shadow fade, color
                temperature, and vignetting.
              </CardHelpIcon>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={resetFilterToCamera}
              title="Reset filters to this camera's defaults"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predefined filter cards */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Predefined Filters</Label>
            <FilterSelector
              value={filterConfig.predefinedFilter}
              onChange={handleFilterSelect}
            />
          </div>

          {/* Fine-tune toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setFilterTuneOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filterTuneOpen ? "Hide Fine-Tune" : "Fine-Tune Adjustments"}
          </Button>

          {/* Custom parameter sliders with live preview */}
          {filterTuneOpen && (
            <div className="space-y-5 pt-2">
              {/* Live filter preview on sample image */}
              <div className="mx-auto max-w-sm overflow-hidden rounded-lg border">
                <div className="relative aspect-[3/2] w-full bg-black">
                  <Image
                    src="/image_other/sample_image.jpg"
                    alt="Filter preview"
                    fill
                    sizes="384px"
                    className="object-cover"
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
              </div>

              {/* Grain Intensity */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Grain Intensity</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{filterConfig.customParams.grain_amount}</span>
                </div>
                <div className="py-1">
                  <Slider
                    value={[filterConfig.customParams.grain_amount]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => handleCustomParamChange("grain_amount", v)}
                  />
                </div>
              </div>

              {/* Highlight Bloom */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Highlight Bloom</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{filterConfig.customParams.bloom_diffusion}</span>
                </div>
                <div className="py-1">
                  <Slider
                    value={[filterConfig.customParams.bloom_diffusion]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => handleCustomParamChange("bloom_diffusion", v)}
                  />
                </div>
              </div>

              {/* Black Point Fade */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Black Point Fade</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{filterConfig.customParams.shadow_fade}</span>
                </div>
                <div className="py-1">
                  <Slider
                    value={[filterConfig.customParams.shadow_fade]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => handleCustomParamChange("shadow_fade", v)}
                  />
                </div>
              </div>

              {/* Color Shift */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Color Shift</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {filterConfig.customParams.color_bias > 0 ? "+" : ""}{filterConfig.customParams.color_bias}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-muted-foreground">Cool</span>
                  <Slider
                    value={[filterConfig.customParams.color_bias]}
                    min={-100}
                    max={100}
                    step={1}
                    onValueChange={([v]) => handleCustomParamChange("color_bias", v)}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground">Warm</span>
                </div>
              </div>

              {/* Vignette Depth */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Vignette Depth</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{filterConfig.customParams.vignette_depth}</span>
                </div>
                <div className="py-1">
                  <Slider
                    value={[filterConfig.customParams.vignette_depth]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => handleCustomParamChange("vignette_depth", v)}
                  />
                </div>
              </div>

              {/* ── Filter Templates ── */}
              <div className="border-t pt-4 mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      setShowSaveTemplate((v) => !v);
                      setShowTemplateList(false);
                    }}
                  >
                    <Save className="h-3 w-3" />
                    Save as Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      setShowTemplateList((v) => !v);
                      setShowSaveTemplate(false);
                    }}
                  >
                    Load Template
                    {savedTemplates.length > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                        {savedTemplates.length}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Inline save form */}
                {showSaveTemplate && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name..."
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTemplate();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSaveTemplate}
                      disabled={!templateName.trim()}
                    >
                      Save
                    </Button>
                  </div>
                )}

                {/* Template list */}
                {showTemplateList && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Templates are saved locally until you create an account.
                    </p>
                    {savedTemplates.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70 py-2 text-center">
                        No saved templates yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {savedTemplates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tpl.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {tpl.filterConfig.predefinedFilter === "none"
                                  ? "Custom"
                                  : tpl.filterConfig.predefinedFilter}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleApplyTemplate(tpl)}
                              >
                                Apply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTemplate(tpl.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Validation errors — only shown after the user attempts to generate */}
      {hasAttemptedGenerate && validation.errors.length > 0 && (
        <div className="space-y-2">
          {validation.errors.map((err, i) => (
            <div
              key={`err-${i}`}
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* 6. Generate / Continue Button */}
      {(() => {
        const hasExistingSlides = project.slides.length > 0 &&
          project.slides.some(s => s.status === "ready");
        const hasConfigChanged = !project.lastGeneratedConfigHash ||
          computeConfigHash(project) !== project.lastGeneratedConfigHash;

        // If slides exist and config hasn't changed, show Continue
        if (hasExistingSlides && !hasConfigChanged && onContinue) {
          return (
            <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
              <SaveProjectButton project={project} />
              <motion.div whileTap={buttonTapScale} className="flex-1">
                <Button
                  size="lg"
                  className="w-full gap-2 text-base"
                  onClick={onContinue}
                >
                  <ArrowRight className="h-5 w-5" />
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          );
        }

        return (
          <motion.div variants={staggerItemVariants} className="flex items-center gap-3">
            <SaveProjectButton project={project} />
            <motion.div whileTap={buttonTapScale} className="flex-1">
              <Button
                size="lg"
                className="w-full gap-2 text-base"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {(project.postMode ?? "carousel") === "single" ? "Generating Post..." : "Generating Carousel..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    {(project.postMode ?? "carousel") === "single"
                      ? (hasExistingSlides && hasConfigChanged ? "Re-Generate Post" : "Generate Post")
                      : (hasExistingSlides && hasConfigChanged ? "Re-Generate Carousel" : "Generate Carousel")}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        );
      })()}

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        slideCount={project.slideCount}
        onImport={handleCSVImport}
      />

      {/* Carousel Recommendation Dialog — shown when switching to carousel with ≤1 image */}
      <Dialog open={carouselWarningOpen} onOpenChange={setCarouselWarningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-amber-500" />
              More Images Recommended
            </DialogTitle>
            <DialogDescription>
              You currently have {project.uploadedImages.length === 0 ? "no images" : "only 1 image"} uploaded.
              For the best carousel storytelling experience, we recommend uploading at least <strong className="text-foreground">3 or more images</strong>.
              More images allow each slide to have its own unique visual, creating a richer narrative.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            <p className="font-medium">Tip:</p>
            <p className="mt-1">
              Slides without an assigned image will require a headline text overlay.
              Empty slides (no image and no headline) are not allowed.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCarouselWarningOpen(false);
                if (onBack) onBack();
              }}
            >
              Go Back & Upload More
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setCarouselWarningOpen(false);
                updateField("postMode", "carousel");
                if (project.slideCount < 2) {
                  updateField("slideCount", 5);
                }
                // Force headline on since carousel with few images needs text
                updateShowHeadline(true);
                toast.info("Switched to Carousel mode", {
                  description: "Headlines are enabled. Slides without images will need headline text.",
                });
              }}
            >
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
