"use client";

import { useEffect, useState } from "react";
import { Clock, FileText, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadProject,
  loadProjectName,
  loadProjectSavedAt,
  loadStep,
  clearProject,
} from "@/lib/storage";

const STEP_LABELS: Record<string, string> = {
  upload: "Upload",
  configure: "Configure",
  edit: "Editorial",
  review: "Finalize",
  publish: "Publish",
};

interface SavedDraftCardProps {
  /** Called when user clicks "Resume" to restore the saved project */
  onResume: () => void;
  /** Called when user clicks "Discard" to clear the draft */
  onDiscard: () => void;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function SavedDraftCard({ onResume, onDiscard }: SavedDraftCardProps) {
  const [draft, setDraft] = useState<{
    name: string;
    step: string;
    savedAt: string;
    slideCount: number;
    imageCount: number;
  } | null>(null);

  useEffect(() => {
    const project = loadProject();
    if (!project) return;

    // Only show if the project has meaningful progress (past upload step or has images)
    const step = loadStep();
    const hasImages = project.uploadedImages.some((img) => img.url.length > 0);
    const hasSlides = project.slides.length > 0;
    if (step === "upload" && !hasImages && !hasSlides) return;

    const name = loadProjectName() || "Untitled Project";
    const savedAt = loadProjectSavedAt();
    if (!savedAt) return;

    setDraft({
      name,
      step,
      savedAt,
      slideCount: project.slides.length,
      imageCount: project.uploadedImages.length,
    });
  }, []);

  if (!draft) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{draft.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(draft.savedAt)}
                </span>
                <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400">
                  {STEP_LABELS[draft.step] || draft.step}
                </span>
                {draft.slideCount > 0 && (
                  <span>
                    {draft.slideCount} slide{draft.slideCount !== 1 && "s"}
                  </span>
                )}
                {draft.imageCount > 0 && (
                  <span>
                    {draft.imageCount} image{draft.imageCount !== 1 && "s"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  clearProject();
                  onDiscard();
                  setDraft(null);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Discard
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500"
                onClick={onResume}
              >
                <Play className="h-3 w-3" />
                Resume
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
