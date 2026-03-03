"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useOnborda } from "onborda";
import { Portal } from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "onborda";
import { useTourContext } from "./TourContext";

// Step 0 always renders as a centered portal modal.
const MODAL_STEP_INDICES = [0];

/** Shared card content — used inside both the Portal version and the inline version */
function CardContent({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  closeOnborda,
  className,
}: {
  step: CardComponentProps["step"];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  closeOnborda: () => void;
  className?: string;
}) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className={cn(
        "w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 space-y-4 pointer-events-auto",
        className
      )}
    >
      {/* Step counter + close */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-widest uppercase text-zinc-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <button
          type="button"
          onClick={closeOnborda}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentStep
                ? "w-7 bg-purple-500"
                : i < currentStep
                  ? "w-2.5 bg-purple-500/40"
                  : "w-2.5 bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Icon + title */}
      <div className="flex items-center gap-3">
        {step.icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 text-xl">
            {step.icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-white leading-snug">
          {step.title}
        </h3>
      </div>

      {/* Description */}
      <div className="text-sm text-zinc-400 leading-relaxed">{step.content}</div>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-1">
        {!isFirst && (
          <button
            type="button"
            onClick={onPrev}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={isLast ? closeOnborda : onNext}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-sm font-semibold text-white hover:from-purple-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2"
        >
          {isLast ? (
            "Done"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <button
          type="button"
          onClick={closeOnborda}
          className="block w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
        >
          Skip tour
        </button>
      )}
    </div>
  );
}

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
}: CardComponentProps) {
  const { closeOnborda } = useOnborda();
  const tourCtx = useTourContext();
  const isModalStep = MODAL_STEP_INDICES.includes(currentStep);

  const handleNext = async () => {
    if (tourCtx) await tourCtx.navigateForTourStep(currentStep + 1);
    nextStep();
  };

  const handlePrev = async () => {
    if (tourCtx) await tourCtx.navigateForTourStep(currentStep - 1);
    prevStep();
  };

  // All steps render via Portal for consistent centered positioning.
  // This prevents Onborda's inline positioning from pushing the card
  // off-screen or to the side on both mobile and desktop.
  // Card placement: side="top" → card above spotlight, otherwise below.
  const placeAtTop = !isModalStep && step.side === "top";

  return (
    <Portal>
      {/* Dim overlay (only for explicit modal steps) */}
      {isModalStep && (
        <div className="fixed inset-0 z-[900] bg-black/65 pointer-events-none" />
      )}
      {/* Card container — always centered horizontally */}
      <div
        className={cn(
          "fixed inset-x-0 z-[910] flex justify-center pointer-events-none px-4",
          isModalStep
            ? "inset-0 items-center"
            : placeAtTop
              ? "top-0 items-start pt-4"
              : "bottom-0 items-end pb-4"
        )}
      >
        <CardContent
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrev={handlePrev}
          closeOnborda={closeOnborda}
        />
      </div>
    </Portal>
  );
}
