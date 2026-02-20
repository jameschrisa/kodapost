"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Ban, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CameraProfile } from "@/lib/types";
import camerasData from "@/data/cameras.json";

const cameras = camerasData as CameraProfile[];

/**
 * Maps camera profile ID to its thumbnail image path.
 * Images are stored in /public/cam_thumbnails/.
 */
const CAMERA_THUMBNAILS: Record<number, string> = {
  1: "/cam_thumbnails/sony_mavica.jpg",
  2: "/cam_thumbnails/canon_powershot.jpg",
  3: "/cam_thumbnails/nikon_coolpix.jpg",
  4: "/cam_thumbnails/olympus_camedia.jpg",
  5: "/cam_thumbnails/fujifilm_finepix.jpg",
  6: "/cam_thumbnails/casio_exilim.jpg",
  7: "/cam_thumbnails/kodak_easyshare.jpg",
  8: "/cam_thumbnails/panasonic_lumix.jpg",
  9: "/cam_thumbnails/polaroid_600.jpg",
  10: "/cam_thumbnails/iphone_3g.jpg",
};

interface CameraSelectorProps {
  value: number;
  onChange: (id: number) => void;
}

export function CameraSelector({ value, onChange }: CameraSelectorProps) {
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

  const isNoStyle = value === 0 || value === -1;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-3 overflow-x-auto scroll-smooth pt-2 pb-3 pr-2 snap-x snap-mandatory",
          "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-muted",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full"
        )}
      >
        {/* Left spacer — prevents ring/shadow clipping on the first card */}
        <div className="flex-shrink-0 w-1" aria-hidden />
        {/* "No Emulation" card — use photos as-is */}
        <div className="flex-shrink-0 w-[calc((100%-48px)/5)] min-w-[140px] snap-start">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => onChange(0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(0);
              }
            }}
            className={cn(
              "relative cursor-pointer transition-all duration-200 overflow-hidden",
              "hover:shadow-md hover:-translate-y-0.5",
              isNoStyle
                ? "ring-2 ring-primary shadow-lg"
                : "hover:ring-1 hover:ring-muted-foreground/30"
            )}
          >
            {isNoStyle && (
              <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Check className="h-3 w-3" />
              </div>
            )}

            <div className="relative h-24 overflow-hidden rounded-t-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
              <Ban className="h-8 w-8 text-zinc-500" />
            </div>

            <CardContent className="px-3 py-3.5">
              <p
                className={cn(
                  "text-sm font-medium leading-tight",
                  isNoStyle && "text-primary"
                )}
              >
                No Emulation
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                Use your photos as-is, no camera emulation
              </p>
            </CardContent>
          </Card>
        </div>

        {cameras.map((camera) => {
          const isSelected = camera.id === value;
          const thumbnail = CAMERA_THUMBNAILS[camera.id];

          return (
            <div
              key={camera.id}
              className="flex-shrink-0 w-[calc((100%-48px)/5)] min-w-[140px] snap-start"
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onChange(camera.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(camera.id);
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

                {/* Camera product image */}
                <div className="relative h-24 overflow-hidden rounded-t-xl bg-muted">
                  <Image
                    src={thumbnail}
                    alt={camera.camera_name}
                    fill
                    sizes="(max-width: 640px) 45vw, 20vw"
                    className={cn(
                      "object-cover transition-all duration-300",
                      isSelected
                        ? "scale-105 brightness-100"
                        : "brightness-90 hover:brightness-100"
                    )}
                  />
                  {/* Subtle overlay to ensure readability of the check icon */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                </div>

                <CardContent className="px-3 py-3.5">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isSelected && "text-primary"
                    )}
                  >
                    {camera.camera_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {camera.style_prompt.split(",").slice(0, 2).join(",")}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
        {/* Right spacer — prevents shadow clipping on last card */}
        <div className="flex-shrink-0 w-1" aria-hidden />
      </div>

      {/* Right edge gradient fade — indicates more content to scroll */}
      {showGradient && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
      )}
    </div>
  );
}
