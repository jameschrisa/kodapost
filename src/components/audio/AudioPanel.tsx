"use client";

import { useCallback, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mic,
  Music,
  Scissors,
  Trash2,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioFile } from "@/hooks/useAudioFile";
import { Waveform } from "./Waveform";
import { AudioPlayer } from "./AudioPlayer";
import { MusicBrowser } from "./MusicBrowser";
import { AudioHelpDialog } from "./AudioHelpDialog";
import { logActivity } from "@/lib/activity-log";
import type { AudioClip, MusicTrack } from "@/lib/types";

type AudioInputMode = "record" | "upload" | "library";

interface AudioPanelProps {
  /** Current audio clip from the project */
  audioClip?: AudioClip;
  /** Callback when audio clip is set or updated */
  onAudioChange: (clip: AudioClip | undefined) => void;
  /** Additional CSS classes */
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AudioPanel({
  audioClip,
  onAudioChange,
  className,
}: AudioPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!!audioClip);
  const [helpOpen, setHelpOpen] = useState(false);
  const [inputMode, setInputMode] = useState<AudioInputMode | null>(null);
  const [trimStart, setTrimStart] = useState(audioClip?.trimStart ?? 0);
  const [trimEnd, setTrimEnd] = useState<number | undefined>(
    audioClip?.trimEnd
  );
  const [showTrimHandles, setShowTrimHandles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorder = useAudioRecorder();
  const fileLoader = useAudioFile();

  // Handle recording complete → create AudioClip
  const handleRecordingComplete = useCallback(() => {
    recorder.stopRecording();
    // We need to wait for the blob to be ready (set by the onstop handler)
    // Use a small timeout to let the state update
    setTimeout(() => {
      // This will be called after the blob is set
    }, 100);
  }, [recorder]);

  // Watch for recorder blob becoming available
  const handleSaveRecording = useCallback(() => {
    if (!recorder.audioBlob || !recorder.audioUrl) return;

    const clip: AudioClip = {
      id: `audio-${Date.now()}`,
      source: "recording",
      name: `Recording ${new Date().toLocaleTimeString()}`,
      duration: recorder.duration,
      mimeType: recorder.audioBlob.type,
      size: recorder.audioBlob.size,
      objectUrl: recorder.audioUrl,
      transcription: recorder.transcription ?? undefined,
      createdAt: new Date().toISOString(),
    };

    onAudioChange(clip);
    logActivity("audio_added", `Recorded ${formatTime(recorder.duration)} voice track`);
    setInputMode(null);
    toast.success("Recording saved", {
      description: `${formatTime(recorder.duration)} voice track added.${
        recorder.transcription ? " Transcription captured." : ""
      }`,
    });
  }, [recorder.audioBlob, recorder.audioUrl, recorder.duration, recorder.transcription, onAudioChange]);

  // Handle file upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await fileLoader.loadFile(file);
    },
    [fileLoader]
  );

  // Watch for file loader completing
  const handleSaveFile = useCallback(() => {
    if (!fileLoader.audioBlob || !fileLoader.audioUrl) return;

    const clip: AudioClip = {
      id: `audio-${Date.now()}`,
      source: "upload",
      name: fileLoader.fileName || "Uploaded audio",
      duration: fileLoader.duration,
      mimeType: fileLoader.mimeType || "audio/mpeg",
      size: fileLoader.fileSize,
      objectUrl: fileLoader.audioUrl,
      createdAt: new Date().toISOString(),
    };

    onAudioChange(clip);
    setInputMode(null);
    toast.success("Audio file loaded", {
      description: `${fileLoader.fileName} (${formatTime(fileLoader.duration)}) added.`,
    });
  }, [fileLoader, onAudioChange]);

  // Handle trim changes
  const handleTrimChange = useCallback(
    (startSec: number, endSec: number) => {
      setTrimStart(startSec);
      setTrimEnd(endSec);

      if (audioClip) {
        onAudioChange({
          ...audioClip,
          trimStart: startSec,
          trimEnd: endSec,
        });
      }
    },
    [audioClip, onAudioChange]
  );

  // Handle music library track selection
  const handleMusicSelect = useCallback(
    async (track: MusicTrack) => {
      try {
        // Fetch the audio stream to create a local blob for the player
        const res = await fetch(track.streamUrl);
        if (!res.ok) throw new Error("Failed to load track");
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const clip: AudioClip = {
          id: `audio-${Date.now()}`,
          source: "library",
          name: track.title,
          duration: track.duration,
          mimeType: blob.type || "audio/mpeg",
          size: blob.size,
          objectUrl,
          attribution: {
            trackTitle: track.title,
            artistName: track.artist,
            platform: track.platform,
            trackUrl: track.platformUrl,
            license: track.license,
            attributionText: track.attributionText,
          },
          createdAt: new Date().toISOString(),
        };

        onAudioChange(clip);
        setInputMode(null);
        toast.success("Track added", {
          description: `"${track.title}" by ${track.artist}`,
        });
      } catch {
        toast.error("Failed to load track", {
          description: "Please try a different track.",
        });
      }
    },
    [onAudioChange]
  );

  // Remove audio
  const handleRemoveAudio = useCallback(() => {
    logActivity("audio_removed", "Removed audio clip");
    onAudioChange(undefined);
    setInputMode(null);
    setTrimStart(0);
    setTrimEnd(undefined);
    setShowTrimHandles(false);
    recorder.reset();
    fileLoader.reset();
    toast.info("Audio removed");
  }, [onAudioChange, recorder, fileLoader]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
          <Music className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {audioClip ? "Audio Track" : "Add Audio"}
          </p>
          <p className="text-xs text-muted-foreground">
            {audioClip
              ? `${audioClip.name} · ${formatTime(audioClip.duration)}${
                  audioClip.trimStart || audioClip.trimEnd
                    ? ` (trimmed ${formatTime(audioClip.trimStart ?? 0)}–${formatTime(audioClip.trimEnd ?? audioClip.duration)})`
                    : ""
                }${!audioClip.objectUrl ? " · ⚠ needs re-add" : ""}`
              : "Record voice, upload audio, or browse music library"}
          </p>
        </div>
        {audioClip && (
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
            {audioClip.source === "recording"
              ? "Voice"
              : audioClip.source === "upload"
                ? "File"
                : "Library"}
          </span>
        )}
        {/* Guide button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setHelpOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              setHelpOpen(true);
            }
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-purple-400 transition-colors hover:text-purple-300 hover:bg-purple-500/10"
          aria-label="Audio help guide"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Guide
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Audio help guide dialog */}
      <AudioHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4 border-t px-4 pb-4 pt-4">
              {/* If we have an audio clip, show player + controls */}
              {audioClip && (
                <div className="space-y-3">
                  {/* Audio player — only when objectUrl is available (blob URLs don't survive reload) */}
                  {audioClip.objectUrl ? (
                    <AudioPlayer
                      audioUrl={audioClip.objectUrl}
                      duration={audioClip.duration}
                      trimStart={trimStart}
                      trimEnd={trimEnd}
                      onTrimChange={handleTrimChange}
                      showTrimHandles={showTrimHandles}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center">
                      <p className="text-sm text-amber-400 font-medium">
                        Audio needs to be re-added
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Previously: {audioClip.name} ({formatTime(audioClip.duration)}).
                        Audio data doesn&apos;t persist across page reloads.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5"
                        onClick={handleRemoveAudio}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear &amp; Re-add
                      </Button>
                    </div>
                  )}

                  {/* Clip info */}
                  {audioClip.objectUrl && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(audioClip.size)}</span>
                      <span>&middot;</span>
                      <span>{audioClip.mimeType}</span>
                      {audioClip.transcription && (
                        <>
                          <span>&middot;</span>
                          <span className="text-green-400">Transcribed</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Transcription preview */}
                  {audioClip.transcription && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Transcription
                      </p>
                      <p className="text-xs line-clamp-3">
                        {audioClip.transcription}
                      </p>
                    </div>
                  )}

                  {/* Attribution info for library tracks */}
                  {audioClip.attribution && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Attribution
                      </p>
                      <p className="text-xs">
                        &ldquo;{audioClip.attribution.trackTitle}&rdquo; by{" "}
                        {audioClip.attribution.artistName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {audioClip.attribution.platform === "jamendo"
                          ? "Jamendo"
                          : "Audius"}{" "}
                        &middot; {audioClip.attribution.license}
                      </p>
                    </div>
                  )}

                  {/* Actions — only when audio is playable */}
                  {audioClip.objectUrl && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setShowTrimHandles((prev) => !prev)}
                      >
                        <Scissors className="h-3.5 w-3.5" />
                        {showTrimHandles ? "Done Trimming" : "Trim Clip"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={handleRemoveAudio}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* No audio yet — show input mode selection */}
              {!audioClip && !inputMode && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMode("record")}
                    className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-4 transition-all hover:border-purple-400 hover:bg-purple-500/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                      <Mic className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Record Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode("upload")}
                    className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-4 transition-all hover:border-purple-400 hover:bg-purple-500/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Upload Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode("library")}
                    className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-4 transition-all hover:border-purple-400 hover:bg-purple-500/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                      <Music className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Music Library</span>
                  </button>
                </div>
              )}

              {/* Record mode */}
              {!audioClip && inputMode === "record" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Record Voice</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInputMode(null);
                        recorder.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Live waveform during recording */}
                  {recorder.isRecording && (
                    <div className="rounded-lg bg-zinc-900/50 p-3">
                      <Waveform
                        analyserNode={recorder.analyserNode}
                        height={48}
                      />
                    </div>
                  )}

                  {/* Recording controls */}
                  <div className="flex items-center gap-4">
                    {!recorder.isRecording && !recorder.audioBlob && (
                      <Button
                        type="button"
                        onClick={recorder.startRecording}
                        className="gap-2 bg-red-500 hover:bg-red-600"
                      >
                        <Mic className="h-4 w-4" />
                        Start Recording
                      </Button>
                    )}

                    {recorder.isRecording && (
                      <>
                        <Button
                          type="button"
                          onClick={handleRecordingComplete}
                          variant="destructive"
                          className="gap-2"
                        >
                          <div className="h-3 w-3 rounded-sm bg-white" />
                          Stop
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-mono text-muted-foreground">
                            {formatTime(recorder.duration)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / 10:00 max
                          </span>
                        </div>
                      </>
                    )}

                    {!recorder.isRecording && recorder.audioBlob && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleSaveRecording}
                          className="gap-2"
                        >
                          Use Recording
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={recorder.reset}
                        >
                          Re-record
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(recorder.duration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recorded audio preview */}
                  {!recorder.isRecording && recorder.audioUrl && (
                    <AudioPlayer
                      audioUrl={recorder.audioUrl}
                      duration={recorder.duration}
                    />
                  )}

                  {recorder.error && (
                    <p className="text-xs text-destructive">{recorder.error}</p>
                  )}
                </div>
              )}

              {/* Upload mode */}
              {!audioClip && inputMode === "upload" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Upload Audio</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInputMode(null);
                        fileLoader.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Drop zone / file input */}
                  {!fileLoader.audioBlob && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 transition-all hover:border-purple-400 hover:bg-purple-500/5"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to select audio file
                      </span>
                      <span className="text-xs text-muted-foreground">
                        MP3, WAV, M4A, OGG, WebM, AAC &middot; Max 50MB &middot;
                        Max 10 minutes
                      </span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.mp4,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {fileLoader.isLoading && (
                    <p className="text-sm text-muted-foreground">
                      Loading audio file...
                    </p>
                  )}

                  {/* File preview */}
                  {fileLoader.audioUrl && (
                    <div className="space-y-3">
                      <AudioPlayer
                        audioUrl={fileLoader.audioUrl}
                        duration={fileLoader.duration}
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{fileLoader.fileName}</span>
                        <span>&middot;</span>
                        <span>{formatFileSize(fileLoader.fileSize)}</span>
                        <span>&middot;</span>
                        <span>{formatTime(fileLoader.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleSaveFile}
                          className="gap-2"
                        >
                          Use This Audio
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            fileLoader.reset();
                            fileInputRef.current?.click();
                          }}
                        >
                          Choose Different
                        </Button>
                      </div>
                    </div>
                  )}

                  {fileLoader.error && (
                    <p className="text-xs text-destructive">
                      {fileLoader.error}
                    </p>
                  )}
                </div>
              )}

              {/* Music Library mode */}
              {!audioClip && inputMode === "library" && (
                <MusicBrowser
                  onSelect={handleMusicSelect}
                  onCancel={() => setInputMode(null)}
                />
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
