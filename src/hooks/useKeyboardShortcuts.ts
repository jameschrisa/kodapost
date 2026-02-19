"use client";

import { useEffect, useRef } from "react";

interface ShortcutConfig {
  /** Ctrl/Cmd + S — Save project */
  onSave?: () => void;
  /** Ctrl/Cmd + Enter — Generate / Continue */
  onGenerate?: () => void;
  /** Left arrow — Previous slide (when not in an input) */
  onPreviousSlide?: () => void;
  /** Right arrow — Next slide (when not in an input) */
  onNextSlide?: () => void;
  /** Escape — Go back / close dialog */
  onEscape?: () => void;
}

/**
 * Registers global keyboard shortcuts for the builder workflow.
 * Automatically handles Cmd (Mac) vs Ctrl (Windows/Linux).
 * All shortcuts are ignored when the user is focused on an input/textarea.
 */
export function useKeyboardShortcuts(config: ShortcutConfig) {
  const configRef = useRef(config);

  // Keep the ref up to date without re-attaching the listener
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    function isInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (el as HTMLElement).isContentEditable
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const cfg = configRef.current;

      // Cmd/Ctrl + S — Save
      if (mod && e.key === "s") {
        e.preventDefault();
        cfg.onSave?.();
        return;
      }

      // Cmd/Ctrl + Enter — Generate
      if (mod && e.key === "Enter") {
        e.preventDefault();
        cfg.onGenerate?.();
        return;
      }

      // Skip arrow keys and escape when focused on an input
      if (isInputFocused()) return;

      // Arrow keys for slide navigation
      if (e.key === "ArrowLeft") {
        cfg.onPreviousSlide?.();
        return;
      }
      if (e.key === "ArrowRight") {
        cfg.onNextSlide?.();
        return;
      }

      // Escape — go back
      if (e.key === "Escape") {
        cfg.onEscape?.();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Stable — only attaches once
}
