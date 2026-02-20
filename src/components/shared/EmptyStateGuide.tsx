"use client";

/**
 * EmptyStateGuide — First-run onboarding experience.
 *
 * Shows a 3-step visual walkthrough when the user has zero drafts.
 * Dismissed after first draft creation, tracked via localStorage flag.
 */

import { motion } from "framer-motion";
import { Camera, ImagePlus, Sparkles, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/motion";

const HAS_SEEN_GUIDE_KEY = "kodapost:has-seen-guide";

/**
 * Returns true if the user has already seen the onboarding guide.
 */
export function hasSeenGuide(): boolean {
  try {
    return !!localStorage.getItem(HAS_SEEN_GUIDE_KEY);
  } catch {
    return false;
  }
}

/**
 * Marks the guide as seen.
 */
export function markGuideSeen(): void {
  try {
    localStorage.setItem(HAS_SEEN_GUIDE_KEY, "1");
  } catch {
    // Ignore
  }
}

// Steps data
const ONBOARDING_STEPS = [
  {
    icon: Upload,
    title: "Upload Photos",
    description:
      "Start with 3-5 photos to create your first nostalgic carousel.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Camera,
    title: "Setup & Generate",
    description:
      "Choose a vintage camera style, set your theme, and let Koda create your slides.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Sparkles,
    title: "Publish",
    description:
      "Add audio, export as video reel, and share to your social platforms.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export function EmptyStateGuide() {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="mb-6"
    >
      <motion.div variants={staggerItemVariants}>
        <Card className="border-dashed border-muted-foreground/20">
          <CardContent className="p-6">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 mb-3">
                <ImagePlus className="h-3.5 w-3.5" />
                Getting Started
              </div>
              <h3 className="text-base font-semibold">
                Create your first carousel in 3 easy steps
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Transform your photos into stunning social media content.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ONBOARDING_STEPS.map((step, idx) => (
                <motion.div
                  key={step.title}
                  variants={staggerItemVariants}
                  className="flex flex-col items-center text-center rounded-lg border border-border/40 bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.bgColor}`}
                    >
                      <step.icon className={`h-4 w-4 ${step.color}`} />
                    </div>
                  </div>
                  <h4 className="text-sm font-medium">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              <span className="font-medium text-foreground">Quick tip:</span>{" "}
              Upload 3-5 high-quality photos for the best results.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
