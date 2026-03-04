import { describe, it, expect } from "vitest";
import {
  getPlanConfig,
  getDraftLimit,
  getDraftExpirationDays,
  canCreateDraft,
  canAccessFeature,
  calculateDraftExpiration,
  isUpgrade,
  PLAN_CONFIGS,
  PLAN_TIER_ORDER,
} from "@/lib/plans";
import type { PlanTier, GatedFeature } from "@/lib/plans";

describe("getPlanConfig", () => {
  it("returns config for each tier", () => {
    for (const tier of PLAN_TIER_ORDER) {
      const config = getPlanConfig(tier);
      expect(config).toBe(PLAN_CONFIGS[tier]);
    }
  });

  it("trial is Explore Mode", () => {
    expect(getPlanConfig("trial").displayName).toBe("Explore Mode");
  });

  it("pro is Monster Mode", () => {
    expect(getPlanConfig("pro").displayName).toBe("Monster Mode");
  });
});

describe("getDraftLimit", () => {
  it("trial allows 1 draft", () => {
    expect(getDraftLimit("trial")).toBe(1);
  });

  it("standard allows 5 drafts", () => {
    expect(getDraftLimit("standard")).toBe(5);
  });

  it("pro allows 15 drafts", () => {
    expect(getDraftLimit("pro")).toBe(15);
  });
});

describe("getDraftExpirationDays", () => {
  it("trial drafts expire in 30 days", () => {
    expect(getDraftExpirationDays("trial")).toBe(30);
  });

  it("pro drafts never expire (-1)", () => {
    expect(getDraftExpirationDays("pro")).toBe(-1);
  });
});

describe("canCreateDraft", () => {
  it("allows creation when under limit", () => {
    expect(canCreateDraft("trial", 0)).toBe(true);
  });

  it("blocks creation at limit", () => {
    expect(canCreateDraft("trial", 1)).toBe(false);
  });

  it("blocks creation over limit", () => {
    expect(canCreateDraft("trial", 5)).toBe(false);
  });

  it("allows standard to create up to 5", () => {
    expect(canCreateDraft("standard", 4)).toBe(true);
    expect(canCreateDraft("standard", 5)).toBe(false);
  });
});

describe("canAccessFeature", () => {
  const features: GatedFeature[] = [
    "video_export",
    "music_library",
    "direct_publish",
    "multilingual_support",
    "priority_support",
    "creator_provenance",
  ];

  it("trial can access video_export and music_library", () => {
    expect(canAccessFeature("trial", "video_export")).toBe(true);
    expect(canAccessFeature("trial", "music_library")).toBe(true);
  });

  it("trial cannot access direct_publish or provenance", () => {
    expect(canAccessFeature("trial", "direct_publish")).toBe(false);
    expect(canAccessFeature("trial", "creator_provenance")).toBe(false);
  });

  it("pro can access all features", () => {
    for (const feature of features) {
      expect(canAccessFeature("pro", feature)).toBe(true);
    }
  });

  it("standard cannot access priority_support", () => {
    expect(canAccessFeature("standard", "priority_support")).toBe(false);
  });
});

describe("calculateDraftExpiration", () => {
  it("returns an ISO string for trial tier", () => {
    const result = calculateDraftExpiration("trial");
    expect(result).not.toBeNull();
    expect(new Date(result!).getTime()).toBeGreaterThan(Date.now());
  });

  it("returns null for pro tier (never expires)", () => {
    expect(calculateDraftExpiration("pro")).toBeNull();
  });

  it("expiration is roughly 30 days in the future for trial", () => {
    const result = calculateDraftExpiration("trial");
    const diff = new Date(result!).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });
});

describe("isUpgrade", () => {
  it("trial -> standard is an upgrade", () => {
    expect(isUpgrade("trial", "standard")).toBe(true);
  });

  it("trial -> pro is an upgrade", () => {
    expect(isUpgrade("trial", "pro")).toBe(true);
  });

  it("standard -> pro is an upgrade", () => {
    expect(isUpgrade("standard", "pro")).toBe(true);
  });

  it("same tier is not an upgrade", () => {
    expect(isUpgrade("trial", "trial")).toBe(false);
    expect(isUpgrade("pro", "pro")).toBe(false);
  });

  it("pro -> trial is not an upgrade", () => {
    expect(isUpgrade("pro", "trial")).toBe(false);
  });
});

describe("PLAN_CONFIGS completeness", () => {
  it("all tiers have valid pricing", () => {
    expect(PLAN_CONFIGS.trial.priceMonthly).toBe(0);
    expect(PLAN_CONFIGS.standard.priceMonthly).toBe(19);
    expect(PLAN_CONFIGS.pro.priceMonthly).toBe(39);
  });

  it("pro has unlimited generations (-1)", () => {
    expect(PLAN_CONFIGS.pro.maxGenerationsPerMonth).toBe(-1);
  });

  it("trial has 10 generations per month", () => {
    expect(PLAN_CONFIGS.trial.maxGenerationsPerMonth).toBe(10);
  });
});
