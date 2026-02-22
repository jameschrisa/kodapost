"use client";

import { Check, X, Loader2, Zap, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type PlanTier, type PlanConfig } from "@/lib/plans";

interface FeatureRow {
  label: string;
  key: keyof PlanConfig;
  comingSoon?: boolean;
}

const FEATURES: FeatureRow[] = [
  { label: "Video Export", key: "videoExport" },
  { label: "Music Library", key: "musicLibrary" },
  { label: "Direct Publish", key: "directPublish" },
  { label: "Multi-language (Asian Edition)", key: "multilingualSupport", comingSoon: true },
  { label: "Priority Support", key: "prioritySupport" },
];

const TIER_ICONS: Record<PlanTier, React.ReactNode> = {
  trial: <Sparkles className="h-5 w-5" />,
  standard: <Zap className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
};

const TIER_ACCENT: Record<PlanTier, string> = {
  trial: "border-zinc-700 bg-zinc-900/60",
  standard: "border-purple-500/50 bg-purple-950/30",
  pro: "border-fuchsia-500/50 bg-fuchsia-950/20",
};

const TIER_ICON_BG: Record<PlanTier, string> = {
  trial: "bg-zinc-700/50 text-zinc-300",
  standard: "bg-purple-500/20 text-purple-400",
  pro: "bg-fuchsia-500/20 text-fuchsia-400",
};

const TIER_BADGE: Record<PlanTier, string> = {
  trial: "bg-zinc-700 text-zinc-300",
  standard: "bg-purple-500/20 text-purple-300",
  pro: "bg-fuchsia-500/20 text-fuchsia-300",
};

interface PlanCardProps {
  tier: PlanTier;
  config: PlanConfig;
  isCurrentPlan: boolean;
  stripePriceId?: string;
  onUpgrade: (priceId: string) => void;
  onManage: () => void;
  loading?: boolean;
}

export function PlanCard({
  tier,
  config,
  isCurrentPlan,
  stripePriceId,
  onUpgrade,
  onManage,
  loading = false,
}: PlanCardProps) {
  const isFreeTier = config.priceMonthly === 0;
  const generationsLabel =
    config.maxGenerationsPerMonth === -1
      ? "Unlimited"
      : `${config.maxGenerationsPerMonth}/mo`;
  const draftsLabel = `${config.maxDrafts} draft${config.maxDrafts === 1 ? "" : "s"}`;
  const expiryLabel =
    config.draftExpirationDays === -1 ? "Never expire" : `${config.draftExpirationDays}-day expiry`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 gap-5",
        TIER_ACCENT[tier],
        isCurrentPlan && "ring-2 ring-offset-2 ring-offset-zinc-950",
        tier === "standard" && "ring-purple-500",
        tier === "pro" && "ring-fuchsia-500"
      )}
    >
      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={cn("rounded-full px-3 py-0.5 text-[11px] font-semibold", TIER_BADGE[tier])}>
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", TIER_ICON_BG[tier])}>
          {TIER_ICONS[tier]}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{config.displayName}</h3>
          <p className="text-xs text-zinc-400">
            {isFreeTier ? "Free · 10-day trial" : `$${config.priceMonthly}/month`}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap gap-2">
        {[draftsLabel, generationsLabel, expiryLabel].map((stat) => (
          <span
            key={stat}
            className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300"
          >
            {stat}
          </span>
        ))}
      </div>

      {/* Feature list */}
      <ul className="space-y-2 flex-1">
        {FEATURES.map(({ label, key, comingSoon }) => {
          const enabled = config[key] as boolean;
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              {enabled ? (
                <Check className="h-4 w-4 shrink-0 text-green-400" />
              ) : (
                <X className="h-4 w-4 shrink-0 text-zinc-600" />
              )}
              <span className={cn(enabled ? "text-zinc-200" : "text-zinc-500")}>
                {label}
              </span>
              {enabled && comingSoon && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  Soon
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <div className="mt-1">
        {isCurrentPlan ? (
          isFreeTier ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full opacity-60 cursor-default"
              disabled
            >
              Active
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onManage}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Subscription"}
            </Button>
          )
        ) : isFreeTier ? (
          <Button variant="outline" size="sm" className="w-full opacity-60 cursor-default" disabled>
            Free Trial
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              "w-full font-semibold",
              tier === "pro"
                ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500"
                : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
            )}
            onClick={() => stripePriceId && onUpgrade(stripePriceId)}
            disabled={loading || !stripePriceId}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Upgrade to ${config.displayName}`
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
