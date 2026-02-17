"use client";

/**
 * Safe wrapper around Clerk's useAuth hook.
 * When Clerk is not configured (no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
 * returns defaults that treat everyone as signed in.
 * When configured, delegates to Clerk's real useAuth().
 */

import { useAuth as useClerkAuthHook } from "@clerk/nextjs";

export const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function useClerkAuth() {
  if (!isClerkEnabled) {
    return { isSignedIn: true, isLoaded: true, isClerkEnabled: false as const };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn, isLoaded } = useClerkAuthHook();
  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded: isLoaded ?? false,
    isClerkEnabled: true as const,
  };
}
