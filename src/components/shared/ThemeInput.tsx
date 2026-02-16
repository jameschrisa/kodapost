"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 100;

interface ThemeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ThemeInput({ value, onChange }: ThemeInputProps) {
  const remaining = MAX_LENGTH - value.length;
  const isNearLimit = remaining <= 15;
  const isOver = remaining < 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-input">What&apos;s your story?</Label>
      <Input
        id="theme-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Morning Coffee in Manila"
        maxLength={MAX_LENGTH}
        className="h-11 text-base"
      />
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
