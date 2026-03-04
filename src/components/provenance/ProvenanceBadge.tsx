"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProvenanceStatus } from "@/lib/types";

const STATUS_COLORS: Record<ProvenanceStatus, string> = {
  pending: "text-amber-500",
  signed: "text-green-500",
  failed: "text-red-500",
};

const STATUS_LABELS: Record<ProvenanceStatus, string> = {
  pending: "Registering...",
  signed: "Verified",
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
      <Shield className={cn("h-3 w-3", status === "pending" && "animate-pulse")} />
      <span>{label}</span>
    </button>
  );
}
