import type { CarouselProject, FilterTemplate, UserSettings } from "./types";
import { DEFAULT_PROJECT_SETTINGS } from "./constants";
import { saveDraft, saveDraftImages } from "./draft-storage";
import { calculateDraftExpiration } from "./plans";
import type { PlanTier } from "./plans";

const NAMESPACE = "nostalgiaflow";
const PROJECT_KEY = `${NAMESPACE}:project`;
const STEP_KEY = `${NAMESPACE}:step`;
const SETTINGS_KEY = `${NAMESPACE}:settings-v1`;
const PROJECT_NAME_KEY = `${NAMESPACE}:project-name`;
const STORAGE_VERSION = 1;

// IndexedDB constants for image persistence (much larger quota than localStorage)
const IDB_NAME = "nostalgiaflow-images";
const IDB_VERSION = 1;
const IDB_STORE = "images";

interface StoredProject {
  version: number;
  data: CarouselProject;
  savedAt: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Project CRUD
// -----------------------------------------------------------------------------

/**
 * Creates a fresh empty project with default settings.
 */
export function createEmptyProject(): CarouselProject {
  return {
    id: `project-${Date.now()}`,
    theme: "",
    keywords: [],
    cameraProfileId: 0,
    uploadedImages: [],
    slides: [],
    ...DEFAULT_PROJECT_SETTINGS,
  };
}

/**
 * Creates a lightweight version of the project for localStorage.
 * Strips large base64 data URIs from uploaded images and slide images
 * to stay within the ~5-10 MB localStorage quota.
 * The image data lives in memory during the session; on reload,
 * the user re-uploads.
 */
function createStorableProject(project: CarouselProject): CarouselProject {
  return {
    ...project,
    uploadedImages: project.uploadedImages.map((img) => ({
      ...img,
      url: img.url.startsWith("data:") || img.url.startsWith("blob:") ? "" : img.url,
    })),
    slides: project.slides.map((slide) => ({
      ...slide,
      imageUrl:
        slide.imageUrl?.startsWith("data:") || slide.imageUrl?.startsWith("blob:")
          ? ""
          : slide.imageUrl,
    })),
    // Strip audio blob URL — it won't survive page reload.
    // Audio metadata (source, name, duration, trim points, attribution) is preserved
    // so the UI can show what was attached and prompt re-upload if needed.
    audioClip: project.audioClip
      ? { ...project.audioClip, objectUrl: "" }
      : undefined,
  };
}

/**
 * Saves a project to localStorage. Wraps the data with a version
 * number and timestamp for future migration support.
 * Strips large image data to stay within quota limits.
 * Silently fails if storage is unavailable or quota is exceeded.
 */
export function saveProject(project: CarouselProject): void {
  if (!isLocalStorageAvailable()) return;

  const stored: StoredProject = {
    version: STORAGE_VERSION,
    data: createStorableProject(project),
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(stored));
  } catch (error) {
    // Quota exceeded — try clearing old data and retrying once
    if (
      error instanceof DOMException &&
      error.name === "QuotaExceededError"
    ) {
      try {
        clearProject();
        localStorage.setItem(PROJECT_KEY, JSON.stringify(stored));
      } catch {
        console.warn("[KodaPost] localStorage quota exceeded");
      }
    }
  }
}

/**
 * Loads the saved project from localStorage.
 * Returns null if no project exists or data is corrupted.
 * Handles version migration for future schema changes.
 */
export function loadProject(): CarouselProject | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredProject;

    // Version check — add migration logic here in the future
    if (!stored.version || !stored.data) return null;

    // Migrate legacy cameraProfileId: -1 → 0 ("No Emulation")
    if (stored.data.cameraProfileId === -1) {
      stored.data.cameraProfileId = 0;
    }

    return stored.data;
  } catch {
    // Corrupted data
    return null;
  }
}

/**
 * Returns the savedAt timestamp from the stored project.
 * Returns null if no project exists.
 */
export function loadProjectSavedAt(): string | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredProject;
    return stored.savedAt ?? null;
  } catch {
    return null;
  }
}

/**
 * Removes the saved project and step from localStorage.
 */
export function clearProject(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(PROJECT_KEY);
    localStorage.removeItem(STEP_KEY);
    localStorage.removeItem(PROJECT_NAME_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Saves a project name to localStorage.
 */
export function saveProjectName(name: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(PROJECT_NAME_KEY, name);
  } catch {
    // Ignore
  }
}

/**
 * Loads the saved project name from localStorage.
 */
export function loadProjectName(): string | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    return localStorage.getItem(PROJECT_NAME_KEY);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Step Persistence
// -----------------------------------------------------------------------------

type Step = "upload" | "configure" | "edit" | "review" | "publish";
const VALID_STEPS: Step[] = ["upload", "configure", "edit", "review", "publish"];

/**
 * Saves the current workflow step to localStorage.
 */
export function saveStep(step: Step): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(STEP_KEY, step);
  } catch {
    // Ignore
  }
}

/**
 * Loads the saved workflow step from localStorage.
 * Returns "upload" if no step is saved or the value is invalid.
 */
export function loadStep(): Step {
  if (!isLocalStorageAvailable()) return "upload";

  try {
    const raw = localStorage.getItem(STEP_KEY);
    if (raw && VALID_STEPS.includes(raw as Step)) {
      return raw as Step;
    }
  } catch {
    // Ignore
  }

  return "upload";
}

// -----------------------------------------------------------------------------
// Project List (for future multi-project support)
// -----------------------------------------------------------------------------

// Reserved for future multi-project support:
// const PROJECT_LIST_KEY = `${NAMESPACE}:projects`;

/**
 * Returns a list of all saved project summaries.
 * For MVP this returns at most one project.
 */
export function listProjects(): CarouselProject[] {
  const project = loadProject();
  return project ? [project] : [];
}

// -----------------------------------------------------------------------------
// User Settings
// -----------------------------------------------------------------------------

/**
 * Creates default settings with all platforms configured but inactive.
 */
export function createDefaultSettings(): UserSettings {
  return {
    socialAccounts: [
      { platform: "instagram", username: "", active: true },
      { platform: "tiktok", username: "", active: false },
      { platform: "linkedin", username: "", active: false },
      { platform: "youtube", username: "", active: false },
      { platform: "reddit", username: "", active: false },
      { platform: "lemon8", username: "", active: false },
      { platform: "x", username: "", active: false },
    ],
    defaultPlatforms: ["instagram"],
  };
}

/**
 * Saves user settings to localStorage.
 */
export function saveSettings(settings: UserSettings): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.warn("[KodaPost] Failed to save settings");
  }
}

/**
 * Loads user settings from localStorage.
 * Returns default settings if none are saved.
 */
export function loadSettings(): UserSettings {
  if (!isLocalStorageAvailable()) return createDefaultSettings();

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return createDefaultSettings();
    return JSON.parse(raw) as UserSettings;
  } catch {
    return createDefaultSettings();
  }
}

// -----------------------------------------------------------------------------
// Filter Templates
// TODO: Migrate to server-side storage when Clerk auth is integrated.
//       For now, templates are saved locally in the browser.
// -----------------------------------------------------------------------------

const FILTER_TEMPLATES_KEY = `${NAMESPACE}:filter-templates`;

/**
 * Saves filter templates to localStorage.
 * Silently fails if storage is unavailable or quota is exceeded.
 */
export function saveFilterTemplates(templates: FilterTemplate[]): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(FILTER_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "QuotaExceededError"
    ) {
      console.warn("[KodaPost] localStorage quota exceeded for filter templates");
    }
  }
}

/**
 * Loads filter templates from localStorage.
 * Returns an empty array if none are saved or data is corrupted.
 */
export function loadFilterTemplates(): FilterTemplate[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const raw = localStorage.getItem(FILTER_TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FilterTemplate[]) : [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// IndexedDB Image Persistence
// -----------------------------------------------------------------------------

/**
 * Opens the IndexedDB database for image storage.
 * IndexedDB has a much larger quota than localStorage (~hundreds of MB)
 * which allows us to persist uploaded images across page reloads.
 */
function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves uploaded image data (base64 URLs) to IndexedDB.
 * Each image is stored as { id, url } keyed by the image ID.
 */
export async function saveImagesToIDB(
  images: { id: string; url: string }[]
): Promise<void> {
  try {
    const db = await openImageDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);

    // Clear existing images first
    store.clear();

    // Store each image
    for (const img of images) {
      if (img.url && (img.url.startsWith("data:") || img.url.startsWith("blob:"))) {
        store.put({ id: img.id, url: img.url });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("[KodaPost] Failed to save images to IndexedDB:", err);
  }
}

/**
 * Loads all saved image data from IndexedDB.
 * Returns a Map of image ID → data URL.
 */
export async function loadImagesFromIDB(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const db = await openImageDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);

    const all: { id: string; url: string }[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const item of all) {
      result.set(item.id, item.url);
    }
    db.close();
  } catch (err) {
    console.warn("[KodaPost] Failed to load images from IndexedDB:", err);
  }
  return result;
}

/**
 * Clears all saved images from IndexedDB.
 */
export async function clearImagesFromIDB(): Promise<void> {
  try {
    const db = await openImageDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("[KodaPost] Failed to clear images from IndexedDB:", err);
  }
}

// -----------------------------------------------------------------------------
// Legacy → Multi-Draft Migration
// -----------------------------------------------------------------------------

const MIGRATION_FLAG = "kodapost:migrated-to-multi-draft";

/**
 * Migrates a single-project from localStorage/IndexedDB to the new
 * multi-draft IndexedDB system. Runs once on first load after upgrade.
 * Returns the new draft ID if migration happened, null otherwise.
 */
export async function migrateLegacyProject(
  planTier: PlanTier = "trial"
): Promise<string | null> {
  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) return null;

  const project = loadProject();
  if (!project) {
    // No legacy project — mark as migrated and return
    localStorage.setItem(MIGRATION_FLAG, "1");
    return null;
  }

  // Check if there's any meaningful content to migrate
  const hasImages = project.uploadedImages.some((img) => img.url.length > 0);
  const hasSlides = project.slides.length > 0;
  if (!hasImages && !hasSlides) {
    localStorage.setItem(MIGRATION_FLAG, "1");
    return null;
  }

  const draftId = `draft-${Date.now()}-migrated`;
  const step = loadStep();
  const name = loadProjectName() || "Migrated Project";
  const expiresAt = calculateDraftExpiration(planTier);

  try {
    // Save to new multi-draft system
    await saveDraft(draftId, project, step, name, expiresAt);

    // Also migrate images from the legacy IDB to draft-specific storage
    const imageMap = await loadImagesFromIDB();
    if (imageMap.size > 0) {
      const images = Array.from(imageMap.entries()).map(([id, url]) => ({
        id,
        url,
      }));
      await saveDraftImages(draftId, images);
    }

    // Mark as migrated — don't clear legacy data yet (safety net)
    localStorage.setItem(MIGRATION_FLAG, "1");
    return draftId;
  } catch (err) {
    console.warn("[KodaPost] Legacy migration failed:", err);
    return null;
  }
}

/**
 * Returns true if the legacy → multi-draft migration has already happened.
 */
export function isMigrationComplete(): boolean {
  try {
    return !!localStorage.getItem(MIGRATION_FLAG);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Full Reset (simulates a first-time user)
// -----------------------------------------------------------------------------

const SPLASH_SESSION_KEY = "kodapost:splash-shown";

/**
 * Clears ALL application storage — localStorage and sessionStorage.
 * Used for simulating a first-time user experience or "Start Fresh".
 * Removes: project, step, project-name, settings, filter-templates,
 * and the splash-shown session key.
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(PROJECT_KEY);
    localStorage.removeItem(STEP_KEY);
    localStorage.removeItem(PROJECT_NAME_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(FILTER_TEMPLATES_KEY);
    localStorage.removeItem("kodapost:admin-view-mode");
    localStorage.removeItem("kodapost:assistant-preference");
  } catch {
    // Ignore localStorage failures
  }

  try {
    sessionStorage.removeItem(SPLASH_SESSION_KEY);
  } catch {
    // Ignore sessionStorage failures
  }

  // Clear IndexedDB images (legacy)
  clearImagesFromIDB().catch(() => {});

  // Clear multi-draft IndexedDB
  import("./draft-storage").then((m) => m.clearDraftDB()).catch(() => {});
}
