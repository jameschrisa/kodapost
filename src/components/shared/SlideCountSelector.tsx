"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlideCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
}

export function SlideCountSelector({
  value,
  onChange,
  min = 2,
  max = 12,
}: SlideCountSelectorProps) {
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {counts.map((count) => {
          const isSelected = count === value;

          return (
            <Button
              key={count}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(count)}
              className={cn(
                "h-9 w-9 p-0 text-sm font-medium",
                isSelected && "shadow-md"
              )}
            >
              {count}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Most engaging carousels use 5–7 slides. Match your slide count to uploaded images for best results.
      </p>
    </div>
  );
}
