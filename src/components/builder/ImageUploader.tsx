"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Image as ImageIcon, Layers, Upload, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SlideCountSelector } from "@/components/shared/SlideCountSelector";
import type { PostMode, UploadedImage } from "@/lib/types";

type HeadlineMode = "all" | "first_only" | "none";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_UPLOAD_DIMENSION = 2048; // Resize all uploads to max 2048px on longest side

// Standard image formats the browser can render natively
const STANDARD_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/avif", "image/tiff", "image/bmp",
];
const STANDARD_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff", ".bmp",
];

// HEIC needs special handling (native on Safari, server fallback on Chrome)
const HEIC_MIME_TYPES = ["image/heic", "image/heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

const RECOMMENDED_COUNT = 4; // for default 5 slides (2:1 ratio guidance)

function getFileExtension(file: File): string {
  return file.name.toLowerCase().slice(file.name.lastIndexOf("."));
}

function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  return HEIC_EXTENSIONS.includes(getFileExtension(file));
}

function isAcceptedImageFile(file: File): boolean {
  if (STANDARD_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  return STANDARD_EXTENSIONS.includes(getFileExtension(file));
}

/**
 * Resizes any browser-decodable image to max 2048px and converts to JPEG.
 * Uses createImageBitmap + OffscreenCanvas for zero-DOM, memory-efficient processing.
 * Returns null if the browser can't decode the format.
 */
async function resizeImageClientSide(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    let outW = width;
    let outH = height;
    if (width > MAX_UPLOAD_DIMENSION || height > MAX_UPLOAD_DIMENSION) {
      const scale = MAX_UPLOAD_DIMENSION / Math.max(width, height);
      outW = Math.round(width * scale);
      outH = Math.round(height * scale);
    }

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return null; }
    ctx.drawImage(bitmap, 0, 0, outW, outH);
    bitmap.close();

    return canvas.convertToBlob({ type: "image/jpeg", quality: 0.88 });
  } catch {
    return null;
  }
}

/**
 * Converts a HEIC file to JPEG client-side using the browser's native
 * decoding (Safari/iOS) via Canvas, falling back to the server API route
 * for browsers that lack HEIC support (Chrome, Firefox).
 *
 * Client-side is preferred because it avoids server round-trips, scales
 * infinitely, and is much faster on Safari (which handles 99% of HEIC uploads).
 */
const MAX_CLIENT_DIMENSION = 2048;

async function convertHeicClientSide(file: File): Promise<Blob | null> {
  try {
    // createImageBitmap can decode HEIC on Safari/iOS natively
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Scale down to MAX_CLIENT_DIMENSION preserving aspect ratio
    let outW = width;
    let outH = height;
    if (width > MAX_CLIENT_DIMENSION || height > MAX_CLIENT_DIMENSION) {
      const scale = MAX_CLIENT_DIMENSION / Math.max(width, height);
      outW = Math.round(width * scale);
      outH = Math.round(height * scale);
    }

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, outW, outH);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    return blob;
  } catch {
    // Browser can't decode HEIC (Chrome, Firefox) — return null to trigger server fallback
    return null;
  }
}

async function convertHeicServerSide(file: File): Promise<Blob> {
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
  const resp = await fetch(result.dataUri);
  return resp.blob();
}

async function convertHeicFile(file: File): Promise<Blob> {
  // Try client-side first (instant on Safari/iOS)
  const clientBlob = await convertHeicClientSide(file);
  if (clientBlob && clientBlob.size > 0) return clientBlob;

  // Fall back to server for Chrome/Firefox/etc.
  return convertHeicServerSide(file);
}

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImageUploaderProps {
  onComplete: (images: UploadedImage[]) => void;
  postMode?: PostMode;
  onPostModeChange?: (mode: PostMode) => void;
  existingImages?: UploadedImage[];
  headlineMode?: HeadlineMode;
  onHeadlineModeChange?: (mode: HeadlineMode) => void;
  slideCount?: number;
  onSlideCountChange?: (count: number) => void;
}

export function ImageUploader({
  onComplete,
  postMode = "carousel",
  onPostModeChange,
  existingImages,
  headlineMode = "all",
  onHeadlineModeChange,
  slideCount = 5,
  onSlideCountChange,
}: ImageUploaderProps) {
  // Seed from existing project images when navigating back
  const [images, setImages] = useState<LocalImage[]>(() => {
    if (existingImages && existingImages.length > 0) {
      return existingImages.map((img) => ({
        id: img.id,
        file: new File([], img.filename, { type: "image/jpeg" }),
        previewUrl: img.url, // already a base64 data URI
      }));
    }
    return [];
  });
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
  const prevImageCountRef = useRef(0);

  // Auto-select "single" when only one image is loaded; restore to "carousel" when 2+
  useEffect(() => {
    const prev = prevImageCountRef.current;
    prevImageCountRef.current = images.length;
    if (images.length === 1 && postMode !== "single") {
      onPostModeChange?.("single");
    } else if (images.length >= 2 && prev === 1) {
      onPostModeChange?.("carousel");
    }
  }, [images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep slide count in sync with uploaded image count (clamped to 2-12)
  useEffect(() => {
    if (postMode === "carousel" && images.length >= 2) {
      const clamped = Math.max(2, Math.min(12, images.length));
      if (clamped !== slideCount) {
        onSlideCountChange?.(clamped);
      }
    }
  }, [images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newErrors: string[] = [];
    const validImages: LocalImage[] = [];
    const processQueue: { file: File; isHeic: boolean }[] = [];

    // Phase 1: Categorize files
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name}: File exceeds 10 MB limit.`);
      } else if (isHeicFile(file)) {
        processQueue.push({ file, isHeic: true });
      } else if (isAcceptedImageFile(file)) {
        processQueue.push({ file, isHeic: false });
      } else {
        newErrors.push(`${file.name}: Unsupported format. Use JPEG, PNG, WebP, AVIF, or HEIC.`);
      }
    });

    if (processQueue.length === 0 && newErrors.length > 0) {
      setErrors(newErrors);
      toast.error(`${newErrors.length} file${newErrors.length !== 1 ? "s" : ""} rejected`, {
        description: newErrors[0],
      });
      return;
    }

    // Phase 2: Process all files (resize standard, convert+resize HEIC)
    const needsConversion = processQueue.filter((q) => q.isHeic);
    if (needsConversion.length > 0 || processQueue.length > 3) {
      setConversionState({
        open: true,
        total: processQueue.length,
        completed: 0,
        currentFile: processQueue[0].file.name,
      });
    }

    let convertedCount = 0;
    for (let i = 0; i < processQueue.length; i++) {
      const { file, isHeic } = processQueue[i];
      setConversionState((prev) =>
        prev ? { ...prev, currentFile: file.name, completed: i } : prev
      );

      try {
        let jpegBlob: Blob | null = null;

        if (isHeic) {
          // HEIC: try native decode (Safari), then server fallback
          jpegBlob = await convertHeicFile(file);
          convertedCount++;
        } else {
          // Standard format: resize client-side via Canvas
          jpegBlob = await resizeImageClientSide(file);
        }

        if (jpegBlob && jpegBlob.size > 0) {
          const outName = file.name.replace(/\.[^.]+$/, ".jpg");
          validImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file: new File([jpegBlob], outName, { type: "image/jpeg" }),
            previewUrl: URL.createObjectURL(jpegBlob),
          });
        } else {
          // Canvas couldn't decode (rare) — use original file as-is
          validImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            previewUrl: URL.createObjectURL(file),
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        newErrors.push(`${file.name}: ${msg}`);
      }
    }

    setConversionState(null);

    // Phase 3: Apply results
    setErrors(newErrors);
    if (newErrors.length > 0) {
      toast.error(`${newErrors.length} file${newErrors.length !== 1 ? "s" : ""} rejected`, {
        description: newErrors[0] + (newErrors.length > 1 ? ` (+${newErrors.length - 1} more)` : ""),
      });
    }
    if (validImages.length > 0) {
      setImages((prev) => [...prev, ...validImages]);
      if (convertedCount > 0) {
        toast.success(
          `${convertedCount} HEIC image${convertedCount !== 1 ? "s" : ""} converted`,
          { description: "Converted to JPEG for compatibility." }
        );
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
      // to server actions and can be sent to external APIs.
      // Images are already resized to max 2048px during upload, so this is fast.
      const { blobUrlToBase64, generateThumbnail } = await import("@/lib/utils");

      // Process sequentially to avoid memory spikes on mobile
      const uploaded: UploadedImage[] = [];
      for (const img of images) {
        const isAlreadyBase64 = img.previewUrl.startsWith("data:");
        const fullUrl = isAlreadyBase64 ? img.previewUrl : await blobUrlToBase64(img.previewUrl);
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateThumbnail(fullUrl);
        } catch {
          // Fall back to full-res if thumbnail generation fails
        }
        uploaded.push({
          id: img.id,
          url: fullUrl,
          thumbnailUrl,
          filename: img.file.name,
          uploadedAt: new Date().toISOString(),
          usedInSlides: [],
        });
      }
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
            JPEG, PNG, WebP, AVIF, or HEIC up to 10 MB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/tiff,image/bmp,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.tif,.tiff,.bmp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {err}
            </div>
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
                    aria-label={`Remove ${img.file.name}`}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 sm:opacity-0 transition-opacity [@media(hover:hover)]:hover:bg-black/80 sm:group-hover:opacity-100"
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

          {/* Post Type — fades in once images are displayed */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div
                key="post-type"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Post Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { mode: "carousel" as PostMode, label: "Carousel", description: "Multi-slide storytelling", icon: Layers },
                        { mode: "single" as PostMode, label: "Single Post", description: "One image, one story", icon: ImageIcon },
                      ]).map(({ mode, label, description, icon: Icon }) => {
                        const isSelected = postMode === mode;
                        const isDisabled = mode === "carousel" && images.length === 1;
                        return (
                          <button
                            key={mode}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onPostModeChange?.(mode)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
                              isDisabled && "cursor-not-allowed opacity-40",
                              !isDisabled && isSelected && "border-purple-500 bg-purple-500/10 shadow-sm",
                              !isDisabled && !isSelected && "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                            )}
                          >
                            <Icon className={cn("h-6 w-6", isSelected && !isDisabled ? "text-purple-400" : "text-muted-foreground")} />
                            <div>
                              <p className={cn("text-sm font-medium", isSelected && !isDisabled ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                              <p className="text-xs text-muted-foreground">{description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {images.length === 1 && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">Upload more images to create a carousel</p>
                    )}

                    {/* Text Overlays */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Text Overlays</p>
                      </div>
                      <div className="flex gap-1">
                        {([
                          { value: "all" as HeadlineMode, label: "All slides" },
                          { value: "first_only" as HeadlineMode, label: "First slide only" },
                          { value: "none" as HeadlineMode, label: "Off" },
                        ]).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onHeadlineModeChange?.(value)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              headlineMode === value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {headlineMode === "all" && `Headlines generated on all ${slideCount} slide${slideCount !== 1 ? "s" : ""}`}
                        {headlineMode === "first_only" && "Title card on slide 1, photos only after"}
                        {headlineMode === "none" && "No headline text, images only"}
                      </p>

                      {/* Slide count (carousel only) */}
                      {postMode === "carousel" && images.length > 1 && (
                        <div className="mt-2">
                          <SlideCountSelector
                            value={slideCount}
                            onChange={(count) => onSlideCountChange?.(count)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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
              Converting HEIC images to JPEG for browser compatibility. Please wait, this may take a moment.
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
            <p className="text-xs text-muted-foreground/70 text-center">
              This dialog will close automatically when done.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
