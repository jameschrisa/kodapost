"use client";

import { cn } from "@/lib/utils";
import type { ProvenanceStatus } from "@/lib/types";

interface ProvenanceBadgeProps {
  status: ProvenanceStatus;
  /** Short hash code to display (first 6 chars of image hash) */
  code?: string;
  onClick?: () => void;
  /** Visual variant for light or dark image backgrounds */
  variant?: "light" | "dark";
  /** Size: sm for grid thumbnails, md for card/dialog */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Film-strip style "Proof of Real" badge.
 * Designed to look like a darkroom stamp on 35mm film rebate,
 * not a corporate verification seal.
 */
export default function ProvenanceBadge({
  status,
  code,
  onClick,
  variant = "light",
  size = "md",
  className,
}: ProvenanceBadgeProps) {
  const isVerified = status === "signed";
  const isPending = status === "pending";

  const label = isVerified
    ? code
      ? `PROOF OF REAL \u00B7 ${code}`
      : "PROOF OF REAL"
    : isPending
      ? "SIGNING..."
      : "UNVERIFIED";

  const colorClasses = variant === "light"
    ? isVerified
      ? "text-white/60 border-white/20 hover:text-white/80"
      : isPending
        ? "text-amber-300/60 border-amber-300/20"
        : "text-red-300/60 border-red-300/20"
    : isVerified
      ? "text-black/40 border-black/15 hover:text-black/60"
      : isPending
        ? "text-amber-700/50 border-amber-700/20"
        : "text-red-700/50 border-red-700/20";

  const sizeClasses = size === "sm"
    ? "text-[7px] px-1 py-px gap-0.5"
    : "text-[9px] px-1.5 py-0.5 gap-1";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-sm border font-mono uppercase tracking-widest",
        "transition-colors cursor-pointer",
        isPending && "animate-pulse",
        colorClasses,
        sizeClasses,
        className,
      )}
      title={isVerified ? "Verified real. Click for details." : `Provenance: ${label}`}
    >
      {/* Tiny aperture icon - a simple circle with inner ring */}
      <svg
        viewBox="0 0 10 10"
        className={cn("shrink-0", size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <circle cx="5" cy="5" r="4" />
        <circle cx="5" cy="5" r="1.8" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
