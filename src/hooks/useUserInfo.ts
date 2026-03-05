"use client";

/**
 * Exposes Clerk user display data for UI elements (profile dropdown, avatars).
 * Follows the same conditional-hook pattern as useClerkAuth.ts.
 */

import { useUser } from "@clerk/nextjs";
import { isClerkEnabled } from "@/hooks/useClerkAuth";

export type AvatarOverride =
  | { type: "dicebear"; style: string }
  | { type: "emoji"; emoji: string };

export interface UserInfo {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  avatarOverride: AvatarOverride | null;
  isLoaded: boolean;
  /** Call to persist a new avatar choice (or null to clear). */
  setAvatar: (avatar: AvatarOverride | null) => Promise<void>;
}

function buildDiceBearUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export function useUserInfo(): UserInfo {
  if (!isClerkEnabled) {
    return {
      firstName: "Developer",
      lastName: null,
      email: "dev@localhost",
      imageUrl: null,
      avatarUrl: null,
      avatarEmoji: null,
      avatarOverride: null,
      isLoaded: true,
      setAvatar: async () => {},
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return {
      firstName: null,
      lastName: null,
      email: null,
      imageUrl: null,
      avatarUrl: null,
      avatarEmoji: null,
      avatarOverride: null,
      isLoaded,
      setAvatar: async () => {},
    };
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const meta = user.unsafeMetadata as { avatar?: AvatarOverride } | undefined;
  const override = meta?.avatar ?? null;

  let avatarUrl: string | null = null;
  let avatarEmoji: string | null = null;

  if (override?.type === "dicebear") {
    avatarUrl = buildDiceBearUrl(override.style, email);
  } else if (override?.type === "emoji") {
    avatarEmoji = override.emoji;
  } else {
    avatarUrl = user.imageUrl;
  }

  const setAvatar = async (avatar: AvatarOverride | null) => {
    const existing = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
    if (avatar) {
      await user.update({ unsafeMetadata: { ...existing, avatar } });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { avatar: _removed, ...rest } = existing;
      await user.update({ unsafeMetadata: rest });
    }
  };

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email,
    imageUrl: user.imageUrl,
    avatarUrl,
    avatarEmoji,
    avatarOverride: override,
    isLoaded: true,
    setAvatar,
  };
}
