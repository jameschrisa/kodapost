/**
 * Tests for the compositeSlideImages server action.
 *
 * Covers: valid data URI slides, empty imageUrl, blob URLs, mixed valid/invalid
 * batches, all-invalid batches, non-ready slides, and HTTP URL slides.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import type { CarouselSlide } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock Clerk auth so requireAuth() returns "dev" without hitting Clerk APIs.
// The module-level `isClerkEnabled` in actions.ts reads the env var at import
// time, so we clear it before importing the module under test.
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

// Now import the server action (after env is cleared)
const { compositeSlideImages } = await import("@/app/actions");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PHOTO = path.join(process.cwd(), "public/test-photos/testreal1.jpg");
const hasTestPhoto = fs.existsSync(TEST_PHOTO);

/** Create a small valid JPEG data URI from the test photo using Sharp. */
async function makeTestDataUri(): Promise<string> {
  const sharp = (await import("sharp")).default;
  const buf = await sharp(TEST_PHOTO)
    .resize(200, 250, { fit: "cover" })
    .jpeg({ quality: 60 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Build a minimal CarouselSlide with sensible defaults. */
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compositeSlideImages", { timeout: 30_000 }, () => {
  let validDataUri: string;

  beforeAll(async () => {
    if (hasTestPhoto) {
      validDataUri = await makeTestDataUri();
    }
  });

  // -------------------------------------------------------------------------
  // 1. Happy path: valid data URI imageUrl composites successfully
  // -------------------------------------------------------------------------
  it.skipIf(!hasTestPhoto)(
    "composites a slide with a valid data URI imageUrl",
    { timeout: 10_000 },
    async () => {
      const slide = makeSlide({ imageUrl: validDataUri, status: "ready" });
      const result = await compositeSlideImages([slide], ["instagram"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(1);
      expect(result.data[0].platform).toBe("instagram");
      expect(result.data[0].slideIndex).toBe(0);
      expect(result.data[0].format).toBe("jpeg");
      expect(result.data[0].imageBase64.length).toBeGreaterThan(100);
    }
  );

  // -------------------------------------------------------------------------
  // 2. Empty imageUrl: slide with imageUrl "" and status "ready"
  //    Empty string is falsy, so it falls through to the text-only branch
  //    and produces a solid-background slide (not skipped).
  // -------------------------------------------------------------------------
  it("treats empty imageUrl as text-only slide with solid background", { timeout: 10_000 }, async () => {
    const slide = makeSlide({ imageUrl: "", status: "ready" });
    const result = await compositeSlideImages([slide], ["instagram"]);

    // Empty string imageUrl is falsy, so it creates a text-only slide
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.length).toBe(1);
    expect(result.data[0].platform).toBe("instagram");
    expect(result.data[0].imageBase64.length).toBeGreaterThan(100);
  });

  // -------------------------------------------------------------------------
  // 3. Blob URL: should be skipped with warning
  // -------------------------------------------------------------------------
  it("skips a slide with a blob: URL and returns warning", { timeout: 10_000 }, async () => {
    const slide = makeSlide({
      imageUrl: "blob:http://localhost:3000/abc-123-def",
      status: "ready",
    });
    const result = await compositeSlideImages([slide], ["instagram"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No images could be composited for");
      expect(result.warnings).toBeDefined();
      const warningText = result.warnings!.join(" ");
      expect(warningText).toContain("temporary image URL");
    }
  });

  // -------------------------------------------------------------------------
  // 4. Mixed valid/invalid: batch with some valid and some blob URL slides
  // -------------------------------------------------------------------------
  it.skipIf(!hasTestPhoto)(
    "composites valid slides and skips blob URL ones in a mixed batch",
    { timeout: 10_000 },
    async () => {
      const slides = [
        makeSlide({ position: 0, imageUrl: validDataUri, status: "ready" }),
        makeSlide({ position: 1, imageUrl: "blob:http://localhost:3000/abc-123", status: "ready" }),
        makeSlide({ position: 2, imageUrl: validDataUri, status: "ready" }),
      ];
      const result = await compositeSlideImages(slides, ["instagram"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Only the two valid slides should be composited; blob URL is skipped
      expect(result.data.length).toBe(2);
      expect(result.data[0].slideIndex).toBe(0);
      expect(result.data[1].slideIndex).toBe(2);

      // Warnings should mention the skipped slide
      expect(result.warnings).toBeDefined();
      const warningText = result.warnings!.join(" ");
      expect(warningText).toContain("Slide 2");
    }
  );

  // -------------------------------------------------------------------------
  // 5. All invalid: all slides have blob URLs (truly unskippable)
  // -------------------------------------------------------------------------
  it("returns exact error when all slides have blob URLs", { timeout: 10_000 }, async () => {
    const slides = [
      makeSlide({ position: 0, imageUrl: "blob:http://localhost:3000/aaa", status: "ready" }),
      makeSlide({ position: 1, imageUrl: "blob:http://localhost:3000/bbb", status: "ready" }),
    ];
    const result = await compositeSlideImages(slides, ["instagram"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/^No images could be composited for/);
      expect(result.error).toContain("instagram");
    }
  });

  // -------------------------------------------------------------------------
  // 6. Slide not ready: slide with status "error" should be skipped
  // -------------------------------------------------------------------------
  it.skipIf(!hasTestPhoto)(
    "skips slides with status other than ready",
    { timeout: 10_000 },
    async () => {
      const slides = [
        makeSlide({ position: 0, imageUrl: validDataUri, status: "error" }),
        makeSlide({ position: 1, imageUrl: validDataUri, status: "ready" }),
      ];
      const result = await compositeSlideImages(slides, ["instagram"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Only the "ready" slide should be composited
      expect(result.data.length).toBe(1);
      expect(result.data[0].slideIndex).toBe(1);
    }
  );

  // -------------------------------------------------------------------------
  // 7. Valid HTTP URL: slide with imageUrl starting with "http" (mock fetch)
  // -------------------------------------------------------------------------
  it.skipIf(!hasTestPhoto)(
    "fetches and composites a slide with an HTTP URL",
    { timeout: 10_000 },
    async () => {
      const sharp = (await import("sharp")).default;
      // Create a small JPEG buffer to return from the mocked fetch
      const jpegBuf = await sharp(TEST_PHOTO)
        .resize(200, 250, { fit: "cover" })
        .jpeg({ quality: 60 })
        .toBuffer();

      // Mock global fetch for this test
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => jpegBuf.buffer.slice(
          jpegBuf.byteOffset,
          jpegBuf.byteOffset + jpegBuf.byteLength
        ),
      });

      try {
        const slide = makeSlide({
          imageUrl: "https://example.com/photo.jpg",
          status: "ready",
        });
        const result = await compositeSlideImages([slide], ["instagram"]);

        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.length).toBe(1);
        expect(result.data[0].platform).toBe("instagram");
        expect(result.data[0].imageBase64.length).toBeGreaterThan(100);

        // Verify fetch was called with the URL
        expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/photo.jpg");
      } finally {
        globalThis.fetch = originalFetch;
      }
    }
  );

  // -------------------------------------------------------------------------
  // 8. Text-only slide (no imageUrl at all) composites with solid background
  // -------------------------------------------------------------------------
  it(
    "composites a text-only slide with no imageUrl (solid background)",
    { timeout: 10_000 },
    async () => {
      const slide = makeSlide({
        imageUrl: undefined,
        status: "ready",
        textOverlay: {
          content: { primary: "Text Only Slide" },
          styling: {
            fontFamily: "Inter",
            fontSize: { primary: 48, secondary: 24 },
            fontWeight: "bold",
            textColor: "#FFFFFF",
            backgroundColor: "rgba(30, 30, 30, 1)",
            textAlign: "center",
          },
          positioning: {
            alignment: "center",
            horizontalAlign: "center",
            padding: { top: 40, right: 40, bottom: 40, left: 40 },
            freePosition: { x: 50, y: 50 },
          },
        },
      });
      const result = await compositeSlideImages([slide], ["instagram"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(1);
      expect(result.data[0].imageBase64.length).toBeGreaterThan(100);
    }
  );

  // -------------------------------------------------------------------------
  // 9. Multiple platforms in one call
  // -------------------------------------------------------------------------
  it.skipIf(!hasTestPhoto)(
    "composites a slide for multiple platforms",
    { timeout: 10_000 },
    async () => {
      const slide = makeSlide({ imageUrl: validDataUri, status: "ready" });
      const result = await compositeSlideImages(
        [slide],
        ["instagram", "youtube"]
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(2);
      const platforms = result.data.map((r) => r.platform);
      expect(platforms).toContain("instagram");
      expect(platforms).toContain("youtube");
    }
  );
});

// Restore env var after all tests in this file
afterAll(() => {
  if (originalClerkKey !== undefined) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey;
  }
});
