"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Amber banner shown when an admin is viewing the app in "standard user" mode.
 * Provides a quick way to switch back to admin view.
 */
export function AdminViewBanner() {
  const { isActualAdmin, adminViewMode, setAdminViewMode } = useUserRole();

  // Only show when an actual admin is in user view mode
  if (!isActualAdmin || adminViewMode !== "user") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-4 overflow-hidden"
      >
        <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-amber-900/30 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-amber-200">
              Viewing as Standard User
            </span>
            <Button
              variant="link"
              size="sm"
              className="ml-auto h-auto p-0 text-amber-300 hover:text-amber-100"
              onClick={() => setAdminViewMode("admin")}
            >
              Switch to Admin
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
