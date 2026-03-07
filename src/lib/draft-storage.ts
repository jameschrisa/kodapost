/**
 * Draft Storage — IndexedDB-based multi-draft persistence.
 *
 * Manages a `nostalgiaflow-drafts` database with two object stores:
 *  - `drafts`       — full project data (stripped of large blobs)
 *  - `draft-images`  — per-draft image base64 URLs
 *  - `activity-log`  — user activity log entries
 *
 * All operations are async and fail silently with console warnings.
 */

import type { CarouselProject, DraftMetadata } from "./types";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DB_NAME = "nostalgiaflow-drafts";
const DB_VERSION = 2;
const DRAFTS_STORE = "drafts";
const IMAGES_STORE = "draft-images";
const ACTIVITY_STORE = "activity-log";
const AUDIO_STORE = "draft-audio";

// -----------------------------------------------------------------------------
// Database Lifecycle
// -----------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function openDraftDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Drafts store — keyPath: id
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const store = db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Per-draft images — keyPath: compoundKey (draftId:imageId)
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        const imgStore = db.createObjectStore(IMAGES_STORE, { keyPath: "compoundKey" });
        imgStore.createIndex("draftId", "draftId", { unique: false });
      }

      // Activity log — autoIncrement id
      if (!db.objectStoreNames.contains(ACTIVITY_STORE)) {
        const logStore = db.createObjectStore(ACTIVITY_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        logStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Per-draft audio blobs — keyPath: draftId
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "draftId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// -----------------------------------------------------------------------------
// Storable Project (strip large blobs)
// -----------------------------------------------------------------------------

/**
 * Creates a lightweight version of the project for IndexedDB storage.
 * Strips base64 data URIs from images (stored separately in draft-images).
 */
function createStorableProject(project: CarouselProject): CarouselProject {
  return {
    ...project,
    uploadedImages: project.uploadedImages.map((img) => ({
      ...img,
      url: img.url.startsWith("data:") || img.url.startsWith("blob:") ? "" : img.url,
      thumbnailUrl: img.thumbnailUrl?.startsWith("data:") || img.thumbnailUrl?.startsWith("blob:") ? "" : img.thumbnailUrl,
    })),
    slides: project.slides.map((slide) => ({
      ...slide,
      imageUrl:
        slide.imageUrl?.startsWith("data:") || slide.imageUrl?.startsWith("blob:")
          ? ""
          : slide.imageUrl,
      thumbnailUrl:
        slide.thumbnailUrl?.startsWith("data:") || slide.thumbnailUrl?.startsWith("blob:")
          ? ""
          : slide.thumbnailUrl,
    })),
    audioClip: project.audioClip
      ? { ...project.audioClip, objectUrl: "" }
      : undefined,
  };
}

// -----------------------------------------------------------------------------
// Draft Record Type (internal)
// -----------------------------------------------------------------------------

interface DraftRecord {
  id: string;
  name: string;
  project: CarouselProject;
  step: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

// -----------------------------------------------------------------------------
// Draft CRUD
// -----------------------------------------------------------------------------

/**
 * Saves a draft to IndexedDB. Creates or updates.
 */
export async function saveDraft(
  id: string,
  project: CarouselProject,
  step: string,
  name: string,
  expiresAt: string | null = null
): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);

    // Check if draft already exists to preserve createdAt
    const existing: DraftRecord | undefined = await new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    const now = new Date().toISOString();
    const record: DraftRecord = {
      id,
      name,
      project: createStorableProject(project),
      step,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: expiresAt ?? existing?.expiresAt ?? null,
    };

    store.put(record);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to save draft:", err);
    throw err;
  }
}

/**
 * Loads a full draft (project data) from IndexedDB.
 */
export async function loadDraft(
  id: string
): Promise<{ project: CarouselProject; step: string; name: string } | null> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);

    const record: DraftRecord | undefined = await new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!record) return null;

    return {
      project: record.project,
      step: record.step,
      name: record.name,
    };
  } catch (err) {
    console.warn("[KodaPost] Failed to load draft:", err);
    return null;
  }
}

/**
 * Lists metadata for all drafts (sorted by updatedAt desc).
 * Does NOT load full project data.
 */
export async function listDraftMetadata(): Promise<DraftMetadata[]> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);

    const all: DraftRecord[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });

    return all
      .map((r) => ({
        id: r.id,
        name: r.name,
        step: r.step,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        expiresAt: r.expiresAt,
        slideCount: r.project.slides.filter((s) => s.status === "ready").length,
        imageCount: r.project.uploadedImages.length,
        theme: r.project.theme || "",
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.warn("[KodaPost] Failed to list drafts:", err);
    return [];
  }
}

/**
 * Deletes a draft and its associated images from IndexedDB.
 */
export async function deleteDraft(id: string): Promise<void> {
  try {
    const db = await openDraftDB();

    // Delete draft record
    const tx1 = db.transaction(DRAFTS_STORE, "readwrite");
    tx1.objectStore(DRAFTS_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx1.oncomplete = () => resolve();
      tx1.onerror = () => reject(tx1.error);
    });

    // Delete associated images and audio
    await deleteDraftImages(id);
    await deleteDraftAudio(id);
  } catch (err) {
    console.warn("[KodaPost] Failed to delete draft:", err);
  }
}

/**
 * Returns the number of drafts stored.
 */
export async function getDraftCount(): Promise<number> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);

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
// Draft Image Storage
// -----------------------------------------------------------------------------

/**
 * Saves images for a specific draft.
 */
export async function saveDraftImages(
  draftId: string,
  images: { id: string; url: string; thumbnailUrl?: string }[]
): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);

    // Delete existing images for this draft first
    const idx = store.index("draftId");
    const existing: { compoundKey: string }[] = await new Promise((resolve, reject) => {
      const req = idx.getAll(draftId);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
    for (const rec of existing) {
      store.delete(rec.compoundKey);
    }

    // Store new images (full-res + thumbnails)
    for (const img of images) {
      if (img.url && img.url.startsWith("data:")) {
        store.put({
          compoundKey: `${draftId}:${img.id}`,
          draftId,
          imageId: img.id,
          url: img.url,
        });
      }
      if (img.thumbnailUrl && img.thumbnailUrl.startsWith("data:")) {
        store.put({
          compoundKey: `${draftId}:${img.id}:thumb`,
          draftId,
          imageId: `${img.id}:thumb`,
          url: img.thumbnailUrl,
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to save draft images:", err);
  }
}

/**
 * Loads images for a specific draft.
 * Returns a Map of imageId → data URL (thumbnail entries keyed as "imageId:thumb").
 */
export async function loadDraftImages(
  draftId: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const db = await openDraftDB();
    const tx = db.transaction(IMAGES_STORE, "readonly");
    const store = tx.objectStore(IMAGES_STORE);
    const idx = store.index("draftId");

    const all: { imageId: string; url: string }[] = await new Promise(
      (resolve, reject) => {
        const req = idx.getAll(draftId);
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
      }
    );

    for (const item of all) {
      result.set(item.imageId, item.url);
    }
  } catch (err) {
    console.warn("[KodaPost] Failed to load draft images:", err);
  }
  return result;
}

/**
 * Deletes all images for a specific draft.
 */
async function deleteDraftImages(draftId: string): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);
    const idx = store.index("draftId");

    const all: { compoundKey: string }[] = await new Promise((resolve, reject) => {
      const req = idx.getAll(draftId);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of all) {
      store.delete(rec.compoundKey);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to delete draft images:", err);
  }
}

// -----------------------------------------------------------------------------
// Draft Audio Storage
// -----------------------------------------------------------------------------

/**
 * Saves audio blob for a specific draft.
 * Converts the blob URL to an ArrayBuffer for persistence.
 */
export async function saveDraftAudio(
  draftId: string,
  audioBlob: Blob,
  mimeType: string
): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    const store = tx.objectStore(AUDIO_STORE);

    const arrayBuffer = await audioBlob.arrayBuffer();
    store.put({ draftId, audioData: arrayBuffer, mimeType });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to save draft audio:", err);
  }
}

/**
 * Loads audio blob for a specific draft.
 * Returns a new blob URL, or null if no audio is stored.
 */
export async function loadDraftAudio(
  draftId: string
): Promise<{ objectUrl: string; mimeType: string } | null> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const store = tx.objectStore(AUDIO_STORE);

    const record: { draftId: string; audioData: ArrayBuffer; mimeType: string } | undefined =
      await new Promise((resolve, reject) => {
        const req = store.get(draftId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

    if (!record) return null;

    const blob = new Blob([record.audioData], { type: record.mimeType });
    const objectUrl = URL.createObjectURL(blob);
    return { objectUrl, mimeType: record.mimeType };
  } catch (err) {
    console.warn("[KodaPost] Failed to load draft audio:", err);
    return null;
  }
}

/**
 * Deletes audio for a specific draft.
 */
async function deleteDraftAudio(draftId: string): Promise<void> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).delete(draftId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to delete draft audio:", err);
  }
}

// -----------------------------------------------------------------------------
// Draft Expiration
// -----------------------------------------------------------------------------

/**
 * Prunes expired drafts from IndexedDB.
 * Returns the names of deleted drafts (for user notification).
 */
export async function pruneExpiredDrafts(): Promise<string[]> {
  try {
    const db = await openDraftDB();
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);

    const all: DraftRecord[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });

    const now = Date.now();
    const pruned: string[] = [];

    for (const record of all) {
      if (record.expiresAt && new Date(record.expiresAt).getTime() < now) {
        store.delete(record.id);
        pruned.push(record.name);
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Clean up images and audio for pruned drafts
    for (const record of all) {
      if (record.expiresAt && new Date(record.expiresAt).getTime() < now) {
        await deleteDraftImages(record.id);
        await deleteDraftAudio(record.id);
      }
    }

    return pruned;
  } catch (err) {
    console.warn("[KodaPost] Failed to prune expired drafts:", err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Full Database Clear
// -----------------------------------------------------------------------------

/**
 * Clears all data from the drafts database (drafts, images, activity log).
 */
export async function clearDraftDB(): Promise<void> {
  try {
    const db = await openDraftDB();

    const tx = db.transaction(
      [DRAFTS_STORE, IMAGES_STORE, ACTIVITY_STORE, AUDIO_STORE],
      "readwrite"
    );
    tx.objectStore(DRAFTS_STORE).clear();
    tx.objectStore(IMAGES_STORE).clear();
    tx.objectStore(ACTIVITY_STORE).clear();
    tx.objectStore(AUDIO_STORE).clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[KodaPost] Failed to clear draft database:", err);
  }
}

// Export the openDraftDB for activity-log module to reuse
export { openDraftDB, ACTIVITY_STORE };
