"use client";

/**
 * ProjectsView — Full-page project management tab.
 *
 * Provides a dedicated view for managing saved drafts with Continue,
 * Delete, and Rename actions. Respects plan-based draft limits and
 * expiration.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Crown,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/motion";
import type { DraftMetadata } from "@/lib/types";

// ---------------------------------------------------------------------------
// Step Labels
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<string, string> = {
  upload: "Upload",
  configure: "Configure",
  edit: "Design",
  review: "Review",
  publish: "Publish",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProjectsViewProps {
  drafts: DraftMetadata[];
  activeDraftId: string | null;
  draftLimit: number;
  planName: string;
  onContinue: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onNewProject: () => void;
  onRename: (draftId: string, newName: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectsView({
  drafts,
  activeDraftId,
  draftLimit,
  planName,
  onContinue,
  onDelete,
  onNewProject,
  onRename,
}: ProjectsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = drafts.length >= draftLimit;

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = useCallback((draft: DraftMetadata) => {
    setEditName(draft.name);
    setEditingId(draft.id);
  }, []);

  const commitName = useCallback(
    (draftId: string) => {
      const trimmed = editName.trim() || "Untitled Project";
      onRename(draftId, trimmed);
      setEditingId(null);
    },
    [editName, onRename]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, draftId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName(draftId);
      } else if (e.key === "Escape") {
        setEditingId(null);
      }
    },
    [commitName]
  );

  // -- Empty state --
  if (drafts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 mb-6">
          <FolderOpen className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create your first project to get started.
        </p>
        <Button
          onClick={onNewProject}
          className="gap-2 bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {drafts.length}/{draftLimit} projects
          </p>
        </div>
        <Button
          onClick={onNewProject}
          disabled={atLimit}
          className="gap-2 bg-purple-600 hover:bg-purple-500"
        >
          {atLimit ? (
            <>
              <Crown className="h-4 w-4 text-amber-400" />
              Upgrade for more
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Project
            </>
          )}
        </Button>
      </motion.div>

      {/* Project cards */}
      <AnimatePresence>
        {drafts.map((draft) => {
          const isActive = draft.id === activeDraftId;
          const expiryDays = daysUntilExpiry(draft.expiresAt);
          const isExpiringSoon =
            expiryDays !== null && expiryDays <= 3 && expiryDays > 0;
          const isConfirmingDelete = confirmDeleteId === draft.id;

          return (
            <motion.div
              key={draft.id}
              variants={staggerItemVariants}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              layout
            >
              <Card
                className={
                  isActive
                    ? "border-purple-500/40 bg-purple-500/5"
                    : "border-border/50 bg-muted/30"
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Folder icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                      <FolderOpen className="h-5 w-5 text-purple-400" />
                    </div>

                    {/* Name + metadata */}
                    <div className="flex-1 min-w-0">
                      {editingId === draft.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, draft.id)}
                            onBlur={() => commitName(draft.id)}
                            className="h-7 flex-1 min-w-0 rounded border border-purple-500/30 bg-transparent px-2 text-sm font-medium outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                            maxLength={60}
                          />
                          <button
                            type="button"
                            onClick={() => commitName(draft.id)}
                            className="shrink-0 rounded p-0.5 text-purple-400 hover:text-purple-300 transition-colors"
                            aria-label="Save name"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(draft)}
                          className="group flex items-center gap-1.5 text-left"
                        >
                          <span className="text-sm font-medium truncate">
                            {draft.name}
                          </span>
                          <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                        </button>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(draft.updatedAt)}
                        </span>
                        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                          {STEP_LABELS[draft.step] || draft.step}
                        </span>
                        {draft.slideCount > 0 && (
                          <span>
                            {draft.slideCount} slide
                            {draft.slideCount !== 1 && "s"}
                          </span>
                        )}
                        {draft.imageCount > 0 && (
                          <span>
                            {draft.imageCount} image
                            {draft.imageCount !== 1 && "s"}
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Expires in {expiryDays}d
                          </span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isConfirmingDelete ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => {
                              onDelete(draft.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Confirm
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDeleteId(draft.id)}
                            aria-label="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500"
                            onClick={() => onContinue(draft.id)}
                          >
                            Continue
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Plan limit prompt */}
      {atLimit && (
        <motion.p
          variants={staggerItemVariants}
          className="text-center text-xs text-muted-foreground pt-2"
        >
          You&apos;ve reached the {draftLimit}-project limit on the{" "}
          <span className="font-medium text-purple-400">{planName}</span> plan.
          Upgrade for more projects.
        </motion.p>
      )}
    </motion.div>
  );
}
