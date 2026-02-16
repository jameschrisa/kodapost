import type { CarouselProject, FilterTemplate, UserSettings } from "./types";
import { DEFAULT_PROJECT_SETTINGS } from "./constants";

const NAMESPACE = "nostalgiaflow";
const PROJECT_KEY = `${NAMESPACE}:project`;
const STEP_KEY = `${NAMESPACE}:step`;
const SETTINGS_KEY = `${NAMESPACE}:settings-v1`;
const PROJECT_NAME_KEY = `${NAMESPACE}:project-name`;
const STORAGE_VERSION = 1;

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
    cameraProfileId: -1,
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

    return stored.data;
  } catch {
    // Corrupted data
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
  } catch {
    // Ignore localStorage failures
  }

  try {
    sessionStorage.removeItem(SPLASH_SESSION_KEY);
  } catch {
    // Ignore sessionStorage failures
  }
}
