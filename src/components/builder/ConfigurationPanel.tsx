"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Camera, Loader2, Mic, MicOff, Palette, RotateCcw, Save, SlidersHorizontal, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { staggerContainerVariants, staggerItemVariants, buttonTapScale } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeInput } from "@/components/shared/ThemeInput";
import { CameraSelector } from "@/components/shared/CameraSelector";
import { SaveProjectButton } from "@/components/shared/SaveProjectButton";
import { FilterSelector } from "@/components/shared/FilterSelector";
import { CSVImportDialog } from "@/components/builder/CSVImportDialog";
import { CardHelpIcon } from "@/components/shared/CardHelpIcon";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { validateCarouselReadiness } from "@/lib/carousel-validator";
import { generateCaption } from "@/app/actions";
import { PREDEFINED_FILTERS, CAMERA_FILTER_MAP, DEFAULT_FILTER_CONFIG } from "@/lib/filter-presets";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import Image from "next/image";
import { loadFilterTemplates, saveFilterTemplates } from "@/lib/storage";
import { cn, computeConfigHash } from "@/lib/utils";
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
  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

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
  // We request getUserMedia first to ensure the browser grants mic permission
  // before starting Web Speech API. SpeechRecognition has its own internal
  // mic access that can fail silently on localhost — warming up with getUserMedia
  // ensures the permission prompt fires and the mic stream is available.
  const micStreamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
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

    // Step 1: Request mic permission via getUserMedia first
    // This triggers the proper browser permission prompt and warms up the mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
    } catch (err) {
      const domErr = err instanceof DOMException ? err : null;
      if (domErr?.name === "NotAllowedError") {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings.",
        });
      } else if (domErr?.name === "NotFoundError") {
        toast.error("No microphone found", {
          description: "Please connect a microphone and try again.",
        });
      } else {
        toast.error("Microphone error", {
          description: "Failed to access microphone. Please try again.",
        });
      }
      return;
    }

    // Step 2: Start Web Speech API recognition (uses the now-granted mic permission)
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
      // Release the mic stream on error
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Release the mic stream when recognition ends
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    // Release the mic stream
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
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
    } catch (err) {
      console.error("[caption] generation failed:", err);
      toast.error("Caption generation failed", { description: "Please try again." });
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  // ── CSV Import ──
  function handleCSVImport(data: { primary: string }[]) {
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
            Koda is crafting your {isSingle ? "post" : "slides"} with the{" "}
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
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-muted-foreground"
            onClick={() => setIsGenerating(false)}
          >
            Cancel
          </Button>
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

      {/* 1. Your Story */}
      <motion.div variants={staggerItemVariants}>
      <Card data-tour="tour-story-card">
        <CardHeader>
          <div className="flex items-center gap-2">
              <CardTitle className="text-base">Your Story</CardTitle>
              <CardHelpIcon title="Your Story">
                Describe the moment, scene, or feeling you want to share. This drives
                Koda-generated headlines and captions for your {(project.postMode ?? "carousel") === "single" ? "post" : "carousel"}.
                You can type or tap the mic to speak.
              </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio transcription preview — shown above textarea when recording */}
          {isRecording && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Listening...
                  </span>
                </Label>
              </div>
              <p className="text-xs text-muted-foreground rounded-md border-2 border-purple-500 bg-muted px-3 py-2 min-h-[2rem]">
                {transcription || "Speak into your microphone..."}
              </p>
            </div>
          )}

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

          {/* Transcription result — shown below textarea when not recording */}
          {transcription && !isRecording && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Transcription
                </Label>
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
              </div>
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2 min-h-[2rem]">
                {transcription}
              </p>
            </div>
          )}

          {/* Vibe selector — replaces tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vibe <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "relatable", label: "Relatable", emoji: "💬" },
                { value: "inspirational", label: "Inspirational", emoji: "✨" },
                { value: "promotional", label: "Promotional", emoji: "📢" },
                { value: "controversial", label: "Controversial", emoji: "🔥" },
                { value: "observational", label: "Observational", emoji: "👀" },
                { value: "educational", label: "Educational", emoji: "📚" },
                { value: "storytelling", label: "Storytelling", emoji: "📖" },
                { value: "poetic", label: "Poetic", emoji: "🪶" },
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
              {/* Custom vibe toggle */}
              <button
                type="button"
                onClick={() => {
                  if (project.captionStyle === "custom") {
                    updateField("captionStyle", undefined);
                    updateField("customCaptionStyle", undefined);
                  } else {
                    updateField("captionStyle", "custom");
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  project.captionStyle === "custom"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/40"
                    : "bg-muted text-muted-foreground border border-transparent hover:bg-muted-foreground/10"
                }`}
              >
                <span>🎨</span>
                Custom
              </button>
            </div>
            {project.captionStyle === "custom" && (
              <Input
                placeholder="Describe your vibe, e.g. 'sarcastic Gen-Z energy' or 'calm and reflective'"
                value={project.customCaptionStyle ?? ""}
                onChange={(e) => updateField("customCaptionStyle", e.target.value)}
                className="text-sm"
              />
            )}
            {(() => {
              const selected = project.keywords;
              const conflicts: [string, string, string][] = [
                ["promotional", "educational", "Promotional + Educational can read like an infomercial"],
                ["promotional", "poetic", "Promotional + Poetic clash: hard sell vs. contemplative"],
                ["controversial", "inspirational", "Controversial + Inspirational pull in opposite directions"],
                ["controversial", "educational", "Controversial + Educational can come across as preachy"],
                ["poetic", "controversial", "Poetic + Controversial: reflective tone vs. blunt provocation"],
              ];
              const pairings: Record<string, string> = {
                "storytelling+inspirational": "Great combo: uplifting narrative arc",
                "educational+observational": "Nice pairing: insightful \"did you know?\" posts",
                "relatable+storytelling": "Strong match: personal anecdotes that connect",
                "observational+poetic": "Beautiful combo: contemplative, atmospheric feel",
                "relatable+controversial": "Bold pairing: personal takes that spark discussion",
              };
              const activeConflict = conflicts.find(
                ([a, b]) => selected.includes(a) && selected.includes(b)
              );
              const sortedPair = selected.length === 2
                ? [...selected].sort().join("+")
                : null;
              const activePairing = sortedPair ? pairings[sortedPair] : null;

              if (activeConflict) {
                return (
                  <p className="text-xs text-amber-400">
                    ⚠️ {activeConflict[2]}. Try picking just one.
                  </p>
                );
              }
              if (activePairing) {
                return (
                  <p className="text-xs text-emerald-400">
                    ✓ {activePairing}
                  </p>
                );
              }
              if (selected.length > 2) {
                return (
                  <p className="text-xs text-amber-400">
                    Pick 1–2 vibes for a focused tone. Too many can dilute the voice.
                  </p>
                );
              }
              return (
                <p className="text-xs text-muted-foreground">
                  Pick 1–2 vibes to shape how Koda crafts your caption and headlines.
                </p>
              );
            })()}
          </div>

          {/* Create a caption button — centered, purple */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="default"
              size="lg"
              className="gap-2 text-base bg-purple-500 hover:bg-purple-600 text-white"
              onClick={handleGenerateCaption}
              disabled={isGeneratingCaption || !project.theme}
            >
              {isGeneratingCaption ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {captionText.trim() ? "Refining..." : "Creating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {captionText.trim() ? "Refine Headlines & Captions" : "Create Headlines and Captions"}
                </>
              )}
            </Button>
            {isGeneratingCaption && (
              <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full w-[200%] rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500"
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground animate-pulse">
                  {captionText.trim() ? "Refining headlines & caption…" : "Generating headlines & caption…"}
                </p>
              </div>
            )}
          </div>
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
              use the &ldquo;Create a caption&rdquo; button in the Story card, then refine it as many times as you like.
            </CardHelpIcon>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your own caption, or use 'Create a caption' in the Story card above..."
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={6}
            className="resize-y text-sm"
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
                ✨ Story ready. Tap <span className="font-medium">Create a caption</span> above
              </p>
            )}
          </div>

        </CardContent>
      </Card>
      </motion.div>

      {/* 4. Stylize — tabbed: Camera / Filters / Fine-Tune */}
      <motion.div variants={staggerItemVariants}>
      <Card data-tour="tour-camera-filters">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Stylize Images</CardTitle>
              <CardHelpIcon title="Stylize Images">
                Shape the visual style of your images. Choose a vintage camera
                emulation, apply retro photo filters, and fine-tune parameters
                like grain, bloom, and vignette.
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
        <CardContent className="pt-0">
          <Tabs defaultValue="emulation" className="w-full">
            <TabsList className="inline-flex h-auto w-auto gap-0 rounded-full border border-muted-foreground/20 bg-transparent p-0.5 overflow-x-auto max-w-full">
              <TabsTrigger
                value="emulation"
                className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none"
              >
                <Camera className="h-3.5 w-3.5" />
                Emulation
              </TabsTrigger>
              <TabsTrigger
                value="filters"
                className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none"
              >
                <Palette className="h-3.5 w-3.5" />
                Filters
              </TabsTrigger>
              <TabsTrigger
                value="fine-tune"
                className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Fine-Tune
              </TabsTrigger>
            </TabsList>

            {/* ── Emulation Tab ── */}
            <TabsContent value="emulation" className="mt-4">
              <CameraSelector
                value={project.cameraProfileId}
                onChange={(id) => {
                  if (id === 0) {
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
              <p className="mt-2 text-xs text-muted-foreground">
                Select a vintage camera style to apply to your images.
              </p>
            </TabsContent>

            {/* ── Filters Tab ── */}
            <TabsContent value="filters" className="mt-4">
              <FilterSelector
                value={filterConfig.predefinedFilter}
                onChange={handleFilterSelect}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Apply Instagram-style retro photo filters on top of camera emulation.
              </p>
            </TabsContent>

            {/* ── Fine-Tune Tab ── */}
            <TabsContent value="fine-tune" className="mt-4 space-y-5">
              {/* Live filter preview on sample image */}
              <div className="mx-auto max-w-sm overflow-hidden rounded-lg border">
                <div className="relative aspect-[3/2] w-full bg-black">
                  <Image
                    src="/assets/landing/sample_image.jpg"
                    alt="Filter preview"
                    fill
                    sizes="384px"
                    className="object-cover"
                    style={{ filter: filterStyles.imageFilter }}
                  />
                  {filterStyles.overlayGradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: filterStyles.overlayGradient,
                        mixBlendMode: (filterStyles.overlayBlendMode || "normal") as React.CSSProperties["mixBlendMode"],
                      }}
                    />
                  )}
                  {filterStyles.vignetteGradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: filterStyles.vignetteGradient }}
                    />
                  )}
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
            </TabsContent>
          </Tabs>
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

    </motion.div>
  );
}
