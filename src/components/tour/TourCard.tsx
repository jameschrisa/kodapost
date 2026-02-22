"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useOnborda } from "onborda";
import { Portal } from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "onborda";
import { useTourContext } from "./TourContext";

// Only step 0 is a portal-rendered centered modal.
// All other steps target real DOM elements via Onborda's spotlight.
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
        "w-[420px] rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-5 space-y-4 pointer-events-auto",
        className
      )}
    >
      {/* Step counter + close */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <button
          type="button"
          onClick={closeOnborda}
          className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
          aria-label="Close tour"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === currentStep
                ? "w-6 bg-purple-500"
                : i < currentStep
                  ? "w-2 bg-purple-500/40"
                  : "w-2 bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Icon + title */}
      <div className="flex items-center gap-3">
        {step.icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 text-lg">
            {step.icon}
          </div>
        )}
        <h3 className="text-sm font-semibold text-white leading-snug">
          {step.title}
        </h3>
      </div>

      {/* Description */}
      <div className="text-sm text-zinc-400 leading-relaxed">{step.content}</div>

      {/* Navigation */}
      <div className="flex items-center gap-2 pt-1">
        {!isFirst && (
          <button
            type="button"
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={isLast ? closeOnborda : onNext}
          className="flex-1 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-semibold text-white hover:from-purple-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-1.5"
        >
          {isLast ? (
            "Done"
          ) : (
            <>
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <button
          type="button"
          onClick={closeOnborda}
          className="block w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
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

  if (isModalStep) {
    // Portal-render at document body to escape Onborda's Framer Motion transform
    // container — otherwise `fixed` positioning doesn't anchor to the viewport.
    return (
      <Portal>
        {/* Dim overlay */}
        <div className="fixed inset-0 z-[900] bg-black/65 pointer-events-none" />
        {/* Centered card */}
        <div className="fixed inset-0 z-[910] flex items-center justify-center pointer-events-none">
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

  // Non-modal steps: render inline inside Onborda's card container
  // (Onborda positions it relative to the highlighted element)
  return (
    <CardContent
      step={step}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrev={handlePrev}
      closeOnborda={closeOnborda}
    />
  );
}
