"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AutomationIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kodapost:assistant-preference";

interface AssistantBannerProps {
  onEnable: () => void;
}

export function AssistantBanner({ onEnable }: AssistantBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const preference = localStorage.getItem(STORAGE_KEY);
      if (!preference) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleEnable = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "enabled");
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
    onEnable();
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-6 overflow-hidden"
        >
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950 via-fuchsia-950 to-purple-900 p-4 sm:p-5">
            {/* Top row: icon + dismiss */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:items-center">
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <AutomationIcon className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    Try Production Assistant Mode
                  </h3>
                  <p className="mt-1 text-sm text-purple-200/80">
                    Send pictures, record a short audio message, or type what you
                    want. The assistant will produce your carousel and send you a
                    preview to approve before posting.
                  </p>
                </div>
              </div>

              {/* Dismiss X */}
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-md p-1 text-purple-300/50 transition-colors hover:text-white"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions row */}
            <div className="mt-4 flex items-center gap-4 pl-0 sm:pl-[52px]">
              <Button
                size="sm"
                onClick={handleEnable}
                className="gap-1.5 bg-white text-purple-950 hover:bg-purple-100"
              >
                <AutomationIcon className="h-3.5 w-3.5" />
                Enable
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-sm text-purple-300/70 hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Check if assistant mode is enabled from localStorage */
export function isAssistantEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "enabled";
  } catch {
    return false;
  }
}

/** Toggle assistant mode preference */
export function setAssistantPreference(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "enabled" : "dismissed");
  } catch {
    // localStorage unavailable
  }
}
