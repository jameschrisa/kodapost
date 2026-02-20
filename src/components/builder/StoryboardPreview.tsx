"use client";

/**
 * StoryboardPreview — timeline view showing slides synced to audio.
 *
 * Displays a horizontal filmstrip of slide thumbnails with an audio waveform
 * below, a playhead that scrubs through both, and controls for transition
 * type and slide timing. Users can preview how their reel will play.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Timer,
  Music,
  Layers,
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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSITION_OPTIONS: { value: SlideTransition; label: string }[] = [
  { value: "crossfade", label: "Crossfade" },
  { value: "slide", label: "Slide" },
  { value: "none", label: "None" },
];

const THUMB_HEIGHT = 120;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryboardPreview({
  project,
  onVideoSettingsChange,
}: StoryboardPreviewProps) {
  const settings = project.videoSettings ?? DEFAULT_VIDEO_SETTINGS;
  const readySlides = useMemo(
    () => project.slides.filter((s) => s.status === "ready"),
    [project.slides]
  );

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Camera filter styles
  const filterStyles = useMemo(
    () =>
      project.filterConfig
        ? getCameraFilterStyles(project.filterConfig)
        : null,
    [project.filterConfig]
  );
  const grainSVG = useMemo(() => getGrainSVGDataUri(), []);

  // Video timing
  const timing = useMemo(
    () => calculateVideoTiming(readySlides.length, project.audioClip, settings),
    [readySlides.length, project.audioClip, settings]
  );

  // Current slide based on playhead
  const currentSlideIndex = useMemo(() => {
    if (readySlides.length === 0) return 0;
    const step = timing.slideDuration - timing.transitionDuration;
    if (step <= 0) return 0;
    return Math.min(
      Math.floor(currentTime / step),
      readySlides.length - 1
    );
  }, [currentTime, readySlides.length, timing]);

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
    const slideSec = timing.slideDuration.toFixed(1);
    if (settings.timingMode === "match-audio" && project.audioClip) {
      return `Matched to audio: ${totalSec}s (${slideSec}s per slide)`;
    }
    return `${readySlides.length} slides \u00d7 ${slideSec}s = ${totalSec}s total`;
  }, [timing, settings.timingMode, project.audioClip, readySlides.length]);

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
        </div>

        {/* Filmstrip + Playhead + Waveform */}
        <div className="relative">
          {/* Slide filmstrip */}
          <div
            ref={filmstripRef}
            className="relative flex gap-1 overflow-x-auto pb-1 scrollbar-thin cursor-pointer"
            style={{ height: THUMB_HEIGHT + 24 }}
            onClick={handleFilmstripClick}
          >
            {readySlides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              // Calculate width proportional to slide duration
              const widthPercent =
                timing.totalDuration > 0
                  ? ((timing.slideDuration - (idx < readySlides.length - 1 ? timing.transitionDuration : 0)) /
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
                    height: THUMB_HEIGHT,
                  }}
                >
                  {/* Slide thumbnail */}
                  {slide.imageUrl ? (
                    <div className="relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.imageUrl}
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
