import type { Step } from "onborda";

interface Tour {
  tour: string;
  steps: Step[];
}

// Selectors for live DOM elements
const MODAL          = '[data-tour="tour-modal"]';
const UPLOAD_ZONE    = '[data-tour="upload-zone"]';
const STEP_INDICATOR = '[data-tour="step-indicator"]';
const TOUR_STORY     = '[data-tour="tour-story-card"]';
const TOUR_CAMERA    = '[data-tour="tour-camera-filters"]';
const TOUR_EDIT      = '[data-tour="tour-edit-panel"]';
const TOUR_FINALIZE  = '[data-tour="tour-finalize-panel"]';
const TOUR_PUBLISH   = '[data-tour="tour-publish-panel"]';

export const appTourSteps: Tour[] = [
  {
    tour: "app-tour",
    steps: [
      // ── Step 0: Welcome (centered modal) ────────────────────────────
      {
        icon: "👋",
        title: "Welcome to KodaPost",
        content:
          "A quick tour of the workflow — takes about 90 seconds. You'll learn how to create and publish stunning carousels.",
        selector: MODAL,
        side: "bottom",
        pointerPadding: -1,
        pointerRadius: 0,
      },

      // ── Step 1: Upload zone (dialog ABOVE the drop-zone) ─────────────
      {
        icon: "🖼️",
        title: "Upload your photos",
        content:
          "Drag and drop 3–10 photos here. JPG, PNG, WebP, or HEIC — up to 10 MB each.",
        selector: UPLOAD_ZONE,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 12,
      },

      // ── Step 2: Workflow nav (spotlight whole bar) ───────────────────
      {
        icon: "🗺️",
        title: "Follow the workflow",
        content:
          "Five steps guide you from upload to publish. Each unlocks as you progress.",
        selector: STEP_INDICATOR,
        side: "bottom",
        pointerPadding: 14,
        pointerRadius: 10,
      },

      // ── Step 3: Your Story card → navigate to Configure ──────────────
      {
        icon: "✨",
        title: "Koda helps write headlines",
        content:
          'Describe your story and hit "Create Headlines and Captions". Koda writes overlay text for every slide — you can edit any line afterward.',
        selector: TOUR_STORY,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 10,
      },

      // ── Step 4: Camera emulation → stays on Configure ────────────────
      {
        icon: "🎨",
        title: "Set up your style",
        content:
          "Pick a vintage camera emulation and dial in grain, vignette, and saturation to give your photos a film-era look.",
        selector: TOUR_CAMERA,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 10,
      },

      // ── Step 5: TextEditPanel → navigate to Edit ─────────────────────
      {
        icon: "✏️",
        title: "Edit and refine",
        content:
          "Fine-tune each headline, toggle text on or off per slide, and adjust font, size, and colour.",
        selector: TOUR_EDIT,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 10,
      },

      // ── Step 6: CarouselPreview → navigate to Review ─────────────────
      {
        icon: "🖼️",
        title: "Preview your carousel",
        content:
          "See exactly how each slide looks. Drag thumbnails to reorder your story before publishing.",
        selector: TOUR_FINALIZE,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 10,
      },

      // ── Step 7: PublishPanel → navigate to Publish (last step) ───────
      {
        icon: "🚀",
        title: "Publish your carousel",
        content:
          "Select your platforms and hit Post Now — or export a ZIP for manual upload.",
        selector: TOUR_PUBLISH,
        side: "top",
        pointerPadding: 12,
        pointerRadius: 10,
      },
    ],
  },
];
