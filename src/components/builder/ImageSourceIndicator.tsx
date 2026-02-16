"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ImageIcon, Type } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarouselProject } from "@/lib/types";
import { calculateImageSourceStrategy } from "@/lib/image-source-calculator";

interface ImageSourceIndicatorProps {
  project: CarouselProject;
}

function getRatioStatus(percentage: number) {
  if (percentage === 100) {
    return {
      label: "All slides have images!",
      color: "text-green-600",
      barColor: "bg-green-500",
      bgColor: "bg-green-500/10",
    };
  }
  if (percentage >= 50) {
    return {
      label: "Some slides will be text-only",
      color: "text-amber-500",
      barColor: "bg-amber-500",
      bgColor: "bg-amber-500/10",
    };
  }
  return {
    label: "Most slides will be text-only — upload more photos",
    color: "text-orange-500",
    barColor: "bg-orange-500",
    bgColor: "bg-orange-500/10",
  };
}

export function ImageSourceIndicator({ project }: ImageSourceIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  const strategy = useMemo(
    () =>
      calculateImageSourceStrategy(
        project.uploadedImages.length,
        project.slideCount,
        project.imageAllocationMode
      ),
    [project.uploadedImages.length, project.slideCount, project.imageAllocationMode]
  );

  const status = getRatioStatus(strategy.ratio.percentage);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Ratio bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <ImageIcon className="h-3.5 w-3.5 text-green-500" />
              Uploaded: {strategy.ratio.uploaded}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              Text Only: {strategy.ratio.generated}
              <Type className="h-3.5 w-3.5 text-slate-400" />
            </span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {strategy.ratio.uploaded > 0 && (
              <div
                className="rounded-l-full bg-green-500 transition-all duration-300"
                style={{ width: `${strategy.ratio.percentage}%` }}
              />
            )}
            {strategy.ratio.generated > 0 && (
              <div
                className={cn(
                  "bg-slate-400 transition-all duration-300",
                  strategy.ratio.uploaded === 0 && "rounded-l-full",
                  "rounded-r-full"
                )}
                style={{ width: `${100 - strategy.ratio.percentage}%` }}
              />
            )}
          </div>
        </div>

        {/* Status message */}
        <div
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2",
            status.bgColor
          )}
        >
          <span className={cn("text-sm font-medium", status.color)}>
            {status.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {strategy.ratio.percentage}% original
          </span>
        </div>

        {/* Expandable allocation details */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Hide" : "Show"} slide allocation
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {expanded && (
          <div className="space-y-1 pt-1">
            {strategy.sourceAllocation.map((slot) => {
              const isUploaded = slot.source === "user_upload";
              return (
                <div
                  key={slot.slidePosition}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm"
                >
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">
                    Slide {slot.slidePosition + 1}
                  </span>
                  <div
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      isUploaded ? "bg-green-500" : "bg-slate-400"
                    )}
                  />
                  {isUploaded ? (
                    <span>
                      Your Photo #{(slot.referenceImageIndex ?? 0) + 1}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Text Only (no image)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
