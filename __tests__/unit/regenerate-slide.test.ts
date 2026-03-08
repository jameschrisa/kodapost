/**
 * Tests for the regenerateSlide server action.
 *
 * Covers: valid slide index, invalid slide index, image URL restoration
 * for user uploads, stripped uploadedImages URLs, and slide status.
 */
import { describe, it, expect, vi, afterAll } from "vitest";
import type { CarouselProject, CarouselSlide, TextOverlay } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock Clerk auth so requireAuth() returns "dev" without hitting Clerk APIs.
// ---------------------------------------------------------------------------
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "test-user" }),
  clerkClient: vi.fn().mockReturnValue({
    users: { getUser: vi.fn(), updateUserMetadata: vi.fn() },
  }),
}));

// Ensure isClerkEnabled evaluates to false so requireAuth() returns "dev"
const originalClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK so generateTextOverlay never makes real API calls.
// The mock returns a valid TextOverlay-shaped JSON response.
// ---------------------------------------------------------------------------
const MOCK_OVERLAY_RESPONSE: TextOverlay = {
  content: { primary: "Mock Headline" },
  styling: {
    fontFamily: "Inter",
    fontSize: { primary: 48, secondary: 24 },
    fontWeight: "bold",
    textColor: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.5)",
    textShadow: true,
  },
  positioning: {
    alignment: "bottom",
    horizontalAlign: "center",
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    freePosition: { x: 50, y: 80 },
  },
};

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({ primary: "Mock Headline" }),
          },
        ],
      }),
    };
  }
  return { default: MockAnthropic };
});

// Set the env var that getAnthropicClient() checks
process.env.NOSTALGIA_ANTHROPIC_KEY = "test-key-not-real";

// Now import the server action (after env + mocks are set up)
const { regenerateSlide } = await import("@/app/actions");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSlide(overrides: Partial<CarouselSlide> = {}): CarouselSlide {
  return {
    id: overrides.id ?? `slide-${Math.random().toString(36).slice(2, 8)}`,
    position: overrides.position ?? 0,
    slideType: overrides.slideType ?? "hook",
    imageUrl: overrides.imageUrl,
    status: overrides.status ?? "ready",
    textOverlay: overrides.textOverlay,
    ...overrides,
  };
}

function makeProject(overrides: Partial<CarouselProject> = {}): CarouselProject {
  return {
    id: "test-project-1",
    postMode: "carousel",
    theme: "90s_disposable",
    keywords: ["travel", "sunset"],
    slideCount: 3,
    cameraProfileId: 1,
    uploadedImages: [],
    slides: [],
    analogCreativityMode: "recommended",
    imageAllocationMode: "sequential",
    targetPlatforms: ["instagram"],
    globalOverlayStyle: {
      fontFamily: "Inter",
      fontSize: { primary: 48, secondary: 24 },
      fontWeight: "bold",
      textColor: "#FFFFFF",
      alignment: "bottom",
      horizontalAlign: "center",
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      showHeadline: true,
      showSubtitle: false,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("regenerateSlide", () => {
  // 1. Valid slide index - returns success with updated slide
  it("returns success with an updated slide for a valid index", async () => {
    const slide = makeSlide({ position: 0, slideType: "hook", status: "error" });
    const project = makeProject({ slides: [slide], slideCount: 1 });

    const result = await regenerateSlide(project, 0);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe(slide.id);
    expect(result.data.aiGeneratedOverlay).toBeDefined();
    expect(result.data.textOverlay).toBeDefined();
    expect(result.data.textOverlay?.content.primary).toBe("Mock Headline");
  });

  // 2. Invalid slide index - returns error
  it("returns error for an out-of-bounds slide index", async () => {
    const slide = makeSlide({ position: 0 });
    const project = makeProject({ slides: [slide], slideCount: 1 });

    const result = await regenerateSlide(project, 5);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Slide index 5 not found");
  });

  // 3. Image URL restoration - user_upload with referenceImage
  it("restores imageUrl from uploadedImages when source is user_upload", async () => {
    const uploadUrl = "https://example.com/uploaded-photo.jpg";
    const slide = makeSlide({
      position: 0,
      imageUrl: "blob:http://localhost:3000/old-blob",
      metadata: {
        source: "user_upload",
        referenceImage: "img-1",
      },
    });
    const project = makeProject({
      slides: [slide],
      slideCount: 1,
      uploadedImages: [
        {
          id: "img-1",
          url: uploadUrl,
          filename: "photo.jpg",
          uploadedAt: new Date().toISOString(),
          usedInSlides: [0],
        },
      ],
    });

    const result = await regenerateSlide(project, 0);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.imageUrl).toBe(uploadUrl);
  });

  // 4. Stripped project - uploadedImages URL is empty string
  it("keeps empty imageUrl when uploadedImages URL is stripped", async () => {
    const slide = makeSlide({
      position: 0,
      imageUrl: "",
      metadata: {
        source: "user_upload",
        referenceImage: "img-2",
      },
    });
    const project = makeProject({
      slides: [slide],
      slideCount: 1,
      uploadedImages: [
        {
          id: "img-2",
          url: "", // stripped for payload size
          filename: "photo.jpg",
          uploadedAt: new Date().toISOString(),
          usedInSlides: [0],
        },
      ],
    });

    const result = await regenerateSlide(project, 0);

    expect(result.success).toBe(true);
    if (!result.success) return;
    // The empty string from uploadedImages is assigned; client restores it
    expect(result.data.imageUrl).toBe("");
  });

  // 5. Slide status set to ready
  it("sets the returned slide status to ready", async () => {
    const slide = makeSlide({ position: 0, status: "error" });
    const project = makeProject({ slides: [slide], slideCount: 1 });

    const result = await regenerateSlide(project, 0);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBe("ready");
  });

  // Bonus: textOverlayState is populated correctly
  it("populates textOverlayState with ai_generated source", async () => {
    const slide = makeSlide({ position: 0 });
    const project = makeProject({ slides: [slide], slideCount: 1 });

    const result = await regenerateSlide(project, 0);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.textOverlayState).toBeDefined();
    expect(result.data.textOverlayState?.source).toBe("ai_generated");
    expect(result.data.textOverlayState?.enabled).toBe(true);
    expect(result.data.textOverlayState?.slideId).toBe(slide.id);
  });
});

// Restore env var after all tests
afterAll(() => {
  if (originalClerkKey !== undefined) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey;
  }
  delete process.env.NOSTALGIA_ANTHROPIC_KEY;
});
