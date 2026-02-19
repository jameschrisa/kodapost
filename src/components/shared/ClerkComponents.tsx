"use client";

/**
 * Safe Clerk component wrappers that render nothing when Clerk is not configured.
 * Uses direct imports from @clerk/nextjs (tree-shaken when not used).
 * When Clerk is not configured, falls back to passthrough/null components.
 */

import React from "react";
import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  UserButton as ClerkUserButton,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserProfile as ClerkUserProfile,
  useClerk as useClerkHook,
} from "@clerk/nextjs";

export const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback components for when Clerk is not configured
function FallbackPassthrough({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FallbackNull() {
  return null;
}

// When Clerk is enabled, use real components; otherwise use fallbacks.
// We use ternary assignment so that tree-shaking still works and
// the components always have display names.
export const SignedIn = isClerkEnabled ? ClerkSignedIn : FallbackPassthrough;
export const SignedOut = isClerkEnabled ? ClerkSignedOut : FallbackNull;
export const UserButton = isClerkEnabled ? ClerkUserButton : FallbackNull;
export const SignInButton = isClerkEnabled ? ClerkSignInButton : FallbackPassthrough;
export const SignUpButton = isClerkEnabled ? ClerkSignUpButton : FallbackPassthrough;
export const UserProfile = isClerkEnabled ? ClerkUserProfile : FallbackNull;

/**
 * Safe wrapper around Clerk's useClerk().signOut.
 * When Clerk is disabled, returns a no-op signOut function.
 */
export function useSignOut() {
  if (!isClerkEnabled) {
    return {
      signOut: (/* opts?: { redirectUrl?: string } */) => Promise.resolve(),
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signOut } = useClerkHook();
  return { signOut };
}
