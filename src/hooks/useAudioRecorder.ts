"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

const MAX_DURATION_MS = 600_000; // 10 minutes

interface UseAudioRecorderReturn {
  /** Whether the recorder is currently capturing audio */
  isRecording: boolean;
  /** Start recording audio from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and produce the audio blob + transcription */
  stopRecording: () => void;
  /** The recorded audio blob (null until recording stops) */
  audioBlob: Blob | null;
  /** Object URL for playback of the recorded audio */
  audioUrl: string | null;
  /** The transcribed text from the recording (null until recording stops) */
  transcription: string | null;
  /** Duration of the recording in seconds */
  duration: number;
  /** Error message if something went wrong */
  error: string | null;
  /** Reset the recorder state for a new recording */
  reset: () => void;
  /** Live AnalyserNode for waveform visualization during recording */
  analyserNode: AnalyserNode | null;
}

/**
 * Hook for recording audio with blob capture and optional transcription.
 * Records up to 10 minutes. Provides an AnalyserNode for live waveform
 * visualization. Falls back gracefully if Speech Recognition is unavailable.
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimTranscriptRef = useRef<string>("");

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Already stopped
      }
    }
    mediaRecorderRef.current = null;
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
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription(null);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];
    interimTranscriptRef.current = "";

    // Revoke previous URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up AudioContext + AnalyserNode for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // Set up MediaRecorder for blob capture
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect chunks every second

      // Set up Web Speech API recognition (optional — for transcription)
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
  }, [cleanup, audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecordingInternal = useCallback(() => {
    const finalDuration = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );
    setDuration(finalDuration);

    // Get the transcribed text
    const text = interimTranscriptRef.current.trim();
    if (text) {
      setTranscription(text);
    }

    // Stop MediaRecorder and collect the blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    // Cleanup everything except the blob/URL
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
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      stopRecordingInternal();
    }
  }, [isRecording, stopRecordingInternal]);

  const reset = useCallback(() => {
    cleanup();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription(null);
    setDuration(0);
    setError(null);
    interimTranscriptRef.current = "";
    chunksRef.current = [];
  }, [cleanup, audioUrl]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    transcription,
    duration,
    error,
    reset,
    analyserNode,
  };
}
