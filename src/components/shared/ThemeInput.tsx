"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 300;

interface ThemeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Optional slot for an inline action button (e.g., mic button) */
  trailingAction?: React.ReactNode;
}

export function ThemeInput({ value, onChange, trailingAction }: ThemeInputProps) {
  const remaining = MAX_LENGTH - value.length;
  const isNearLimit = remaining <= 30;
  const isOver = remaining < 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-input">What&apos;s your story?</Label>
      <div className="relative">
        <Textarea
          id="theme-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the moment, scene, or feeling you want to share. E.g., 'Early morning coffee at a rooftop café in Manila — golden hour light, city skyline, quiet gratitude.'"
          maxLength={MAX_LENGTH}
          rows={3}
          className="resize-none text-sm pr-12"
        />
        {/* Inline trailing action (mic button) */}
        {trailingAction && (
          <div className="absolute right-2 bottom-2">
            {trailingAction}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          A specific moment or scene works best — think place, mood, and time of day.
        </p>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            isOver
              ? "text-destructive"
              : isNearLimit
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
