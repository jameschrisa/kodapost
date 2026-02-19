"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  /** Live analyser node for real-time visualization */
  analyserNode?: AnalyserNode | null;
  /** Audio URL for static waveform rendering */
  audioUrl?: string | null;
  /** Current playback position in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Trim start position (0-1 normalized) */
  trimStart?: number;
  /** Trim end position (0-1 normalized) */
  trimEnd?: number;
  /** Callback when trim handles are moved */
  onTrimChange?: (start: number, end: number) => void;
  /** Whether trim handles are visible */
  showTrimHandles?: boolean;
  /** Height of the waveform in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Brand color for active waveform */
  activeColor?: string;
  /** Color for inactive/dimmed waveform */
  inactiveColor?: string;
}

export function Waveform({
  analyserNode,
  audioUrl,
  currentTime = 0,
  duration = 0,
  trimStart = 0,
  trimEnd = 1,
  onTrimChange,
  showTrimHandles = false,
  height = 64,
  className,
  activeColor = "#a855f7", // purple-500
  inactiveColor = "#3f3f46", // zinc-700
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // Resize observer for responsive canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width));
      }
    });

    observer.observe(container);
    setCanvasWidth(Math.floor(container.clientWidth));

    return () => observer.disconnect();
  }, []);

  // Compute static waveform data from audio URL
  useEffect(() => {
    if (!audioUrl || analyserNode) return;

    const computeWaveform = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        // Downsample to ~200 bars
        const bars = Math.min(200, Math.floor(canvasWidth / 3));
        if (bars <= 0) return;

        const samplesPerBar = Math.floor(channelData.length / bars);
        const data: number[] = [];

        for (let i = 0; i < bars; i++) {
          let sum = 0;
          const start = i * samplesPerBar;
          for (let j = start; j < start + samplesPerBar && j < channelData.length; j++) {
            sum += Math.abs(channelData[j]);
          }
          data.push(sum / samplesPerBar);
        }

        // Normalize to 0-1
        const max = Math.max(...data, 0.01);
        setWaveformData(data.map((v) => v / max));

        await audioContext.close();
      } catch (err) {
        console.warn("Failed to compute waveform:", err);
      }
    };

    if (canvasWidth > 0) {
      computeWaveform();
    }
  }, [audioUrl, analyserNode, canvasWidth]);

  // Live waveform rendering
  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * centerY;
        const x = i * barWidth;

        ctx.fillStyle = activeColor;
        // Mirror bars from center
        ctx.fillRect(x, centerY - barHeight, Math.max(barWidth - 1, 1), barHeight);
        ctx.fillRect(x, centerY, Math.max(barWidth - 1, 1), barHeight);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, activeColor, canvasWidth]);

  // Static waveform rendering
  useEffect(() => {
    if (analyserNode || waveformData.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = Math.max(canvas.width / waveformData.length - 1, 1);
    const centerY = canvas.height / 2;
    const playPosition = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * canvas.width;
      const normalizedPos = i / waveformData.length;
      const barHeight = waveformData[i] * centerY * 0.9;

      // Determine bar color based on trim range and playback position
      const inTrimRange = normalizedPos >= trimStart && normalizedPos <= trimEnd;
      const isPlayed = normalizedPos <= playPosition && inTrimRange;

      if (!inTrimRange) {
        ctx.fillStyle = inactiveColor + "40"; // Very dim
      } else if (isPlayed) {
        ctx.fillStyle = activeColor;
      } else {
        ctx.fillStyle = inactiveColor;
      }

      // Mirror bars from center
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      ctx.fillRect(x, centerY + 1, barWidth, barHeight);
    }

    // Draw playhead
    if (duration > 0 && playPosition >= trimStart && playPosition <= trimEnd) {
      const playX = playPosition * canvas.width;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(playX - 1, 0, 2, canvas.height);
    }
  }, [waveformData, currentTime, duration, trimStart, trimEnd, analyserNode, activeColor, inactiveColor, canvasWidth]);

  // Handle trim drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!showTrimHandles || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      // Determine which handle is closer
      const distToStart = Math.abs(x - trimStart);
      const distToEnd = Math.abs(x - trimEnd);

      if (distToStart < distToEnd && distToStart < 0.05) {
        setIsDragging("start");
      } else if (distToEnd < 0.05) {
        setIsDragging("end");
      }
    },
    [showTrimHandles, trimStart, trimEnd]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      if (isDragging === "start") {
        const newStart = Math.min(x, trimEnd - 0.02);
        onTrimChange?.(Math.max(0, newStart), trimEnd);
      } else {
        const newEnd = Math.max(x, trimStart + 0.02);
        onTrimChange?.(trimStart, Math.min(1, newEnd));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, trimStart, trimEnd, onTrimChange]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none", className)}
      style={{ height }}
      onMouseDown={handleMouseDown}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={height}
        className="w-full"
        style={{ height }}
      />

      {/* Trim handles */}
      {showTrimHandles && waveformData.length > 0 && (
        <>
          {/* Trim start handle */}
          <div
            className="absolute top-0 bottom-0 w-1 cursor-col-resize bg-purple-400 hover:bg-purple-300"
            style={{ left: `${trimStart * 100}%` }}
          >
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-5 w-4 rounded bg-purple-400 hover:bg-purple-300 flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white/80 rounded" />
            </div>
          </div>

          {/* Trim end handle */}
          <div
            className="absolute top-0 bottom-0 w-1 cursor-col-resize bg-purple-400 hover:bg-purple-300"
            style={{ left: `${trimEnd * 100}%` }}
          >
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-5 w-4 rounded bg-purple-400 hover:bg-purple-300 flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white/80 rounded" />
            </div>
          </div>

          {/* Dimmed regions outside trim */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/40 pointer-events-none"
            style={{ width: `${trimStart * 100}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/40 pointer-events-none"
            style={{ width: `${(1 - trimEnd) * 100}%` }}
          />
        </>
      )}
    </div>
  );
}
