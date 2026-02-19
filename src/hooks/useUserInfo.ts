"use client";

/**
 * Exposes Clerk user display data for UI elements (profile dropdown, avatars).
 * Follows the same conditional-hook pattern as useClerkAuth.ts.
 */

import { useUser } from "@clerk/nextjs";
import { isClerkEnabled } from "@/hooks/useClerkAuth";

export interface UserInfo {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  isLoaded: boolean;
}

export function useUserInfo(): UserInfo {
  if (!isClerkEnabled) {
    return {
      firstName: "Developer",
      lastName: null,
      email: "dev@localhost",
      imageUrl: null,
      isLoaded: true,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { firstName: null, lastName: null, email: null, imageUrl: null, isLoaded };
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl,
    isLoaded: true,
  };
}
