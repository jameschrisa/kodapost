"use client";

/**
 * DraftListPanel — Shows all user drafts with plan-aware limits.
 *
 * Replaces the single SavedDraftCard on the Upload step. Displays a list
 * of draft cards with name, step badge, timestamps, and actions.
 * Gated "New Draft" button shows upgrade prompt when limit is reached.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  FileText,
  Pencil,
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/motion";
import type { DraftMetadata } from "@/lib/types";

// -----------------------------------------------------------------------------
// Step Labels
// -----------------------------------------------------------------------------

const STEP_LABELS: Record<string, string> = {
  upload: "Upload",
  configure: "Configure",
  edit: "Editorial",
  review: "Finalize",
  publish: "Publish",
};

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface DraftListPanelProps {
  /** All drafts metadata (sorted by updatedAt desc from storage) */
  drafts: DraftMetadata[];
  /** Currently active draft ID (highlighted) */
  activeDraftId: string | null;
  /** Maximum drafts allowed by plan */
  draftLimit: number;
  /** Plan display name for upgrade prompt */
  planName: string;
  /** Called when user clicks Resume on a draft */
  onResume: (draftId: string) => void;
  /** Called when user clicks Delete on a draft */
  onDelete: (draftId: string) => void;
  /** Called when user clicks New Draft */
  onNewDraft: () => void;
  /** Called when user renames a draft */
  onRename: (draftId: string, newName: string) => void;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DraftListPanel({
  drafts,
  activeDraftId,
  draftLimit,
  planName,
  onResume,
  onDelete,
  onNewDraft,
  onRename,
}: DraftListPanelProps) {
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

  if (drafts.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="mb-4 space-y-2"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="flex items-center justify-between"
      >
        <h3 className="text-sm font-medium text-muted-foreground">
          Your Drafts ({drafts.length}/{draftLimit})
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs"
          onClick={onNewDraft}
          disabled={atLimit}
        >
          {atLimit ? (
            <>
              <Crown className="h-3 w-3 text-amber-400" />
              Upgrade for more
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              New Draft
            </>
          )}
        </Button>
      </motion.div>

      {/* Draft cards */}
      <AnimatePresence>
        {drafts.map((draft) => {
          const isActive = draft.id === activeDraftId;
          const expiryDays = daysUntilExpiry(draft.expiresAt);
          const isExpiringSoon = expiryDays !== null && expiryDays <= 3 && expiryDays > 0;
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
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                      <FileText className="h-3.5 w-3.5 text-purple-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Editable name */}
                      {editingId === draft.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, draft.id)}
                            onBlur={() => commitName(draft.id)}
                            className="h-6 flex-1 min-w-0 rounded border border-purple-500/30 bg-transparent px-1.5 text-sm font-medium outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                            maxLength={60}
                          />
                          <button
                            type="button"
                            onClick={() => commitName(draft.id)}
                            className="shrink-0 rounded p-0.5 text-purple-400 hover:text-purple-300 transition-colors"
                            aria-label="Save name"
                          >
                            <Check className="h-3.5 w-3.5" />
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
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(draft.updatedAt)}
                        </span>
                        <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400">
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
                          <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConfirmingDelete ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
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
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDeleteId(draft.id)}
                            aria-label="Delete draft"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          {!isActive && (
                            <Button
                              size="sm"
                              className="h-7 gap-1 text-xs bg-purple-600 hover:bg-purple-500"
                              onClick={() => onResume(draft.id)}
                            >
                              <Play className="h-3 w-3" />
                              Resume
                            </Button>
                          )}
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

      {/* Plan limit upgrade prompt */}
      {atLimit && (
        <motion.p
          variants={staggerItemVariants}
          className="text-center text-xs text-muted-foreground"
        >
          You&apos;ve reached the {draftLimit}-draft limit on the{" "}
          <span className="font-medium text-purple-400">{planName}</span> plan.
          Upgrade for more drafts.
        </motion.p>
      )}
    </motion.div>
  );
}
