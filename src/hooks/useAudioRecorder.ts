"use client";

import { useCallback, useRef, useState } from "react";

// Web Speech API types (not in all TS environments by default)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

const MAX_DURATION_MS = 60_000; // 60 seconds

interface UseAudioRecorderReturn {
  /** Whether the recorder is currently capturing audio */
  isRecording: boolean;
  /** Start recording audio from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and produce the transcription */
  stopRecording: () => void;
  /** The transcribed text from the recording (null until recording stops) */
  transcription: string | null;
  /** Duration of the recording in seconds */
  duration: number;
  /** Error message if something went wrong */
  error: string | null;
  /** Reset the recorder state for a new recording */
  reset: () => void;
}

/**
 * Hook for recording audio and transcribing it using the Web Speech API.
 * Falls back to a simple "audio recorded" message if Speech Recognition
 * is not available in the browser.
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimTranscriptRef = useRef<string>("");

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription(null);
    setDuration(0);
    interimTranscriptRef.current = "";

    try {
      // Request microphone access (shows permission prompt)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Speech API recognition
      const SpeechRecognitionAPI =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          interimTranscriptRef.current = finalTranscript + interim;
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          if (event.error !== "aborted") {
            console.warn("Speech recognition error:", event.error);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Update duration display every second
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Auto-stop at max duration
      maxDurationTimerRef.current = setTimeout(() => {
        stopRecordingInternal();
      }, MAX_DURATION_MS);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError(
          "No microphone found. Please connect a microphone and try again."
        );
      } else {
        setError("Failed to start recording. Please try again.");
      }
    }
  }, [cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecordingInternal = useCallback(() => {
    const finalDuration = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );
    setDuration(finalDuration);

    // Get the transcribed text
    const text = interimTranscriptRef.current.trim();
    if (text) {
      setTranscription(text);
    } else {
      setTranscription(null);
      setError(
        "No speech detected. Try speaking more clearly or check your microphone."
      );
    }

    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      stopRecordingInternal();
    }
  }, [isRecording, stopRecordingInternal]);

  const reset = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setTranscription(null);
    setDuration(0);
    setError(null);
    interimTranscriptRef.current = "";
  }, [cleanup]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcription,
    duration,
    error,
    reset,
  };
}
