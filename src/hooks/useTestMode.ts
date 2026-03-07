"use client";

/**
 * React hook for Test Mode — admin-only debug logging toggle.
 *
 * Provides state, toggle, and download actions.
 * Restores test mode from localStorage on mount.
 */

import { useState, useEffect, useCallback } from "react";
import {
  isTestModeEnabled,
  enableTestMode,
  disableTestMode,
  restoreTestMode,
  downloadLog,
  clearLog,
  getLogCount,
} from "@/lib/test-mode";

export function useTestMode() {
  const [enabled, setEnabled] = useState(false);
  const [logCount, setLogCount] = useState(0);

  // Restore on mount
  useEffect(() => {
    restoreTestMode();
    setEnabled(isTestModeEnabled());
  }, []);

  // Poll log count while enabled (lightweight — just reads array length)
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setLogCount(getLogCount());
    }, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  const toggle = useCallback(() => {
    if (isTestModeEnabled()) {
      disableTestMode();
      setEnabled(false);
      setLogCount(0);
    } else {
      enableTestMode();
      setEnabled(true);
    }
  }, []);

  const download = useCallback(() => {
    downloadLog();
  }, []);

  const clear = useCallback(() => {
    clearLog();
    setLogCount(1); // "Log cleared" entry
  }, []);

  return { enabled, logCount, toggle, download, clear };
}
