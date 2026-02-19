"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export function TrialBanner() {
  const { plan, trialDaysRemaining, isTrialExpired, isLoaded } = useUserRole();

  if (!isLoaded || plan !== "trial") return null;

  if (isTrialExpired) {
    return (
      <div className="mb-6 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
            <Clock className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Trial Expired</h3>
            <p className="mt-1 text-sm text-red-200/80">
              Your 10-day trial has ended. Upgrade to continue creating
              carousels.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 bg-white text-red-950 hover:bg-red-100"
          >
            Upgrade
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Active trial
  if (trialDaysRemaining === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-4 overflow-hidden"
      >
        <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-amber-900/30 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-amber-200">
              Trial: {trialDaysRemaining} day
              {trialDaysRemaining !== 1 ? "s" : ""} remaining
            </span>
            <Button
              variant="link"
              size="sm"
              className="ml-auto h-auto p-0 text-amber-300 hover:text-amber-100"
            >
              Upgrade
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
