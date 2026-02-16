"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Crop, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CarouselSlide } from "@/lib/types";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: CarouselSlide;
  aspectRatio: number;
  onApply: (cropArea: { x: number; y: number; width: number; height: number }) => void;
  onReset: () => void;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  slide,
  aspectRatio,
  onApply,
  onReset,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = useCallback(() => {
    if (!croppedAreaPixels || !slide.imageUrl) return;

    // We need to get the natural image dimensions to convert to percentages.
    // react-easy-crop gives us pixel values relative to the image's natural size.
    const img = new window.Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      const cropPercent = {
        x: (croppedAreaPixels.x / naturalWidth) * 100,
        y: (croppedAreaPixels.y / naturalHeight) * 100,
        width: (croppedAreaPixels.width / naturalWidth) * 100,
        height: (croppedAreaPixels.height / naturalHeight) * 100,
      };

      onApply(cropPercent);
      onOpenChange(false);
    };
    img.src = slide.imageUrl;
  }, [croppedAreaPixels, slide.imageUrl, onApply, onOpenChange]);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onReset();
    onOpenChange(false);
  }, [onReset, onOpenChange]);

  if (!slide.imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-4 w-4" />
            Crop Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area. Aspect ratio is locked to your target platform.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[350px] w-full overflow-hidden rounded-lg bg-black">
          <Cropper
            image={slide.imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply Crop
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
