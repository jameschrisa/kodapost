"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { KodaPostIcon } from "@/components/icons";

// =============================================================================
// Preview Page — /preview/[jobId]
//
// Public page for viewing generated carousels shared via Telegram bot links.
// Fetches the completed job result and displays slides in a carousel viewer
// with download capability.
// =============================================================================

interface SlideData {
  platform: string;
  slideIndex: number;
  imageBase64: string;
  format: "jpeg" | "png";
}

interface JobResult {
  caption: string | null;
  slides: SlideData[];
  slideCount: number;
  platforms: string[];
}

interface JobData {
  jobId: string;
  status: string;
  result?: JobResult;
  error?: string;
}

export default function PreviewPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [captionCopied, setCaptionCopied] = useState(false);

  // Fetch job data
  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/preview/${jobId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError(
              "Carousel not found. It may have expired (carousels are available for 1 hour after generation)."
            );
          } else {
            setError("Failed to load carousel. Please try again.");
          }
          return;
        }
        const json = await response.json();
        setData(json);
      } catch {
        setError("Failed to load carousel. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    if (jobId) fetchJob();
  }, [jobId]);

  const slides = data?.result?.slides || [];
  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  function downloadSlide(slide: SlideData) {
    const link = document.createElement("a");
    link.href = `data:image/${slide.format};base64,${slide.imageBase64}`;
    link.download = `kodapost-slide-${slide.slideIndex + 1}.${slide.format}`;
    link.click();
  }

  function downloadAll() {
    slides.forEach((slide) => downloadSlide(slide));
  }

  async function copyCaption() {
    if (!data?.result?.caption) return;
    try {
      await navigator.clipboard.writeText(data.result.caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = data.result.caption;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading your carousel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <KodaPostIcon className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Carousel Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Create your own with KodaPost
          </a>
        </div>
      </div>
    );
  }

  if (!data?.result || slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">No Slides Found</h1>
          <p className="text-muted-foreground">
            This carousel doesn&apos;t have any generated slides yet.
          </p>
        </div>
      </div>
    );
  }

  const current = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KodaPostIcon className="h-5 w-5" />
            <span className="font-semibold text-sm">KodaPost</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSlide(current)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Save Slide
            </button>
            {totalSlides > 1 && (
              <button
                onClick={downloadAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white hover:opacity-90 transition-opacity"
              >
                <Download className="h-3.5 w-3.5" />
                Save All
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Carousel Viewer */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Slide viewer */}
          <div className="relative">
            {/* Navigation arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </>
            )}

            {/* Slide image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-[4/5] max-w-md mx-auto rounded-lg overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/${current.format};base64,${current.imageBase64}`}
                  alt={`Slide ${currentSlide + 1} of ${totalSlides}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Slide indicator dots */}
            {totalSlides > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "w-6 bg-purple-500"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Caption section */}
          {data.result.caption && (
            <div className="max-w-md mx-auto">
              <div className="border border-border/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Caption</h3>
                  <button
                    onClick={copyCaption}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {captionCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {data.result.caption}
                </p>
              </div>
            </div>
          )}

          {/* Info bar */}
          <div className="max-w-md mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              {totalSlides} slide{totalSlides !== 1 ? "s" : ""} &middot;{" "}
              {data.result.platforms.join(", ")} &middot; Generated by KodaPost
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <KodaPostIcon className="h-4 w-4" />
            Create your own carousel with KodaPost
          </a>
        </div>
      </footer>
    </div>
  );
}
