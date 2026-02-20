"use client";

/**
 * AdvancedSettingsDialog — Activity log viewer and storage management.
 *
 * Allows users to:
 * - View recent activity log entries
 * - Download activity as CSV or JSON
 * - Clear activity log
 * - View draft storage summary
 */

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  FileJson,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getActivityLog,
  getActivityCount,
  clearActivityLog,
  exportActivityAsCSV,
  exportActivityAsJSON,
  downloadFile,
} from "@/lib/activity-log";
import type { ActivityLogEntry } from "@/lib/types";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface AdvancedSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// -----------------------------------------------------------------------------
// Action Display Names
// -----------------------------------------------------------------------------

const ACTION_DISPLAY: Record<string, { label: string; color: string }> = {
  draft_created: { label: "Created draft", color: "text-green-400" },
  draft_resumed: { label: "Resumed draft", color: "text-blue-400" },
  draft_discarded: { label: "Discarded draft", color: "text-red-400" },
  draft_switched: { label: "Switched draft", color: "text-purple-400" },
  carousel_generated: { label: "Generated carousel", color: "text-emerald-400" },
  post_exported: { label: "Exported post", color: "text-cyan-400" },
  video_exported: { label: "Exported video", color: "text-indigo-400" },
  audio_added: { label: "Added audio", color: "text-amber-400" },
  audio_removed: { label: "Removed audio", color: "text-orange-400" },
  settings_saved: { label: "Saved settings", color: "text-gray-400" },
  project_reset: { label: "Reset project", color: "text-red-400" },
  images_uploaded: { label: "Uploaded images", color: "text-teal-400" },
  publish_completed: { label: "Published", color: "text-green-400" },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function AdvancedSettingsDialog({
  open,
  onOpenChange,
}: AdvancedSettingsDialogProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load activity log when dialog opens
  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
      return;
    }
    async function load() {
      const [log, count] = await Promise.all([
        getActivityLog(50),
        getActivityCount(),
      ]);
      setEntries(log);
      setTotalCount(count);
    }
    load();
  }, [open]);

  const handleDownloadCSV = useCallback(async () => {
    const all = await getActivityLog(MAX_EXPORT);
    const csv = exportActivityAsCSV(all);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `kodapost-activity-${date}.csv`, "text/csv");
    toast.success("Activity log downloaded", {
      description: `Exported ${all.length} entries as CSV.`,
    });
  }, []);

  const handleDownloadJSON = useCallback(async () => {
    const all = await getActivityLog(MAX_EXPORT);
    const json = exportActivityAsJSON(all);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(json, `kodapost-activity-${date}.json`, "application/json");
    toast.success("Activity log downloaded", {
      description: `Exported ${all.length} entries as JSON.`,
    });
  }, []);

  const handleClear = useCallback(async () => {
    await clearActivityLog();
    setEntries([]);
    setTotalCount(0);
    setConfirmClear(false);
    toast.info("Activity log cleared");
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Advanced Settings
          </DialogTitle>
          <DialogDescription>
            View your activity log and manage storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Activity Log Section ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Activity Log</h3>
              <span className="text-xs text-muted-foreground">
                {totalCount} action{totalCount !== 1 ? "s" : ""} logged
              </span>
            </div>

            {/* Recent entries */}
            {entries.length > 0 ? (
              <div className="max-h-64 overflow-y-auto rounded-md border border-border/50 bg-muted/30">
                {entries.slice(0, 20).map((entry) => {
                  const display = ACTION_DISPLAY[entry.action] || {
                    label: entry.action,
                    color: "text-muted-foreground",
                  };
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 px-3 py-2 border-b border-border/30 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${display.color}`}
                          >
                            {display.label}
                          </span>
                          {entry.draftName && (
                            <span className="text-xs text-muted-foreground truncate">
                              &middot; {entry.draftName}
                            </span>
                          )}
                        </div>
                        {entry.details !== display.label && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {entry.details}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                No activity logged yet.
              </div>
            )}

            {/* Download / Clear buttons */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={handleDownloadCSV}
                disabled={totalCount === 0}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Download CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={handleDownloadJSON}
                disabled={totalCount === 0}
              >
                <FileJson className="h-3.5 w-3.5" />
                Download JSON
              </Button>
              <div className="flex-1" />
              {confirmClear ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleClear}
                  >
                    Confirm Clear
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmClear(true)}
                  disabled={totalCount === 0}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Log
                </Button>
              )}
            </div>
          </div>

          {/* ── Storage Section ── */}
          <div className="border-t border-border/50 pt-4">
            <h3 className="text-sm font-medium mb-2">Storage</h3>
            <p className="text-xs text-muted-foreground">
              Drafts and images are stored locally in your browser using
              IndexedDB. Use &ldquo;Start Fresh&rdquo; in the main menu to clear
              all data.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const MAX_EXPORT = 1000;
