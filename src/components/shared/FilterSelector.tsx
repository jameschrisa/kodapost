"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Ban, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PREDEFINED_FILTERS, FILTER_NAME_ORDER } from "@/lib/filter-presets";
import type { PredefinedFilterName } from "@/lib/types";

/**
 * Maps predefined filter name to its thumbnail image path.
 * Images are stored in /public/predefined_filters_thumbnails/.
 * The "none" filter has no thumbnail — renders a dark gradient + icon instead.
 * Note: xpro2 filter's thumbnail file is named xpro.jpg.
 */
const FILTER_THUMBNAILS: Partial<Record<PredefinedFilterName, string>> = {
  "1977": "/predefined_filters_thumbnails/1977.jpg",
  earlybird: "/predefined_filters_thumbnails/earlybird.jpg",
  lofi: "/predefined_filters_thumbnails/lofi.jpg",
  nashville: "/predefined_filters_thumbnails/nashville.jpg",
  toaster: "/predefined_filters_thumbnails/toaster.jpg",
  kelvin: "/predefined_filters_thumbnails/kelvin.jpg",
  xpro2: "/predefined_filters_thumbnails/xpro.jpg",
  inkwell: "/predefined_filters_thumbnails/inkwell.jpg",
};

interface FilterSelectorProps {
  value: PredefinedFilterName;
  onChange: (name: PredefinedFilterName) => void;
}

export function FilterSelector({ value, onChange }: FilterSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () =>
      setShowGradient(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    el.addEventListener("scroll", check, { passive: true });
    check();
    return () => el.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-3 overflow-x-auto scroll-smooth pt-1.5 pb-2 snap-x snap-mandatory",
          "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-muted",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full"
        )}
      >
        {FILTER_NAME_ORDER.map((name) => {
          const def = PREDEFINED_FILTERS[name];
          const isSelected = name === value;
          const thumbnail = FILTER_THUMBNAILS[name];

          return (
            <div
              key={name}
              className="flex-shrink-0 w-[calc((100%-48px)/5)] min-w-[140px] snap-start"
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onChange(name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(name);
                  }
                }}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 overflow-hidden",
                  "hover:shadow-md hover:-translate-y-0.5",
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:ring-1 hover:ring-muted-foreground/30"
                )}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                {/* Filter thumbnail or "None" placeholder */}
                <div className="relative h-24 overflow-hidden rounded-t-xl bg-muted">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={def.name}
                      fill
                      sizes="(max-width: 640px) 45vw, 20vw"
                      className={cn(
                        "object-cover transition-all duration-300",
                        isSelected
                          ? "scale-105 brightness-100"
                          : "brightness-90 hover:brightness-100"
                      )}
                    />
                  ) : (
                    /* "None" filter — dark gradient background with Ban icon */
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                      <Ban className="h-8 w-8 text-zinc-500" />
                    </div>
                  )}
                  {/* Subtle overlay for readability of check icon */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                </div>

                <CardContent className="px-3 py-3.5">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isSelected && "text-primary"
                    )}
                  >
                    {def.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {def.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Right edge gradient fade — indicates more content to scroll */}
      {showGradient && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
      )}
    </div>
  );
}
