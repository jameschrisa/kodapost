/**
 * Draft Manager — Plan-aware orchestration layer for multi-draft operations.
 *
 * Coordinates between plan limits (from plans.ts) and storage operations
 * (from draft-storage.ts). All functions are async and designed to be
 * called from React components/hooks.
 */

import type { CarouselProject } from "./types";
import type { PlanTier } from "./plans";
import { canCreateDraft, calculateDraftExpiration } from "./plans";
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  getDraftCount,
  pruneExpiredDrafts,
  saveDraftImages,
  loadDraftImages,
} from "./draft-storage";
import { createEmptyProject } from "./storage";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CreateDraftResult {
  success: boolean;
  draftId?: string;
  error?: "limit_reached" | "storage_error";
}

export interface SwitchDraftResult {
  success: boolean;
  project?: CarouselProject;
  step?: string;
  name?: string;
  error?: "not_found" | "storage_error";
}

// -----------------------------------------------------------------------------
// Draft Creation
// -----------------------------------------------------------------------------

/**
 * Creates a new draft if the user's plan allows it.
 * Returns the new draft ID on success, or an error if the limit is reached.
 */
export async function createNewDraft(
  planTier: PlanTier
): Promise<CreateDraftResult> {
  try {
    // Prune expired drafts first to free up slots
    await pruneExpiredDrafts();

    const count = await getDraftCount();
    if (!canCreateDraft(planTier, count)) {
      return { success: false, error: "limit_reached" };
    }

    const draftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const project = createEmptyProject();
    const expiresAt = calculateDraftExpiration(planTier);

    await saveDraft(draftId, project, "upload", "Untitled Project", expiresAt);

    return { success: true, draftId };
  } catch {
    return { success: false, error: "storage_error" };
  }
}

// -----------------------------------------------------------------------------
// Draft Switching
// -----------------------------------------------------------------------------

/**
 * Saves the current draft, then loads the target draft.
 * Returns the loaded project and step, or an error.
 */
export async function switchDraft(
  currentDraftId: string | null,
  currentProject: CarouselProject,
  currentStep: string,
  currentName: string,
  targetDraftId: string
): Promise<SwitchDraftResult> {
  try {
    // Save current draft before switching (if we have one)
    if (currentDraftId) {
      await saveDraft(currentDraftId, currentProject, currentStep, currentName);

      // Save current draft images
      const imagesToSave = currentProject.uploadedImages
        .filter(
          (img) =>
            img.url &&
            (img.url.startsWith("data:") || img.url.startsWith("blob:"))
        )
        .map((img) => ({ id: img.id, url: img.url }));
      if (imagesToSave.length > 0) {
        await saveDraftImages(currentDraftId, imagesToSave);
      }
    }

    // Load target draft
    const loaded = await loadDraft(targetDraftId);
    if (!loaded) {
      return { success: false, error: "not_found" };
    }

    // Restore images from IndexedDB
    const imageMap = await loadDraftImages(targetDraftId);
    if (imageMap.size > 0) {
      loaded.project.uploadedImages = loaded.project.uploadedImages.map(
        (img) => ({
          ...img,
          url: imageMap.get(img.id) || img.url,
        })
      );
      // Restore slide images
      loaded.project.slides = loaded.project.slides.map((slide) => {
        if (
          slide.metadata?.source === "user_upload" &&
          slide.metadata.referenceImage
        ) {
          const restored = loaded.project.uploadedImages.find(
            (img) => img.id === slide.metadata!.referenceImage
          );
          if (restored?.url) {
            return { ...slide, imageUrl: restored.url };
          }
        }
        return slide;
      });
    }

    return {
      success: true,
      project: loaded.project,
      step: loaded.step,
      name: loaded.name,
    };
  } catch {
    return { success: false, error: "storage_error" };
  }
}

// -----------------------------------------------------------------------------
// Draft Deletion
// -----------------------------------------------------------------------------

/**
 * Deletes a draft and runs expiration pruning.
 */
export async function deleteAndPrune(draftId: string): Promise<void> {
  await deleteDraft(draftId);
  await pruneExpiredDrafts();
}
