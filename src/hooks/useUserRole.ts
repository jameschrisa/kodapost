"use client";

/**
 * Client-side hook for determining the current user's role, plan, and trial status.
 * Reads from Clerk publicMetadata. Follows the same conditional-hook pattern
 * as useClerkAuth.ts — when Clerk is disabled, defaults to admin with full access.
 *
 * Supports admin view mode: admins can toggle to "user" mode to preview
 * the standard user experience. The effective `isAdmin` respects this toggle,
 * while `isActualAdmin` always reflects the real Clerk role.
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { isClerkEnabled } from "@/hooks/useClerkAuth";

export type UserPlan = "trial" | "registered" | "standard" | "pro";  // "registered" kept for legacy migration
export type AdminViewMode = "admin" | "user";

export interface UserRole {
  /** Effective admin status — false when admin is in "user" view mode */
  isAdmin: boolean;
  /** Real admin status from Clerk — never masked by view mode */
  isActualAdmin: boolean;
  /** Current view mode for admins */
  adminViewMode: AdminViewMode;
  /** Toggle between admin and user view modes */
  setAdminViewMode: (mode: AdminViewMode) => void;
  plan: UserPlan;
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
  isLoaded: boolean;
}

/** 10-day trial duration */
const TRIAL_DURATION_MS = 10 * 24 * 60 * 60 * 1000;
const VIEW_MODE_KEY = "kodapost:admin-view-mode";

// No-op setter for non-admin / dev contexts
const noopSetMode = () => {};

export function useUserRole(): UserRole {
  if (!isClerkEnabled) {
    // Dev mode: treat everyone as admin with full access
    return {
      isAdmin: true,
      isActualAdmin: true,
      adminViewMode: "admin",
      setAdminViewMode: noopSetMode,
      plan: "pro",  // dev mode: full access
      isTrialExpired: false,
      trialDaysRemaining: null,
      isLoaded: true,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded } = useUser();

  // Admin view mode state — default to "admin" (avoids SSR flicker)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [viewMode, setViewMode] = useState<AdminViewMode>("admin");

  // Hydrate from localStorage after mount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === "user" || stored === "admin") {
        setViewMode(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist changes to localStorage
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleSetViewMode = useCallback((mode: AdminViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  if (!isLoaded || !user) {
    return {
      isAdmin: false,
      isActualAdmin: false,
      adminViewMode: "admin",
      setAdminViewMode: noopSetMode,
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

  const realIsAdmin = metadata.role === "admin";
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

  return {
    isAdmin: realIsAdmin && viewMode === "admin",
    isActualAdmin: realIsAdmin,
    adminViewMode: viewMode,
    setAdminViewMode: realIsAdmin ? handleSetViewMode : noopSetMode,
    plan,
    isTrialExpired,
    trialDaysRemaining,
    isLoaded,
  };
}
