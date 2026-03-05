"use client";

import { useUserInfo } from "@/hooks/useUserInfo";
import { UserHexagonIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  size?: "sm" | "md";
  className?: string;
}

const SIZE_MAP = {
  sm: { container: "h-6 w-6", icon: "h-5 w-5", emoji: "text-sm" },
  md: { container: "h-8 w-8", icon: "h-4 w-4", emoji: "text-base" },
} as const;

export function AvatarDisplay({ size = "sm", className }: AvatarDisplayProps) {
  const { avatarUrl, avatarEmoji } = useUserInfo();
  const s = SIZE_MAP[size];

  if (avatarEmoji) {
    return (
      <span
        className={cn(
          s.container,
          "flex shrink-0 items-center justify-center rounded-full bg-purple-500/20",
          s.emoji,
          className
        )}
        role="img"
        aria-label="avatar"
      >
        {avatarEmoji}
      </span>
    );
  }

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn(s.container, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        s.container,
        "flex shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400",
        className
      )}
    >
      <UserHexagonIcon className={s.icon} />
    </div>
  );
}
