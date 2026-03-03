"use client";

/**
 * StoryboardPreview — timeline view showing slides synced to audio.
 *
 * Displays a horizontal filmstrip of slide thumbnails with an audio waveform
 * below, a playhead that scrubs through both, and controls for transition
 * type and slide timing. Users can preview how their reel will play.
 *
 * Supports per-slide duration overrides: click a slide's duration badge to
 * set a custom duration. When audio is attached, remaining time redistributes
 * evenly across non-overridden slides.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Music,
  Layers,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_VIDEO_SETTINGS } from "@/lib/constants";
import { calculateVideoTiming } from "@/lib/video-utils";
import { SlideTextOverlay } from "@/components/builder/SlideTextOverlay";
import { Waveform } from "@/components/audio/Waveform";
import { getCameraFilterStyles, getGrainSVGDataUri } from "@/lib/camera-filters-css";
import type { CarouselProject, VideoSettings, SlideTransition } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StoryboardPreviewProps {
  project: CarouselProject;
  onVideoSettingsChange: (settings: VideoSettings) => void;
  /** Callback to clear the audio track from the storyboard */
  onClearAudio?: () => void;
  /** Callback to update a slide's durationOverride */
  onSlideDurationChange?: (slideId: string, duration: number | undefined) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSITION_OPTIONS: { value: SlideTransition; label: string }[] = [
  { value: "crossfade", label: "Crossfade" },
  { value: "slide", label: "Slide" },
  { value: "none", label: "None" },
];

// Responsive: use smaller thumbs on mobile, larger on desktop
const THUMB_HEIGHT_SM = 120;
const THUMB_HEIGHT_LG = 200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryboardPreview({
  project,
  onVideoSettingsChange,
  onClearAudio,
  onSlideDurationChange,
}: StoryboardPreviewProps) {
  const settings = project.videoSettings ?? DEFAULT_VIDEO_SETTINGS;
  const readySlides = useMemo(
    () => project.slides.filter((s) => s.status === "ready"),
    [project.slides]
  );

  // Responsive thumbnail height
  const [thumbHeight, setThumbHeight] = useState(THUMB_HEIGHT_LG);
  useEffect(() => {
    const update = () => setThumbHeight(window.innerWidth < 640 ? THUMB_HEIGHT_SM : THUMB_HEIGHT_LG);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Per-slide duration editing
  const [editingSlideIdx, setEditingSlideIdx] = useState<number | null>(null);
  const durationInputRef = useRef<HTMLInputElement | null>(null);

  // Camera filter styles
  const filterStyles = useMemo(
    () =>
      project.filterConfig
        ? getCameraFilterStyles(project.filterConfig)
        : null,
    [project.filterConfig]
  );
  const grainSVG = useMemo(() => getGrainSVGDataUri(), []);

  // Video timing — now with per-slide overrides
  const slideOverrides = useMemo(
    () => readySlides.map((s) => s.durationOverride),
    [readySlides]
  );

  const timing = useMemo(
    () => calculateVideoTiming(readySlides.length, project.audioClip, settings, slideOverrides),
    [readySlides.length, project.audioClip, settings, slideOverrides]
  );

  // Count of slides with custom overrides
  const overrideCount = useMemo(
    () => readySlides.filter((s) => s.durationOverride !== undefined).length,
    [readySlides]
  );

  // Current slide based on playhead — uses precomputed slideStartTimes
  const currentSlideIndex = useMemo(() => {
    if (readySlides.length === 0) return 0;
    let idx = 0;
    for (let i = 0; i < timing.slideStartTimes.length; i++) {
      if (timing.slideStartTimes[i] <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [currentTime, readySlides.length, timing.slideStartTimes]);

  // -----------------------------------------------------------------------
  // Playback controls
  // -----------------------------------------------------------------------

  const play = useCallback(() => {
    setIsPlaying(true);
    startTimeRef.current = performance.now() - currentTime * 1000;

    // Start audio
    if (audioRef.current && project.audioClip?.objectUrl) {
      const trimStart = project.audioClip.trimStart ?? 0;
      audioRef.current.currentTime = trimStart + currentTime;
      audioRef.current.play().catch(() => {});
    }

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      if (elapsed >= timing.totalDuration) {
        setCurrentTime(timing.totalDuration);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
        return;
      }
      setCurrentTime(elapsed);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [currentTime, timing.totalDuration, project.audioClip]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const restart = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = project.audioClip?.trimStart ?? 0;
    }
  }, [project.audioClip]);

  // Stop playback on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Auto-scroll filmstrip to keep current slide visible
  useEffect(() => {
    if (!filmstripRef.current || readySlides.length === 0) return;
    const container = filmstripRef.current;
    const thumbWidth = container.scrollWidth / readySlides.length;
    const targetScroll = currentSlideIndex * thumbWidth - container.clientWidth / 2 + thumbWidth / 2;
    container.scrollTo({ left: targetScroll, behavior: isPlaying ? "auto" : "smooth" });
  }, [currentSlideIndex, readySlides.length, isPlaying]);

  // Auto-focus duration input when editing
  useEffect(() => {
    if (editingSlideIdx !== null && durationInputRef.current) {
      durationInputRef.current.focus();
      durationInputRef.current.select();
    }
  }, [editingSlideIdx]);

  // -----------------------------------------------------------------------
  // Settings handlers
  // -----------------------------------------------------------------------

  const setTransition = useCallback(
    (transition: SlideTransition) => {
      onVideoSettingsChange({ ...settings, transition });
    },
    [settings, onVideoSettingsChange]
  );

  const toggleTimingMode = useCallback(() => {
    const newMode =
      settings.timingMode === "match-audio" ? "custom" : "match-audio";
    onVideoSettingsChange({ ...settings, timingMode: newMode });
  }, [settings, onVideoSettingsChange]);

  // -----------------------------------------------------------------------
  // Per-slide duration editing
  // -----------------------------------------------------------------------

  const handleDurationSubmit = useCallback(
    (slideId: string, value: string) => {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 60) {
        onSlideDurationChange?.(slideId, Math.round(parsed * 10) / 10);
      }
      setEditingSlideIdx(null);
    },
    [onSlideDurationChange]
  );

  const handleDurationReset = useCallback(
    (slideId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSlideDurationChange?.(slideId, undefined);
      setEditingSlideIdx(null);
    },
    [onSlideDurationChange]
  );

  const handleResetAllDurations = useCallback(() => {
    readySlides.forEach((slide) => {
      if (slide.durationOverride !== undefined) {
        onSlideDurationChange?.(slide.id, undefined);
      }
    });
    setEditingSlideIdx(null);
  }, [readySlides, onSlideDurationChange]);

  // -----------------------------------------------------------------------
  // Filmstrip click to seek
  // -----------------------------------------------------------------------

  const handleFilmstripClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const seekTime = ratio * timing.totalDuration;
      setCurrentTime(Math.max(0, Math.min(seekTime, timing.totalDuration)));

      if (audioRef.current && project.audioClip?.objectUrl) {
        const trimStart = project.audioClip.trimStart ?? 0;
        audioRef.current.currentTime = trimStart + seekTime;
      }
    },
    [timing.totalDuration, project.audioClip]
  );

  // -----------------------------------------------------------------------
  // Duration display
  // -----------------------------------------------------------------------

  const durationLabel = useMemo(() => {
    const totalSec = timing.totalDuration.toFixed(1);
    const slideSec = timing.defaultSlideDuration.toFixed(1);
    if (settings.timingMode === "match-audio" && project.audioClip) {
      return overrideCount > 0
        ? `Matched to audio: ${totalSec}s (${overrideCount} slide${overrideCount > 1 ? "s" : ""} custom, ${slideSec}s default)`
        : `Matched to audio: ${totalSec}s (${slideSec}s per slide)`;
    }
    return overrideCount > 0
      ? `${readySlides.length} slides = ${totalSec}s total (${overrideCount} custom, ${slideSec}s default)`
      : `${readySlides.length} slides \u00d7 ${slideSec}s = ${totalSec}s total`;
  }, [timing, settings.timingMode, project.audioClip, readySlides.length, overrideCount]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m}:${String(s).padStart(2, "0")}.${ms}`;
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (readySlides.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <p>No slides to preview.</p>
        </CardContent>
      </Card>
    );
  }

  const playheadPercent = timing.totalDuration > 0
    ? (currentTime / timing.totalDuration) * 100
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Storyboard
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(timing.totalDuration)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Toolbar: Playback + Transition + Timing */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={isPlaying ? pause : play}
              className="h-8 w-8 p-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={restart}
              className="h-8 w-8 p-0"
              title="Replay from start"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Transition type pills */}
          <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
            {TRANSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTransition(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  settings.transition === opt.value
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Timing mode */}
          {project.audioClip?.objectUrl && (
            <button
              type="button"
              onClick={toggleTimingMode}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                settings.timingMode === "match-audio"
                  ? "bg-purple-500/15 text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {settings.timingMode === "match-audio" ? (
                <Music className="h-3 w-3" />
              ) : (
                <Timer className="h-3 w-3" />
              )}
              {settings.timingMode === "match-audio"
                ? "Match Audio"
                : `${settings.slideDuration}s per slide`}
            </button>
          )}

          {/* Clear audio track from storyboard */}
          {project.audioClip?.objectUrl && onClearAudio && (
            <>
              <div className="h-5 w-px bg-border" />
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearAudio}
                className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                title="Remove audio track from storyboard"
              >
                <Trash2 className="h-3 w-3" />
                Clear Track
              </Button>
            </>
          )}

          {/* Reset all custom durations */}
          {overrideCount > 0 && (
            <>
              <div className="h-5 w-px bg-border" />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetAllDurations}
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Reset all custom slide durations to default"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Timings
              </Button>
            </>
          )}
        </div>

        {/* Filmstrip + Playhead + Waveform */}
        <div className="relative">
          {/* Slide filmstrip */}
          <div
            ref={filmstripRef}
            className="relative flex gap-1 overflow-x-auto pb-1 scrollbar-thin cursor-pointer"
            style={{ height: thumbHeight + 24 }}
            onClick={handleFilmstripClick}
          >
            {readySlides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              const slideDur = timing.slideDurations[idx] ?? timing.defaultSlideDuration;
              // Calculate width proportional to this slide's duration
              const widthPercent =
                timing.totalDuration > 0
                  ? ((slideDur - (idx < readySlides.length - 1 ? timing.transitionDuration : 0)) /
                      timing.totalDuration) *
                    100
                  : 100 / readySlides.length;

              return (
                <div
                  key={slide.id}
                  className={cn(
                    "relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                    isActive
                      ? "border-purple-500 ring-1 ring-purple-500/30"
                      : "border-transparent opacity-70"
                  )}
                  style={{
                    width: `${Math.max(widthPercent, 8)}%`,
                    height: thumbHeight,
                  }}
                >
                  {/* Slide thumbnail */}
                  {slide.imageUrl ? (
                    <div className="relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.thumbnailUrl || slide.imageUrl}
                        alt={`Slide ${slide.position + 1}`}
                        className="h-full w-full object-cover"
                        style={{
                          filter: filterStyles?.imageFilter || undefined,
                        }}
                      />
                      {filterStyles?.overlayGradient && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: filterStyles.overlayGradient,
                            mixBlendMode: (filterStyles.overlayBlendMode ||
                              "normal") as React.CSSProperties["mixBlendMode"],
                          }}
                        />
                      )}
                      {filterStyles?.vignetteGradient && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: filterStyles.vignetteGradient }}
                        />
                      )}
                      {filterStyles && filterStyles.grainOpacity > 0 && (
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
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          slide.textOverlay?.styling?.backgroundColor
                            ? `linear-gradient(135deg, ${slide.textOverlay.styling.backgroundColor}, ${slide.textOverlay.styling.backgroundColor})`
                            : "linear-gradient(135deg, #1e1e1e, #2d2d2d)",
                      }}
                    />
                  )}

                  {/* Text overlay at thumbnail scale */}
                  {slide.textOverlay && (
                    <div className="absolute inset-0 pointer-events-none">
                      <SlideTextOverlay
                        overlay={slide.textOverlay}
                        scale={0.12}
                      />
                    </div>
                  )}

                  {/* Slide number label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-0.5">
                    <span className="text-[9px] font-medium text-white/80">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Transition indicator between slides */}
                  {idx < readySlides.length - 1 &&
                    settings.transition !== "none" && (
                      <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 z-10">
                        <div className="h-4 w-1 rounded-full bg-purple-500/40" />
                      </div>
                    )}
                </div>
              );
            })}

            {/* Playhead line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-20 pointer-events-none transition-none"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-background" />
            </div>
          </div>

          {/* Timing strip — per-slide duration controls */}
          <div className="flex gap-1 mt-1">
            {readySlides.map((slide, idx) => {
              const slideDur = timing.slideDurations[idx] ?? timing.defaultSlideDuration;
              const hasOverride = slide.durationOverride !== undefined;
              const widthPercent =
                timing.totalDuration > 0
                  ? ((slideDur - (idx < readySlides.length - 1 ? timing.transitionDuration : 0)) /
                      timing.totalDuration) *
                    100
                  : 100 / readySlides.length;

              return (
                <div
                  key={slide.id}
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center rounded",
                    "h-7 transition-colors",
                    hasOverride
                      ? "bg-purple-500/15 border border-purple-500/30"
                      : "bg-muted/40 border border-transparent hover:bg-muted/60"
                  )}
                  style={{ width: `${Math.max(widthPercent, 8)}%` }}
                >
                  {editingSlideIdx === idx ? (
                    <div
                      className="flex items-center gap-1 px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={durationInputRef}
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="60"
                        defaultValue={slideDur.toFixed(1)}
                        className="w-12 rounded bg-background px-1.5 py-0.5 text-xs font-medium text-foreground text-center border border-purple-500/50 outline-none focus:ring-1 focus:ring-purple-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleDurationSubmit(slide.id, e.currentTarget.value);
                          } else if (e.key === "Escape") {
                            setEditingSlideIdx(null);
                          }
                        }}
                        onBlur={(e) => handleDurationSubmit(slide.id, e.currentTarget.value)}
                      />
                      {hasOverride && (
                        <button
                          type="button"
                          onClick={(e) => handleDurationReset(slide.id, e)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Reset to auto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingSlideIdx(editingSlideIdx === idx ? null : idx)}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium transition-colors",
                        hasOverride
                          ? "text-purple-400 hover:text-purple-300"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={hasOverride ? `Custom: ${slideDur.toFixed(1)}s, click to edit` : "Click to set custom duration"}
                    >
                      <Clock className="h-3 w-3" />
                      {slideDur.toFixed(1)}s
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Audio waveform (only when audio is present) */}
          {project.audioClip?.objectUrl && (
            <div className="mt-1">
              <Waveform
                audioUrl={project.audioClip.objectUrl}
                currentTime={currentTime}
                duration={timing.totalDuration}
                trimStart={0}
                trimEnd={1}
                showTrimHandles={false}
                height={40}
                activeColor="#a855f7"
                inactiveColor="#3f3f46"
              />
            </div>
          )}
        </div>

        {/* Duration info */}
        <p className="text-xs text-muted-foreground text-center">
          {durationLabel}
        </p>
      </CardContent>

      {/* Hidden audio element for playback */}
      {project.audioClip?.objectUrl && (
        <audio ref={audioRef} src={project.audioClip.objectUrl} preload="auto" />
      )}
    </Card>
  );
}
