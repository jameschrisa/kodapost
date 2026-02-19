"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock, FileText, Pencil, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadProject,
  loadProjectName,
  loadProjectSavedAt,
  loadStep,
  saveProjectName,
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

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function startEditing() {
    if (!draft) return;
    setEditName(draft.name);
    setIsEditing(true);
  }

  function commitName() {
    if (!draft) return;
    const trimmed = editName.trim() || "Untitled Project";
    saveProjectName(trimmed);
    setDraft({ ...draft, name: trimmed });
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  }

  if (!draft) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-4"
    >
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Editable project name */}
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commitName}
                    className="h-6 flex-1 min-w-0 rounded border border-purple-500/30 bg-transparent px-1.5 text-sm font-medium outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                    maxLength={60}
                  />
                  <button
                    type="button"
                    onClick={commitName}
                    className="shrink-0 rounded p-0.5 text-purple-400 hover:text-purple-300 transition-colors"
                    aria-label="Save name"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="group flex items-center gap-1.5 text-left"
                >
                  <span className="text-sm font-medium truncate">
                    {draft.name}
                  </span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                </button>
              )}

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
