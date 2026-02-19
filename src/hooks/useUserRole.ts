"use client";

/**
 * Client-side hook for determining the current user's role, plan, and trial status.
 * Reads from Clerk publicMetadata. Follows the same conditional-hook pattern
 * as useClerkAuth.ts — when Clerk is disabled, defaults to admin with full access.
 */

import { useUser } from "@clerk/nextjs";
import { isClerkEnabled } from "@/hooks/useClerkAuth";

export type UserPlan = "trial" | "registered";

export interface UserRole {
  isAdmin: boolean;
  plan: UserPlan;
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
  isLoaded: boolean;
}

/** 10-day trial duration */
const TRIAL_DURATION_MS = 10 * 24 * 60 * 60 * 1000;

export function useUserRole(): UserRole {
  if (!isClerkEnabled) {
    // Dev mode: treat everyone as admin with full access
    return {
      isAdmin: true,
      plan: "registered",
      isTrialExpired: false,
      trialDaysRemaining: null,
      isLoaded: true,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return {
      isAdmin: false,
      plan: "trial",
      isTrialExpired: false,
      trialDaysRemaining: null,
      isLoaded,
    };
  }

  const metadata = user.publicMetadata as {
    role?: string;
    plan?: UserPlan;
    trialStartDate?: string;
  };

  const isAdmin = metadata.role === "admin";
  const plan: UserPlan = metadata.plan || "trial";

  let isTrialExpired = false;
  let trialDaysRemaining: number | null = null;

  if (plan === "trial" && metadata.trialStartDate) {
    const elapsed = Date.now() - new Date(metadata.trialStartDate).getTime();
    isTrialExpired = elapsed > TRIAL_DURATION_MS;
    trialDaysRemaining = isTrialExpired
      ? 0
      : Math.ceil((TRIAL_DURATION_MS - elapsed) / (24 * 60 * 60 * 1000));
  }

  return { isAdmin, plan, isTrialExpired, trialDaysRemaining, isLoaded };
}
