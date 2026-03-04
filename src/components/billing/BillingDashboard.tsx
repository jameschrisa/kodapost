"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/billing/PlanCard";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useUserRole } from "@/hooks/useUserRole";
import { PLAN_CONFIGS, PLAN_TIER_ORDER, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdf?: string;
}

interface BillingStatus {
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  invoices?: Invoice[];
}

const STRIPE_PRICE_IDS: Partial<Record<PlanTier, string>> = {
  standard: process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID ?? "",
  pro: process.env.NEXT_PUBLIC_STRIPE_MONSTER_PRICE_ID ?? "",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/15 text-green-400" },
  trialing: { label: "Trial", className: "bg-blue-500/15 text-blue-400" },
  past_due: { label: "Past Due", className: "bg-red-500/15 text-red-400" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function BillingDashboard({ successParam }: { successParam?: string }) {
  const router = useRouter();
  const userPlan = useUserPlan();
  const role = useUserRole();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Show success/cancel toasts from Stripe redirect
  useEffect(() => {
    if (successParam === "1") {
      toast.success("Subscription activated! Your plan has been upgraded.");
      router.replace("/billing");
    } else if (successParam === "canceled") {
      toast.info("Checkout canceled. No changes were made.");
      router.replace("/billing");
    }
  }, [successParam, router]);

  // Fetch subscription status
  const fetchStatus = useCallback(async () => {
    if (role.isAdmin || !userPlan.isPaid) return;
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setBillingStatus(data);
      }
    } catch {
      // Non-critical — status panel just won't show
    } finally {
      setLoadingStatus(false);
    }
  }, [role.isAdmin, userPlan.isPaid]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUpgrade = useCallback(async (priceId: string) => {
    const tier = (Object.entries(STRIPE_PRICE_IDS).find(([, id]) => id === priceId)?.[0] as PlanTier) ?? null;
    setCheckoutLoading(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to start checkout");
      }
      const { url } = await res.json();
      if (!url || !url.startsWith("https://checkout.stripe.com")) {
        throw new Error("Invalid checkout URL received");
      }
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setCheckoutLoading(null);
    }
  }, []);

  const handlePortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to open portal");
      }
      const { url } = await res.json();
      if (!url || !url.startsWith("https://billing.stripe.com")) {
        throw new Error("Invalid billing portal URL received");
      }
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal");
      setPortalLoading(false);
    }
  }, []);

  if (!userPlan.isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">

      {/* ── Page header ── */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Plans and Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the right plan for your creative workflow.
        </p>
      </div>

      {/* ── Admin card ── */}
      {role.isAdmin && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Administrator - Universal Access</p>
            <p className="text-sm text-muted-foreground">
              Admin accounts have unrestricted access to all features and are not subject to plan limits.
            </p>
          </div>
        </div>
      )}

      {/* ── Plan comparison ── */}
      <div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_TIER_ORDER.map((tier) => (
            <PlanCard
              key={tier}
              tier={tier}
              config={PLAN_CONFIGS[tier]}
              isCurrentPlan={userPlan.tier === tier}
              stripePriceId={STRIPE_PRICE_IDS[tier]}
              onUpgrade={handleUpgrade}
              onManage={handlePortal}
              loading={checkoutLoading === tier || portalLoading}
            />
          ))}
        </div>
      </div>

      {/* ── Current plan summary (non-admin, paid users) ── */}
      {!role.isAdmin && userPlan.isPaid && (
        <div className="rounded-2xl border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Your Subscription</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">{userPlan.config.displayName}</span>
              {billingStatus?.subscriptionStatus && STATUS_LABELS[billingStatus.subscriptionStatus] && (
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_LABELS[billingStatus.subscriptionStatus].className)}>
                  {STATUS_LABELS[billingStatus.subscriptionStatus].label}
                </span>
              )}
            </div>
            {billingStatus?.currentPeriodEnd && (
              <p className="mt-1 text-xs text-muted-foreground">
                Renews {formatDate(billingStatus.currentPeriodEnd)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loadingStatus && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!loadingStatus && (
              <Button variant="ghost" size="icon" onClick={fetchStatus} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortal}
              disabled={portalLoading}
              className="gap-1.5"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Subscription
            </Button>
          </div>
        </div>
      )}

      {/* ── Payment history ── */}
      {!role.isAdmin && billingStatus?.invoices && billingStatus.invoices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Payment History
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {billingStatus.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-foreground">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-foreground">{formatAmount(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        inv.status === "paid"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdf ? (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs"
                        >
                          PDF <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
