"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLoadingStore } from "@/lib/stores/loading-store";

export function ApiProgressBar() {
  const isLoading = useLoadingStore((s) => s.isLoading());
  const currentLabel = useLoadingStore((s) => s.currentLabel());
  const [showLabel, setShowLabel] = useState(false);

  // Delay label appearance by 500ms to avoid flash on fast calls
  useEffect(() => {
    if (!isLoading) {
      setShowLabel(false);
      return;
    }
    const timer = setTimeout(() => setShowLabel(true), 500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="api-progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
        >
          {/* Progress bar track */}
          <div className="h-[3px] w-full overflow-hidden">
            <motion.div
              className="h-full w-[200%] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500"
              animate={{ x: ["-50%", "0%"] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Label pill */}
          <AnimatePresence>
            {showLabel && currentLabel && (
              <motion.div
                key="label"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="absolute right-4 top-1 flex items-center gap-1.5 rounded-full bg-purple-500/90 px-3 py-1 text-[11px] font-medium text-white shadow-lg"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
                {currentLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
