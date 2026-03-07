"use client";

import { useCallback, useRef } from "react";
import type { CarouselProject } from "@/lib/types";

/**
 * Strips large binary data (base64 image URLs) from a project snapshot
 * to keep undo/redo memory usage reasonable. Only metadata is retained.
 */
function stripImageData(project: CarouselProject): CarouselProject {
  return {
    ...project,
    uploadedImages: project.uploadedImages.map((img) => ({
      ...img,
      url: "", // Strip base64/blob URL data
      thumbnailUrl: undefined,
    })),
    slides: project.slides.map((slide) => ({
      ...slide,
      imageUrl: undefined, // Strip slide image data
      thumbnailUrl: undefined,
    })),
  };
}

/**
 * Produces a stable JSON string for structural comparison.
 * Used to detect duplicate consecutive states.
 */
function snapshotKey(project: CarouselProject): string {
  return JSON.stringify(stripImageData(project));
}

export interface UndoRedoState {
  /** Push a new project state onto the undo stack */
  pushState: (project: CarouselProject) => void;
  /** Undo the last change, returning the previous project snapshot (stripped of images) */
  undo: () => CarouselProject | null;
  /** Redo a previously undone change, returning the snapshot (stripped of images) */
  redo: () => CarouselProject | null;
  /** Whether undo is available */
  canUndo: () => boolean;
  /** Whether redo is available */
  canRedo: () => boolean;
  /** Clear the entire undo/redo history (e.g., when switching drafts) */
  clear: () => void;
}

/**
 * Hook that manages an undo/redo stack for CarouselProject snapshots.
 *
 * Stores stripped snapshots (no image base64 data) to save memory.
 * When restoring, the caller must re-attach live image URLs from the
 * current project state.
 *
 * @param maxHistory Maximum number of undo states to retain (default 20)
 */
export function useUndoRedo(maxHistory: number = 20): UndoRedoState {
  // Use refs so the stack is mutable without causing re-renders
  const undoStack = useRef<CarouselProject[]>([]);
  const redoStack = useRef<CarouselProject[]>([]);
  const lastKey = useRef<string>("");

  const pushState = useCallback(
    (project: CarouselProject) => {
      const key = snapshotKey(project);

      // Skip if structurally identical to the last pushed state
      if (key === lastKey.current) return;

      const stripped = stripImageData(project);
      undoStack.current.push(stripped);

      // Trim oldest entries if over the limit
      if (undoStack.current.length > maxHistory) {
        undoStack.current = undoStack.current.slice(-maxHistory);
      }

      // Any new change invalidates the redo stack
      redoStack.current = [];
      lastKey.current = key;
    },
    [maxHistory]
  );

  const undo = useCallback((): CarouselProject | null => {
    if (undoStack.current.length < 2) return null;

    // Pop the current state and move it to redo
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);

    // The new top of the undo stack is the state to restore
    const previous = undoStack.current[undoStack.current.length - 1];
    lastKey.current = JSON.stringify(previous);
    return previous;
  }, []);

  const redo = useCallback((): CarouselProject | null => {
    if (redoStack.current.length === 0) return null;

    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    lastKey.current = JSON.stringify(next);
    return next;
  }, []);

  const canUndo = useCallback(() => undoStack.current.length >= 2, []);
  const canRedo = useCallback(() => redoStack.current.length > 0, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    lastKey.current = "";
  }, []);

  return { pushState, undo, redo, canUndo, canRedo, clear };
}
