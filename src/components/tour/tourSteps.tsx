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
          "A quick tour of the workflow. Takes about 90 seconds. You'll learn how to create and publish stunning carousels.",
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
          "Drag and drop 3–10 photos here. JPG, PNG, WebP, or HEIC, up to 10 MB each.",
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
          'Describe your story and hit "Create Headlines and Captions". Koda writes overlay text for every slide. You can edit any line afterward.',
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
          "This is the Stylize card. Pick a vintage camera emulation (Kodak Gold, Fuji Velvia, Polaroid, and more), apply retro photo filters, and use Fine-Tune to dial in grain, vignette, bloom, and saturation. Your filter settings apply to every slide.",
        selector: TOUR_CAMERA,
        side: "right",
        pointerPadding: 14,
        pointerRadius: 12,
      },

      // ── Step 5: TextEditPanel → navigate to Edit ─────────────────────
      {
        icon: "✏️",
        title: "Edit and refine",
        content:
          "This is the Design screen. Click any slide to select it, then edit the text overlay directly on the preview. Use the Format tab for font, size, color, and position. Use the Content tab to rewrite the text. Toggle text on or off per slide.",
        selector: TOUR_EDIT,
        side: "bottom",
        pointerPadding: 14,
        pointerRadius: 12,
      },

      // ── Step 6: CarouselPreview → navigate to Review ─────────────────
      {
        icon: "🖼️",
        title: "Preview your carousel",
        content:
          "This is the Review screen. See all your slides at a glance in the carousel grid. Switch between Platform Preview and Device Preview to check how your carousel looks on different social networks. Drag thumbnails to reorder slides before publishing.",
        selector: TOUR_FINALIZE,
        side: "bottom",
        pointerPadding: 14,
        pointerRadius: 12,
      },

      // ── Step 7: PublishPanel → navigate to Publish (last step) ───────
      {
        icon: "🚀",
        title: "Publish your carousel",
        content:
          "This is the Publish screen. Check the platforms you want to post to, then hit Post Now to publish directly. Or use Export to download a ZIP for manual upload. Toggle Creator Provenance to embed your authorship metadata into every exported image.",
        selector: TOUR_PUBLISH,
        side: "bottom",
        pointerPadding: 14,
        pointerRadius: 12,
      },
    ],
  },
];
