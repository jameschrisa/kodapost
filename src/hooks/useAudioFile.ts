"use client";

import { useCallback, useRef, useState } from "react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
];

const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac", ".mp4"];

interface UseAudioFileReturn {
  /** Load an audio file from a File input */
  loadFile: (file: File) => Promise<void>;
  /** The loaded audio blob */
  audioBlob: Blob | null;
  /** Object URL for playback */
  audioUrl: string | null;
  /** File name */
  fileName: string | null;
  /** Duration in seconds (computed after load) */
  duration: number;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string | null;
  /** Error message */
  error: string | null;
  /** Whether file is loading */
  isLoading: boolean;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for loading and validating audio files for the nano-cast feature.
 * Accepts MP3, WAV, M4A, OGG, WebM, AAC formats up to 50MB.
 * Computes duration using the Web Audio API.
 */
export function useAudioFile(): UseAudioFileReturn {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file type
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
      if (!isValidType) {
        setError(
          `Unsupported format. Please use: ${ACCEPTED_EXTENSIONS.join(", ")}`
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        return;
      }

      // Create blob and URL
      const blob = new Blob([await file.arrayBuffer()], { type: file.type || "audio/mpeg" });

      // Revoke previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const url = URL.createObjectURL(blob);

      // Get duration using an audio element
      const audioDuration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.preload = "metadata";

        audio.onloadedmetadata = () => {
          if (audio.duration === Infinity || isNaN(audio.duration)) {
            // Workaround for some browsers with WebM
            audio.currentTime = 1e10;
            audio.ontimeupdate = () => {
              audio.ontimeupdate = null;
              resolve(Math.floor(audio.duration));
              audio.currentTime = 0;
            };
          } else {
            resolve(Math.floor(audio.duration));
          }
        };

        audio.onerror = () => {
          reject(new Error("Failed to load audio file. The file may be corrupted."));
        };

        audio.src = url;
        audioElementRef.current = audio;
      });

      // Validate duration (max 10 minutes)
      if (audioDuration > 600) {
        setError("Audio file is too long. Maximum duration is 10 minutes.");
        URL.revokeObjectURL(url);
        return;
      }

      setAudioBlob(blob);
      setAudioUrl(url);
      setFileName(file.name);
      setDuration(audioDuration);
      setFileSize(file.size);
      setMimeType(file.type || "audio/mpeg");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audio file."
      );
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl]);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setFileName(null);
    setDuration(0);
    setFileSize(0);
    setMimeType(null);
    setError(null);
    setIsLoading(false);
  }, [audioUrl]);

  return {
    loadFile,
    audioBlob,
    audioUrl,
    fileName,
    duration,
    fileSize,
    mimeType,
    error,
    isLoading,
    reset,
  };
}
