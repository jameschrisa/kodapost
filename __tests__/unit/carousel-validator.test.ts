import { describe, it, expect } from "vitest";
import { validateCarouselReadiness } from "@/lib/carousel-validator";
import type { CarouselProject } from "@/lib/types";

function makeProject(overrides: Partial<CarouselProject> = {}): CarouselProject {
  return {
    id: "test",
    postMode: "carousel",
    theme: "retro vibes",
    keywords: [],
    slideCount: 5,
    cameraProfileId: 1,
    uploadedImages: [
      { id: "img-1", url: "blob://x", filename: "a.jpg", uploadedAt: "2024-01-01", usedInSlides: [] },
    ],
    slides: [],
    analogCreativityMode: "recommended",
    imageAllocationMode: "sequential",
    targetPlatforms: ["instagram"],
    caption: "My caption",
    globalOverlayStyle: { showHeadline: true } as CarouselProject["globalOverlayStyle"],
    ...overrides,
  };
}

describe("validateCarouselReadiness", () => {
  it("passes a valid project", () => {
    const result = validateCarouselReadiness(makeProject());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.canProceed).toBe(true);
  });

  it("errors when no images uploaded", () => {
    const result = validateCarouselReadiness(makeProject({ uploadedImages: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("image"))).toBe(true);
  });

  it("errors when slide count is below minimum (2)", () => {
    const result = validateCarouselReadiness(makeProject({ slideCount: 1 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("at least 2"))).toBe(true);
  });

  it("errors when slide count exceeds maximum (12)", () => {
    const result = validateCarouselReadiness(makeProject({ slideCount: 15 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cannot exceed 12"))).toBe(true);
  });

  it("errors when theme is empty", () => {
    const result = validateCarouselReadiness(makeProject({ theme: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("story"))).toBe(true);
  });

  it("errors when caption is missing", () => {
    const result = validateCarouselReadiness(makeProject({ caption: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("caption"))).toBe(true);
  });

  it("errors when caption is undefined", () => {
    const result = validateCarouselReadiness(makeProject({ caption: undefined }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("caption"))).toBe(true);
  });

  it("warns about text-only slides when images < slideCount and headline enabled", () => {
    const result = validateCarouselReadiness(
      makeProject({ slideCount: 5, uploadedImages: [{ id: "1", url: "x", filename: "a.jpg", uploadedAt: "", usedInSlides: [] }] })
    );
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("text-only");
  });

  it("errors when slides have no image AND no headline", () => {
    const result = validateCarouselReadiness(
      makeProject({
        slideCount: 5,
        uploadedImages: [{ id: "1", url: "x", filename: "a.jpg", uploadedAt: "", usedInSlides: [] }],
        globalOverlayStyle: { showHeadline: false } as CarouselProject["globalOverlayStyle"],
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("no image and no headline"))).toBe(true);
  });

  it("skips slide count bounds for single post mode", () => {
    const result = validateCarouselReadiness(
      makeProject({ postMode: "single", slideCount: 1 })
    );
    // Should not error on slide count since postMode is single
    expect(result.errors.every((e) => !e.includes("Slide count"))).toBe(true);
  });

  it("enforces platform-specific carousel limits (X max 4)", () => {
    const result = validateCarouselReadiness(
      makeProject({ targetPlatforms: ["x"], slideCount: 5 })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("maximum of 4"))).toBe(true);
  });
});
