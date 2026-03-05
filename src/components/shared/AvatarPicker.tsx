"use client";

import { useState } from "react";
import { Check, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useUserInfo } from "@/hooks/useUserInfo";
import type { AvatarOverride } from "@/hooks/useUserInfo";
import { cn } from "@/lib/utils";

const DICEBEAR_STYLES = [
  { id: "adventurer", label: "Adventurer" },
  { id: "bottts", label: "Robots" },
  { id: "fun-emoji", label: "Fun Emoji" },
  { id: "lorelei", label: "Lorelei" },
  { id: "thumbs", label: "Thumbs" },
  { id: "pixel-art", label: "Pixel Art" },
] as const;

const EMOJI_OPTIONS = [
  "\u{1F98A}", "\u{1F431}", "\u{1F436}", "\u{1F43C}", "\u{1F984}", "\u{1F916}",
  "\u{1F47D}", "\u{1F47B}", "\u{1F480}", "\u{1F60E}", "\u{1F451}", "\u{1F525}",
  "\u{2B50}", "\u{1F308}", "\u{1F680}", "\u{26A1}", "\u{2764}\u{FE0F}", "\u{1F48E}",
  "\u{1F344}", "\u{1F335}", "\u{1F3A8}", "\u{1F4F7}", "\u{1F3B5}", "\u{1F355}",
];

function buildUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function isMatch(override: AvatarOverride | null, candidate: AvatarOverride): boolean {
  if (!override) return false;
  if (override.type !== candidate.type) return false;
  if (override.type === "dicebear" && candidate.type === "dicebear") {
    return override.style === candidate.style;
  }
  if (override.type === "emoji" && candidate.type === "emoji") {
    return override.emoji === candidate.emoji;
  }
  return false;
}

export function AvatarPicker() {
  const { email, avatarOverride, setAvatar } = useUserInfo();
  const [saving, setSaving] = useState<string | null>(null);
  const seed = email || "user";

  async function pick(avatar: AvatarOverride | null) {
    const key = avatar
      ? avatar.type === "dicebear"
        ? avatar.style
        : avatar.emoji
      : "default";
    setSaving(key);
    try {
      await setAvatar(avatar);
      toast.success(avatar ? "Avatar updated" : "Using default photo");
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* DiceBear styles */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Illustrated Avatars</p>
        <div className="grid grid-cols-3 gap-2">
          {DICEBEAR_STYLES.map((style) => {
            const selected = isMatch(avatarOverride, { type: "dicebear", style: style.id });
            const isSaving = saving === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => pick({ type: "dicebear", style: style.id })}
                disabled={!!saving}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                  selected
                    ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildUrl(style.id, seed)}
                  alt={style.label}
                  className="h-12 w-12 rounded-full bg-muted/30"
                />
                <span className="text-[10px] font-medium">{style.label}</span>
                {selected && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Emoji grid */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Emoji</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map((emoji) => {
            const selected = isMatch(avatarOverride, { type: "emoji", emoji });
            const isSaving = saving === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => pick({ type: "emoji", emoji })}
                disabled={!!saving}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all",
                  selected
                    ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                )}
              >
                {emoji}
                {selected && (
                  <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500 text-white">
                    <Check className="h-2 w-2" />
                  </div>
                )}
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
                    <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Use Default Photo */}
      <button
        type="button"
        onClick={() => pick(null)}
        disabled={!!saving || !avatarOverride}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
          !avatarOverride
            ? "border-purple-400 bg-purple-500/10 text-purple-400"
            : "border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground"
        )}
      >
        <User className="h-4 w-4" />
        Use Default Photo
        {saving === "default" && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
        {!avatarOverride && !saving && (
          <Check className="ml-auto h-3.5 w-3.5 text-purple-400" />
        )}
      </button>
    </div>
  );
}
