"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProvenanceStatus } from "@/lib/types";

const STATUS_COLORS: Record<ProvenanceStatus, string> = {
  pending: "text-amber-500",
  creating_token_type: "text-amber-500",
  minting: "text-amber-500",
  succeeded: "text-green-500",
  failed: "text-red-500",
};

const STATUS_LABELS: Record<ProvenanceStatus, string> = {
  pending: "Registering...",
  creating_token_type: "Creating token...",
  minting: "Minting...",
  succeeded: "On-chain",
  failed: "Failed",
};

interface ProvenanceBadgeProps {
  status: ProvenanceStatus;
  onClick?: () => void;
  className?: string;
}

export default function ProvenanceBadge({ status, onClick, className }: ProvenanceBadgeProps) {
  const colorClass = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const isAnimating = status === "pending" || status === "creating_token_type" || status === "minting";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
        "border border-current/20 bg-current/5",
        "hover:bg-current/10 transition-colors",
        colorClass,
        className,
      )}
      title={`Provenance: ${label}`}
    >
      <Shield className={cn("h-3 w-3", isAnimating && "animate-pulse")} />
      <span>{label}</span>
    </button>
  );
}
