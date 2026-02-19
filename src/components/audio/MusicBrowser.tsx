"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Music,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MusicTrack } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MusicBrowserProps {
  onSelect: (track: MusicTrack) => void;
  onCancel: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SourceFilter = "all" | "jamendo" | "audius";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Pulsing bar animation (simple waveform indicator for active preview)
// ---------------------------------------------------------------------------

function PulsingBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-purple-400"
          animate={{
            height: ["40%", "100%", "60%", "90%", "40%"],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-900/50 p-3 animate-pulse">
      <div className="h-12 w-12 rounded bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-zinc-800" />
        <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
      </div>
      <div className="h-3 w-10 rounded bg-zinc-800" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MusicBrowser({
  onSelect,
  onCancel,
  className,
}: MusicBrowserProps) {
  // Search state
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [instrumental, setInstrumental] = useState(false);

  // Data state
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Preview state
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------
  // Debounced search
  // -------------------------------------------

  const performSearch = useCallback(
    async (searchQuery: string, searchSource: SourceFilter, inst: boolean) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          source: searchSource,
          instrumental: String(inst),
        });

        const res = await fetch(`/api/music/search?${params.toString()}`);

        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }

        const data = await res.json();
        setResults(data.tracks ?? data.results ?? data ?? []);
      } catch (err) {
        console.error("Music search error:", err);
        setError("Failed to search. Try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger debounced search whenever inputs change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, source, instrumental);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, source, instrumental, performSearch]);

  // -------------------------------------------
  // Audio preview controls
  // -------------------------------------------

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPreviewingId(null);
    setIsPlaying(false);
  }, []);

  const togglePreview = useCallback(
    (track: MusicTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      // If already previewing this track, toggle play/pause
      if (previewingId === track.id) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.play().catch(() => {
            toast.error("Unable to play preview");
          });
          setIsPlaying(true);
        }
        return;
      }

      // Switch to a new track
      stopPreview();
      audio.src = track.streamUrl;
      audio.load();
      audio
        .play()
        .then(() => {
          setPreviewingId(track.id);
          setIsPlaying(true);
        })
        .catch(() => {
          toast.error("Unable to play preview");
        });
    },
    [previewingId, isPlaying, stopPreview]
  );

  // Handle audio element events
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleAudioError = useCallback(() => {
    setIsPlaying(false);
    setPreviewingId(null);
  }, []);

  // Stop preview on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  // -------------------------------------------
  // Select track
  // -------------------------------------------

  const handleSelectTrack = useCallback(
    (track: MusicTrack) => {
      stopPreview();
      onSelect(track);
    },
    [onSelect, stopPreview]
  );

  // -------------------------------------------
  // Render
  // -------------------------------------------

  const sourceOptions: { value: SourceFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "jamendo", label: "Jamendo" },
    { value: "audius", label: "Audius" },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Music Library</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for music..."
          className="pl-9 h-9 text-sm bg-zinc-900/50"
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        {/* Source filter tabs */}
        <div className="flex items-center gap-1 rounded-md bg-zinc-900/50 p-0.5">
          {sourceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSource(opt.value)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                source === opt.value
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-purple-500/10"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Instrumental toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <button
            type="button"
            role="checkbox"
            aria-checked={instrumental}
            onClick={() => setInstrumental((prev) => !prev)}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border transition-colors",
              instrumental
                ? "border-purple-400 bg-purple-500/20 text-purple-400"
                : "border-muted-foreground/40 text-transparent hover:border-muted-foreground"
            )}
          >
            <Check className="h-3 w-3" />
          </button>
          <span className="text-xs text-muted-foreground">Instrumental</span>
        </label>
      </div>

      {/* Hidden audio element for previews */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
      />

      {/* Results area */}
      <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-0.5">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </motion.div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-8 text-center"
            >
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => performSearch(query, source, instrumental)}
              >
                Retry
              </Button>
            </motion.div>
          )}

          {/* Empty state — no query yet */}
          {!isLoading && !error && !hasSearched && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-10 text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                <Music className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                Search for music to add to your carousel
              </p>
            </motion.div>
          )}

          {/* No results */}
          {!isLoading && !error && hasSearched && results.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-10 text-center"
            >
              <Search className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No tracks found for &lsquo;{query.trim()}&rsquo;
              </p>
            </motion.div>
          )}

          {/* Results list */}
          {!isLoading && !error && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-1.5"
            >
              {results.map((track) => {
                const isPreviewing = previewingId === track.id;
                const isTrackPlaying = isPreviewing && isPlaying;

                return (
                  <div
                    key={track.id}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                      isPreviewing
                        ? "bg-purple-500/10"
                        : "bg-zinc-900/50 hover:bg-purple-500/10"
                    )}
                  >
                    {/* Artwork + play overlay */}
                    <button
                      type="button"
                      onClick={() => togglePreview(track)}
                      className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-zinc-800"
                    >
                      {track.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                      {/* Play/pause overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                          isPreviewing
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {isTrackPlaying ? (
                          <Pause className="h-5 w-5 text-white" />
                        ) : (
                          <Play className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </button>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {track.title}
                        </p>
                        {isTrackPlaying && <PulsingBars />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Platform badge */}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0",
                        track.platform === "jamendo"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-purple-500/10 text-purple-400"
                      )}
                    >
                      {track.platform === "jamendo" ? "Jamendo" : "Audius"}
                    </span>

                    {/* Use track button — visible on hover or when previewing */}
                    <div
                      className={cn(
                        "flex-shrink-0 transition-opacity",
                        isPreviewing
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSelectTrack(track)}
                        className="h-7 gap-1 bg-purple-500 hover:bg-purple-600 text-xs"
                      >
                        Use Track
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
