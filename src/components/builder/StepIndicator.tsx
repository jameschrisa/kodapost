"use client";

import { Fragment } from "react";
import { Check, Upload, Settings, Type, Eye, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springBouncy } from "@/lib/motion";

const STEPS = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "configure", label: "Configure", icon: Settings },
  { key: "edit", label: "Editorial", icon: Type },
  { key: "review", label: "Review", icon: Eye },
  { key: "publish", label: "Publish", icon: Rocket },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface StepIndicatorProps {
  currentStep: StepKey;
  onStepClick?: (step: StepKey) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Horizontal on sm+, vertical on mobile */}
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && onStepClick;
          const Icon = step.icon;

          return (
            <Fragment key={step.key}>
              {/* Connector line between steps (top-level sibling, not nested) */}
              {index > 0 && (
                <li aria-hidden="true" className="hidden sm:block sm:flex-1">
                  <div className="h-0.5 w-full relative bg-border">
                    {/* Animated fill overlay */}
                    <motion.div
                      className="absolute inset-0 bg-primary origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: index <= currentIndex ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </li>
              )}

              {/* Step circle + label */}
              <li className="flex items-center gap-3 sm:flex-col sm:gap-1.5 sm:shrink-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.key)}
                  className={cn(
                    "flex items-center gap-3 sm:flex-col sm:gap-1.5 relative",
                    isClickable && "cursor-pointer hover:opacity-80 transition-opacity",
                    !isClickable && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      isCurrent &&
                        "border-primary bg-primary/10 text-primary",
                      !isCompleted &&
                        !isCurrent &&
                        "border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {/* Animated active ring */}
                    {isCurrent && (
                      <motion.div
                        layoutId="step-active-ring"
                        className="absolute inset-[-4px] rounded-full border-2 border-primary/30"
                        transition={springBouncy}
                      />
                    )}

                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={springBouncy}
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
