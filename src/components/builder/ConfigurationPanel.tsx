"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowRight, FileSpreadsheet, Loader2, Mic, MicOff, RotateCcw, Save, SlidersHorizontal, Sparkles, Trash2, Wand2, X } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { validateCarouselReadiness } from "@/lib/carousel-validator";
import { generateCaption } from "@/app/actions";
import { PREDEFINED_FILTERS, CAMERA_FILTER_MAP, DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import Image from "next/image";
import { loadFilterTemplates, saveFilterTemplates } from "@/lib/storage";
import { computeConfigHash } from "@/lib/utils";
import type { CarouselProject, FilterTemplate, PredefinedFilterName, FilterConfig } from "@/lib/types";

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
  const [keywordsInput, setKeywordsInput] = useState(
    project.keywords.join(", ")
  );
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [filterTuneOpen, setFilterTuneOpen] = useState(false);

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

  function handleKeywordsChange(raw: string) {
    setKeywordsInput(raw);
    const keywords = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    updateField("keywords", keywords);
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
      toast.error("Speech recognition error", { description: event.error });
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
      // Save transcription and copy it into the theme/story field
      onUpdate({
        ...project,
        storyTranscription: transcription,
        theme: transcription.slice(0, 100), // ThemeInput max length is 100
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
      const result = await generateCaption(
        project.theme,
        project.keywords,
        project.storyTranscription
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
    if (!validation.canProceed || isGenerating) return;
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

  if (isGenerating) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 py-12">
        <LoadingSpinner size="lg" text="Generating your carousel..." />
        <div className="max-w-xs text-center">
          <p className="text-sm text-muted-foreground">
            AI is crafting your slides with the{" "}
            <span className="font-medium text-foreground">
              {project.theme || "selected"}
            </span>{" "}
            theme. This may take a minute.
          </p>
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

      {/* 1. Theme & Story */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Theme & Story</CardTitle>
            <CardHelpIcon title="Theme & Story">
              Set the creative theme and keywords that guide AI text generation
              for your carousel slides. Use the Record Story button to dictate
              via voice. Keywords help the AI understand your content&apos;s
              context and tone.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Theme</Label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3 w-3" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3" />
                    Record Story
                  </>
                )}
              </Button>
            </div>
            <ThemeInput
              value={project.theme}
              onChange={(value) => updateField("theme", value)}
            />
          </div>

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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags-input">Tags</Label>
            <Input
              id="tags-input"
              value={keywordsInput}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="sunset, golden hour, travel, wanderlust"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags. These will be appended as hashtags to your caption.
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* 2. AI Caption */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Social Caption</CardTitle>
              <CardHelpIcon title="AI Caption">
                Generate a social media caption using AI based on your
                carousel&apos;s theme and content. Choose a writing style that
                matches your brand voice.
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Your social media caption will appear here. Click 'Generate with AI' or type your own..."
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {captionText.length} / 2200 characters
          </p>
        </CardContent>
      </Card>
      </motion.div>

      {/* 3. Slide Count + CSV Import */}
      <motion.div variants={staggerItemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Slide Count</CardTitle>
              <CardHelpIcon title="Carousel Length">
                Choose how many slides your carousel will have (3&ndash;10).
                More slides allow for deeper storytelling. The recommended
                count depends on your uploaded images.
              </CardHelpIcon>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setCsvImportOpen(true)}
                title="Import a CSV with columns: headline (or title/primary) and caption (or subtitle/secondary). Tags are set separately."
              >
                <FileSpreadsheet className="h-3 w-3" />
                Import CSV
              </Button>
              {project.csvOverrides && (
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {project.csvOverrides.length} rows
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SlideCountSelector
            value={project.slideCount}
            onChange={(count) => updateField("slideCount", count)}
          />
        </CardContent>
      </Card>
      </motion.div>

      {/* 4. Image Source Strategy */}
      <motion.div variants={staggerItemVariants} className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Image Source Strategy</h3>
          <CardHelpIcon title="Image Source Strategy">
            Control how your uploaded images are distributed across slides.
            Sequential mode fills slides in order. Smart Auto optimizes
            placement based on AI analysis.
          </CardHelpIcon>
        </div>
        <ImageSourceIndicator project={project} />
      </motion.div>

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

      {/* Validation messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
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
          {validation.warnings.map((warn, i) => (
            <div
              key={`warn-${i}`}
              className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {warn}
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
                disabled={!validation.canProceed || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Carousel...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    {hasExistingSlides && hasConfigChanged
                      ? "Re-Generate Carousel"
                      : "Generate Carousel"}
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
    </motion.div>
  );
}
