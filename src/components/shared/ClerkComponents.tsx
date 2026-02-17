"use client";

/**
 * Safe Clerk component wrappers that render nothing when Clerk is not configured.
 * This allows the app to build and run without Clerk credentials during development.
 */

import React from "react";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback components for when Clerk is not configured
function FallbackPassthrough({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FallbackNull() {
  return null;
}

// Resolve Clerk or fallback components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedSignedIn: React.ComponentType<any> = FallbackPassthrough;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedSignedOut: React.ComponentType<any> = FallbackNull;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedUserButton: React.ComponentType<any> = FallbackNull;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedSignInButton: React.ComponentType<any> = FallbackPassthrough;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedSignUpButton: React.ComponentType<any> = FallbackPassthrough;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolvedUserProfile: React.ComponentType<any> = FallbackNull;

if (isClerkEnabled) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  resolvedSignedIn = clerk.SignedIn;
  resolvedSignedOut = clerk.SignedOut;
  resolvedUserButton = clerk.UserButton;
  resolvedSignInButton = clerk.SignInButton;
  resolvedSignUpButton = clerk.SignUpButton;
  resolvedUserProfile = clerk.UserProfile;
}

export {
  resolvedSignedIn as SignedIn,
  resolvedSignedOut as SignedOut,
  resolvedUserButton as UserButton,
  resolvedSignInButton as SignInButton,
  resolvedSignUpButton as SignUpButton,
  resolvedUserProfile as UserProfile,
  isClerkEnabled,
};
