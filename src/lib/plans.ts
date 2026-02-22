/**
 * Plan Configuration — Single source of truth for KodaPost plan tiers,
 * draft limits, feature gating, and billing metadata.
 *
 * Used by useUserPlan hook and draft-manager for enforcement.
 * Pricing values are informational — actual billing is handled by Stripe.
 *
 * Tiers:
 *   trial    → Explore Mode  (free, 10-day trial)
 *   standard → Creator Mode  ($19/mo)
 *   pro      → Monster Mode  ($39/mo)
 *   admin    → Universal access, no plan
 */

// -----------------------------------------------------------------------------
// Plan Tier Type
// -----------------------------------------------------------------------------

export type PlanTier = "trial" | "standard" | "pro";

// -----------------------------------------------------------------------------
// Plan Configuration
// -----------------------------------------------------------------------------

export interface PlanConfig {
  /** Display name shown in UI */
  displayName: string;
  /** Maximum number of drafts the user can have */
  maxDrafts: number;
  /** Draft expiration in days (-1 = never expires) */
  draftExpirationDays: number;
  /** Maximum carousel generations per month (-1 = unlimited) */
  maxGenerationsPerMonth: number;
  /** Monthly price in USD (0 = free) */
  priceMonthly: number;
  /** Whether video reel export is available */
  videoExport: boolean;
  /** Whether music library search is available */
  musicLibrary: boolean;
  /** Whether direct social publishing is available */
  directPublish: boolean;
  /** Whether multi-language support is available (Asian Edition) */
  multilingualSupport: boolean;
  /** Whether priority support is available */
  prioritySupport: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  trial: {
    displayName: "Explore Mode",
    maxDrafts: 1,
    draftExpirationDays: 30,
    maxGenerationsPerMonth: 10,
    priceMonthly: 0,
    videoExport: true,
    musicLibrary: true,
    directPublish: false,
    multilingualSupport: false,
    prioritySupport: false,
  },
  standard: {
    displayName: "Creator Mode",
    maxDrafts: 5,
    draftExpirationDays: 30,
    maxGenerationsPerMonth: 200,
    priceMonthly: 19,
    videoExport: true,
    musicLibrary: true,
    directPublish: true,
    multilingualSupport: true,
    prioritySupport: false,
  },
  pro: {
    displayName: "Monster Mode",
    maxDrafts: 15,
    draftExpirationDays: -1,     // never expire
    maxGenerationsPerMonth: -1,  // unlimited
    priceMonthly: 39,
    videoExport: true,
    musicLibrary: true,
    directPublish: true,
    multilingualSupport: true,
    prioritySupport: true,
  },
};

// -----------------------------------------------------------------------------
// Feature Gate Types
// -----------------------------------------------------------------------------

export type GatedFeature =
  | "video_export"
  | "music_library"
  | "direct_publish"
  | "multilingual_support"
  | "priority_support";

const FEATURE_TO_CONFIG_KEY: Record<GatedFeature, keyof PlanConfig> = {
  video_export: "videoExport",
  music_library: "musicLibrary",
  direct_publish: "directPublish",
  multilingual_support: "multilingualSupport",
  priority_support: "prioritySupport",
};

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Returns the full plan configuration for a tier.
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

/**
 * Returns the maximum number of drafts for a plan tier.
 */
export function getDraftLimit(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].maxDrafts;
}

/**
 * Returns the draft expiration in days for a plan tier.
 * -1 means drafts never expire.
 */
export function getDraftExpirationDays(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].draftExpirationDays;
}

/**
 * Checks whether a user can create a new draft given their plan and current count.
 */
export function canCreateDraft(tier: PlanTier, currentDraftCount: number): boolean {
  return currentDraftCount < PLAN_CONFIGS[tier].maxDrafts;
}

/**
 * Checks whether a feature is available on a given plan tier.
 */
export function canAccessFeature(tier: PlanTier, feature: GatedFeature): boolean {
  const configKey = FEATURE_TO_CONFIG_KEY[feature];
  return PLAN_CONFIGS[tier][configKey] as boolean;
}

/**
 * Calculates the expiration date for a new draft given the plan tier.
 * Returns null if drafts never expire (pro/Monster Mode plan).
 */
export function calculateDraftExpiration(tier: PlanTier): string | null {
  const days = PLAN_CONFIGS[tier].draftExpirationDays;
  if (days === -1) return null;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry.toISOString();
}

/**
 * Returns an ordered list of plan tiers for upgrade comparisons.
 */
export const PLAN_TIER_ORDER: PlanTier[] = ["trial", "standard", "pro"];

/**
 * Checks if upgrading from one tier to another is a meaningful upgrade.
 */
export function isUpgrade(from: PlanTier, to: PlanTier): boolean {
  return PLAN_TIER_ORDER.indexOf(to) > PLAN_TIER_ORDER.indexOf(from);
}
