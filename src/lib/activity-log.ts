/**
 * Activity Log — Client-side action tracking in IndexedDB.
 *
 * Stores user actions with timestamps for download/export.
 * Uses the same IndexedDB database as draft-storage.
 * Max 1000 entries — auto-prunes oldest when exceeded.
 */

import type { ActivityAction, ActivityLogEntry } from "./types";
import { openDraftDB, ACTIVITY_STORE } from "./draft-storage";

const MAX_ENTRIES = 1000;

// -----------------------------------------------------------------------------
// Action Labels (human-readable)
// -----------------------------------------------------------------------------

const ACTION_LABELS: Record<ActivityAction, string> = {
  draft_created: "Created draft",
  draft_resumed: "Resumed draft",
  draft_discarded: "Discarded draft",
  draft_switched: "Switched draft",
  carousel_generated: "Generated carousel",
  post_exported: "Exported post",
  video_exported: "Exported video reel",
  audio_added: "Added audio",
  audio_removed: "Removed audio",
  settings_saved: "Saved settings",
  project_reset: "Reset project",
  images_uploaded: "Uploaded images",
  publish_completed: "Published content",
};

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------

/**
 * Logs an activity entry to IndexedDB.
 * Fire-and-forget — never throws.
 */
export async function logActivity(
  action: ActivityAction,
  details?: string,
  draftId?: string,
  draftName?: string
): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(ACTIVITY_STORE, "readwrite");
    const store = tx.objectStore(ACTIVITY_STORE);

    const entry: Omit<ActivityLogEntry, "id"> = {
      timestamp: new Date().toISOString(),
      action,
      details: details || ACTION_LABELS[action],
      draftId,
      draftName,
    };

    store.add(entry);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Prune if over max entries
    await pruneOldEntries();
  } catch {
    // Fire and forget — never break the app
  }
}

// -----------------------------------------------------------------------------
// Reading
// -----------------------------------------------------------------------------

/**
 * Returns activity log entries sorted by timestamp (newest first).
 */
export async function getActivityLog(
  limit: number = 100
): Promise<ActivityLogEntry[]> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(ACTIVITY_STORE, "readonly");
    const store = tx.objectStore(ACTIVITY_STORE);

    const all: ActivityLogEntry[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });

    return all
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Returns the total number of activity log entries.
 */
export async function getActivityCount(): Promise<number> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(ACTIVITY_STORE, "readonly");
    const store = tx.objectStore(ACTIVITY_STORE);

    const count: number = await new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return count;
  } catch {
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Clearing
// -----------------------------------------------------------------------------

/**
 * Clears all activity log entries.
 */
export async function clearActivityLog(): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(ACTIVITY_STORE, "readwrite");
    tx.objectStore(ACTIVITY_STORE).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

// -----------------------------------------------------------------------------
// Pruning
// -----------------------------------------------------------------------------

async function pruneOldEntries(): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(ACTIVITY_STORE, "readwrite");
    const store = tx.objectStore(ACTIVITY_STORE);

    const count: number = await new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (count <= MAX_ENTRIES) return;

    // Get all entries, sort, delete oldest
    const all: ActivityLogEntry[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });

    all.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Delete everything beyond MAX_ENTRIES
    const toDelete = all.slice(MAX_ENTRIES);
    for (const entry of toDelete) {
      store.delete(entry.id);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

// -----------------------------------------------------------------------------
// Export Formats
// -----------------------------------------------------------------------------

/**
 * Exports activity log entries as CSV.
 */
export function exportActivityAsCSV(entries: ActivityLogEntry[]): string {
  const header = "Timestamp,Action,Details,Draft ID,Draft Name";
  const rows = entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString();
    const details = `"${(e.details || "").replace(/"/g, '""')}"`;
    const name = `"${(e.draftName || "").replace(/"/g, '""')}"`;
    return `${ts},${e.action},${details},${e.draftId || ""},${name}`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Exports activity log entries as JSON.
 */
export function exportActivityAsJSON(entries: ActivityLogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/**
 * Triggers a browser file download.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
