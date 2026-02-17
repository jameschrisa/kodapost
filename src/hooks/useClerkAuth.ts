"use client";

/**
 * Safe wrapper around Clerk's useUser hook.
 * Returns sensible defaults when Clerk is not configured (no publishable key).
 * This allows the app to build and run without Clerk credentials during development.
 */

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useUserHook: () => { isSignedIn: boolean | undefined; isLoaded: boolean; user: any };

if (isClerkEnabled) {
  // Dynamic import at module level won't work for hooks, so we use require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  useUserHook = clerk.useUser;
} else {
  // When Clerk is not configured, treat everyone as signed in
  useUserHook = () => ({ isSignedIn: true, isLoaded: true, user: null });
}

export function useClerkAuth() {
  const { isSignedIn, isLoaded } = useUserHook();
  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    isClerkEnabled,
  };
}
