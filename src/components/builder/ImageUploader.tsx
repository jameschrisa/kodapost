"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { cardEntranceVariants } from "@/lib/motion";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { UploadedImage } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_MIME_TYPES = ["image/heic", "image/heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];
const RECOMMENDED_COUNT = 4; // for default 5 slides (2:1 ratio guidance)

/**
 * Detects HEIC/HEIF files by MIME type first, then by file extension
 * as a fallback (some browsers report empty or generic MIME for HEIC).
 */
function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return HEIC_EXTENSIONS.includes(ext);
}

/**
 * Sends a HEIC/HEIF file to the server for conversion to JPEG.
 * Returns a Blob for the converted image.
 * Includes a 30-second timeout and user-friendly error messages.
 */
async function convertHeicFile(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  // 30-second timeout for large images
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch("/api/convert-image", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeout);
    if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
      throw new Error("Conversion timed out. Try a smaller image.");
    }
    throw new Error("Unable to reach the conversion server. Check your connection.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "" }));
    throw new Error(
      err.error || "Image conversion failed. The file may be corrupted or unsupported."
    );
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(
      result.error || "Image conversion failed. The file may be corrupted or unsupported."
    );
  }

  // Convert data URI back to Blob for createObjectURL preview
  const byteString = atob(result.dataUri.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: "image/jpeg" });
}

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImageUploaderProps {
  onComplete: (images: UploadedImage[]) => void;
}

export function ImageUploader({ onComplete }: ImageUploaderProps) {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionState, setConversionState] = useState<{
    open: boolean;
    total: number;
    completed: number;
    currentFile: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newErrors: string[] = [];
    const validImages: LocalImage[] = [];
    const heicQueue: File[] = [];

    // Phase 1: Categorize files
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name}: File exceeds 10 MB limit.`);
        return;
      }
      if (ACCEPTED_TYPES.includes(file.type)) {
        // Standard format — accept as-is
        validImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      } else if (isHeicFile(file)) {
        // HEIC/HEIF — queue for server-side conversion
        heicQueue.push(file);
      } else {
        newErrors.push(`${file.name}: Only JPEG, PNG, WebP, and HEIC files are accepted.`);
      }
    });

    // Phase 2: Convert HEIC files sequentially
    if (heicQueue.length > 0) {
      setConversionState({
        open: true,
        total: heicQueue.length,
        completed: 0,
        currentFile: heicQueue[0].name,
      });

      for (let i = 0; i < heicQueue.length; i++) {
        const file = heicQueue[i];
        setConversionState((prev) =>
          prev ? { ...prev, currentFile: file.name, completed: i } : prev
        );

        try {
          const jpegBlob = await convertHeicFile(file);
          const convertedName = file.name
            .replace(/\.heic$/i, ".jpg")
            .replace(/\.heif$/i, ".jpg");
          validImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file: new File([jpegBlob], convertedName, { type: "image/jpeg" }),
            previewUrl: URL.createObjectURL(jpegBlob),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Conversion failed";
          newErrors.push(`${file.name}: ${msg}`);
        }
      }

      setConversionState(null);
    }

    // Phase 3: Apply results
    setErrors(newErrors);
    if (newErrors.length > 0) {
      toast.error(`${newErrors.length} file${newErrors.length !== 1 ? "s" : ""} rejected`, {
        description: newErrors[0] + (newErrors.length > 1 ? ` (+${newErrors.length - 1} more)` : ""),
      });
    }
    if (validImages.length > 0) {
      setImages((prev) => [...prev, ...validImages]);
      if (heicQueue.length > 0) {
        const converted = validImages.length - (Array.from(files).length - heicQueue.length - newErrors.length);
        if (converted > 0) {
          toast.success(
            `${converted} HEIC image${converted !== 1 ? "s" : ""} converted`,
            { description: "Converted to JPEG for compatibility." }
          );
        }
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [processFiles]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleContinue = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Convert blob URLs to base64 data URIs so they survive serialization
      // to server actions and can be sent to external APIs
      const { blobUrlToBase64 } = await import("@/lib/utils");
      const uploaded: UploadedImage[] = await Promise.all(
        images.map(async (img) => ({
          id: img.id,
          url: await blobUrlToBase64(img.previewUrl),
          filename: img.file.name,
          uploadedAt: new Date().toISOString(),
          usedInSlides: [],
        }))
      );
      onComplete(uploaded);
    } catch (error) {
      console.error("Failed to process images:", error);
      toast.error("Failed to process images", {
        description: "Could not convert images for upload. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [images, onComplete]);

  if (isProcessing) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner size="md" text="Processing images..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <Card
        data-tour="upload-zone"
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            dragActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {dragActive ? "Drop your images here" : "Drag & drop images or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP, or HEIC up to 10 MB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.heic,.heif,image/heic,image/heif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {images.length} image{images.length !== 1 && "s"} uploaded
              {images.length < RECOMMENDED_COUNT && (
                <span className="ml-1 text-amber-500">
                  ({RECOMMENDED_COUNT}+ recommended for best results)
                </span>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="gap-1.5"
            >
              <ImagePlus className="h-4 w-4" />
              Add more
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <AnimatePresence>
              {images.map((img) => (
                <motion.div
                  key={img.id}
                  variants={cardEntranceVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="group relative aspect-[4/5] overflow-hidden rounded-lg border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={img.file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
                    <p className="truncate text-xs text-white">{img.file.name}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue with {images.length} image{images.length !== 1 && "s"}
          </Button>
        </>
      )}

      {/* HEIC Conversion Dialog */}
      <Dialog
        open={conversionState?.open ?? false}
        onOpenChange={() => {
          /* non-dismissible during conversion */
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Converting Images</DialogTitle>
            <DialogDescription>
              Converting HEIC images to JPEG for browser compatibility...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress
              value={
                conversionState
                  ? ((conversionState.completed + 1) / conversionState.total) * 100
                  : 0
              }
            />
            <p className="text-sm text-muted-foreground text-center">
              {conversionState?.currentFile}
              <span className="ml-1.5 tabular-nums">
                ({(conversionState?.completed ?? 0) + 1} of {conversionState?.total ?? 0})
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
