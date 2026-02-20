"use client";

/**
 * Plan-aware wrapper around useUserRole.
 *
 * Maps legacy plan values ("registered" → "standard") and exposes
 * plan configuration, draft limits, and feature gates.
 */

import { useUserRole } from "@/hooks/useUserRole";
import {
  type PlanTier,
  type PlanConfig,
  type GatedFeature,
  getPlanConfig,
  getDraftLimit,
  canCreateDraft,
  canAccessFeature,
} from "@/lib/plans";

export interface UserPlanInfo {
  /** Resolved plan tier (maps "registered" → "standard") */
  tier: PlanTier;
  /** Full plan configuration */
  config: PlanConfig;
  /** Maximum drafts allowed */
  draftLimit: number;
  /** Whether the user is on a paid plan */
  isPaid: boolean;
  /** Whether auth/plan data has loaded */
  isLoaded: boolean;
  /** Whether the user is on trial */
  isTrial: boolean;
  /** Whether trial has expired */
  isTrialExpired: boolean;
  /** Days remaining on trial (null if not on trial) */
  trialDaysRemaining: number | null;
  /** Whether the user is admin */
  isAdmin: boolean;
  /** Check if user can create a new draft */
  canCreateDraft: (currentCount: number) => boolean;
  /** Check if user can access a gated feature */
  canAccessFeature: (feature: GatedFeature) => boolean;
}

/**
 * Resolves the actual PlanTier from the legacy UserPlan string.
 * Maps "registered" → "standard" for backward compatibility.
 */
function resolveTier(plan: string): PlanTier {
  if (plan === "registered") return "standard";
  if (plan === "trial" || plan === "starter" || plan === "standard" || plan === "pro") {
    return plan;
  }
  return "trial";
}

export function useUserPlan(): UserPlanInfo {
  const role = useUserRole();
  const tier = resolveTier(role.plan);
  const config = getPlanConfig(tier);

  return {
    tier,
    config,
    draftLimit: getDraftLimit(tier),
    isPaid: tier !== "trial",
    isLoaded: role.isLoaded,
    isTrial: tier === "trial",
    isTrialExpired: role.isTrialExpired,
    trialDaysRemaining: role.trialDaysRemaining,
    isAdmin: role.isAdmin,
    canCreateDraft: (currentCount: number) => canCreateDraft(tier, currentCount),
    canAccessFeature: (feature: GatedFeature) => canAccessFeature(tier, feature),
  };
}
