"use client";

import { cn } from "@/lib/utils";

interface MobilePhoneFrameProps {
  /** The screen aspect ratio class, e.g. "aspect-[9/19.5]" */
  screenAspectClass: string;
  /** Total number of slides in the carousel */
  totalSlides: number;
  /** Current slide position (0-indexed) */
  currentSlide: number;
  children: React.ReactNode;
}

export function MobilePhoneFrame({
  screenAspectClass,
  totalSlides,
  currentSlide,
  children,
}: MobilePhoneFrameProps) {
  // Build navigation dots (max 7 visible, with overflow indicators)
  const maxDots = 7;
  const showDots = totalSlides > 1;
  const dots = [];
  if (showDots) {
    const start = Math.max(0, Math.min(currentSlide - Math.floor(maxDots / 2), totalSlides - maxDots));
    const end = Math.min(totalSlides, start + maxDots);
    for (let i = start; i < end; i++) {
      dots.push(i);
    }
  }

  return (
    <div
      className={cn(
        "relative mx-auto",
        // Outer phone body — titanium/aluminum frame look
        "rounded-[2.5rem] bg-gradient-to-b from-gray-700 via-gray-800 to-gray-700",
        "shadow-xl shadow-black/30",
        "p-[4px]"
      )}
    >
      {/* Inner bezel */}
      <div className="relative rounded-[2.2rem] bg-black px-[8px] pt-[18px] pb-[18px]">
        {/* Dynamic Island / Notch */}
        <div className="absolute z-30 top-[8px] left-1/2 -translate-x-1/2 h-[8px] w-[28%] rounded-full bg-gray-900 ring-1 ring-gray-800">
          {/* Camera dot inside the island */}
          <div className="absolute right-[20%] top-1/2 -translate-y-1/2 h-[4px] w-[4px] rounded-full bg-gray-700 ring-1 ring-gray-600" />
        </div>

        {/* Screen area — the phone display */}
        <div className={cn("relative overflow-hidden rounded-[1.5rem] bg-black", screenAspectClass)}>
          {/* Simulated status bar (time, signal, battery) */}
          <div
            className="absolute z-20 flex items-center justify-between text-white/60 pointer-events-none top-0 left-0 right-0 px-5 py-1"
            style={{ fontSize: "7px", fontWeight: 600, letterSpacing: "0.02em" }}
          >
            <span>9:41</span>
            <div className="flex items-center gap-1">
              {/* Signal bars */}
              <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor" className="opacity-60">
                <rect x="0" y="5" width="2" height="2" rx="0.5" />
                <rect x="3" y="3" width="2" height="4" rx="0.5" />
                <rect x="6" y="1" width="2" height="6" rx="0.5" />
                <rect x="9" y="0" width="2" height="7" rx="0.5" />
              </svg>
              {/* Battery */}
              <svg width="16" height="7" viewBox="0 0 16 7" fill="currentColor" className="opacity-60">
                <rect x="0" y="0" width="13" height="7" rx="1.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <rect x="1.5" y="1.5" width="9" height="4" rx="0.5" />
                <rect x="13.5" y="2" width="1.5" height="3" rx="0.5" />
              </svg>
            </div>
          </div>

          {/* Image content — centered within the phone screen */}
          <div className="relative h-full w-full flex items-center justify-center">
            {children}
          </div>

          {/* Carousel navigation dots */}
          {showDots && (
            <div className="absolute z-20 flex items-center justify-center gap-[3px] pointer-events-none bottom-3 left-1/2 -translate-x-1/2">
              {/* Overflow indicator left */}
              {dots[0] > 0 && (
                <div className="h-[3px] w-[3px] rounded-full bg-white/30" />
              )}
              {dots.map((dotIndex) => (
                <div
                  key={dotIndex}
                  className={cn(
                    "rounded-full transition-all",
                    dotIndex === currentSlide
                      ? "h-[5px] w-[5px] bg-white"
                      : Math.abs(dotIndex - currentSlide) === 1
                        ? "h-[4px] w-[4px] bg-white/60"
                        : "h-[3px] w-[3px] bg-white/30"
                  )}
                />
              ))}
              {/* Overflow indicator right */}
              {dots[dots.length - 1] < totalSlides - 1 && (
                <div className="h-[3px] w-[3px] rounded-full bg-white/30" />
              )}
            </div>
          )}
        </div>

        {/* Home indicator bar */}
        <div className="absolute z-30 rounded-full bg-gray-500 bottom-[6px] left-1/2 -translate-x-1/2 h-[3px] w-[25%]" />
      </div>

      {/* Physical side buttons — portrait */}
      {/* Power button — right side */}
      <div className="absolute right-[-3px] top-[28%] h-[12%] w-[3px] rounded-r-sm bg-gray-600" />
      {/* Volume up — left side */}
      <div className="absolute left-[-3px] top-[22%] h-[8%] w-[3px] rounded-l-sm bg-gray-600" />
      {/* Volume down — left side */}
      <div className="absolute left-[-3px] top-[32%] h-[8%] w-[3px] rounded-l-sm bg-gray-600" />
    </div>
  );
}
