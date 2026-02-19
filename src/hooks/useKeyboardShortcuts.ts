"use client";

import { useEffect } from "react";

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

      // Cmd/Ctrl + S — Save
      if (mod && e.key === "s") {
        e.preventDefault();
        config.onSave?.();
        return;
      }

      // Cmd/Ctrl + Enter — Generate
      if (mod && e.key === "Enter") {
        e.preventDefault();
        config.onGenerate?.();
        return;
      }

      // Skip arrow keys and escape when focused on an input
      if (isInputFocused()) return;

      // Arrow keys for slide navigation
      if (e.key === "ArrowLeft") {
        config.onPreviousSlide?.();
        return;
      }
      if (e.key === "ArrowRight") {
        config.onNextSlide?.();
        return;
      }

      // Escape — go back
      if (e.key === "Escape") {
        config.onEscape?.();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}
