"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "./Waveform";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  /** Audio URL to play */
  audioUrl: string;
  /** Total duration in seconds */
  duration: number;
  /** Trim start in seconds */
  trimStart?: number;
  /** Trim end in seconds */
  trimEnd?: number;
  /** Callback when trim changes (in seconds) */
  onTrimChange?: (startSec: number, endSec: number) => void;
  /** Whether to show trim handles */
  showTrimHandles?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  audioUrl,
  duration,
  trimStart = 0,
  trimEnd,
  onTrimChange,
  showTrimHandles = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const effectiveTrimEnd = trimEnd ?? duration;

  // Normalized trim values for waveform (0-1)
  const normalizedStart = duration > 0 ? trimStart / duration : 0;
  const normalizedEnd = duration > 0 ? effectiveTrimEnd / duration : 1;

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Auto-pause at trim end
      if (audio.currentTime >= effectiveTrimEnd) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, effectiveTrimEnd]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Start from trim start if before it or after trim end
      if (audio.currentTime < trimStart || audio.currentTime >= effectiveTrimEnd) {
        audio.currentTime = trimStart;
      }
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying, trimStart, effectiveTrimEnd]);

  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = trimStart;
    setCurrentTime(trimStart);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [trimStart, isPlaying]);

  const handleTrimChange = useCallback(
    (start: number, end: number) => {
      // Convert from normalized (0-1) to seconds
      onTrimChange?.(start * duration, end * duration);
    },
    [duration, onTrimChange]
  );

  const displayTime = Math.max(0, currentTime - trimStart);
  const displayDuration = effectiveTrimEnd - trimStart;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Waveform */}
      <div className="rounded-lg bg-zinc-900/50 p-3">
        <Waveform
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          trimStart={normalizedStart}
          trimEnd={normalizedEnd}
          onTrimChange={handleTrimChange}
          showTrimHandles={showTrimHandles}
          height={48}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRestart}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <span className="text-xs font-mono text-muted-foreground">
          {formatTime(displayTime)} / {formatTime(displayDuration)}
        </span>

        {showTrimHandles && (
          <span className="ml-auto text-xs text-purple-400">
            Clip: {formatTime(trimStart)} &rarr; {formatTime(effectiveTrimEnd)}
          </span>
        )}
      </div>
    </div>
  );
}
