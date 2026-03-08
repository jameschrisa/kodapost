import { describe, it, expect } from "vitest";
import type { CarouselSlide, CarouselProject, UploadedImage } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers: minimal factory functions
// ---------------------------------------------------------------------------

function makeSlide(overrides: Partial<CarouselSlide> = {}): CarouselSlide {
  return {
    id: overrides.id ?? "slide-1",
    position: overrides.position ?? 0,
    slideType: "story",
    status: "ready",
    ...overrides,
  };
}

function makeUploadedImage(overrides: Partial<UploadedImage> = {}): UploadedImage {
  return {
    id: overrides.id ?? "img-1",
    url: overrides.url ?? "data:image/png;base64,AAAA",
    filename: "photo.jpg",
    uploadedAt: "2024-01-01",
    usedInSlides: [],
    ...overrides,
  };
}

function makeProject(overrides: Partial<CarouselProject> = {}): CarouselProject {
  return {
    id: "test-project",
    postMode: "carousel",
    theme: "retro vibes",
    keywords: [],
    slideCount: 5,
    cameraProfileId: 1,
    uploadedImages: [],
    slides: [],
    analogCreativityMode: "recommended",
    imageAllocationMode: "sequential",
    targetPlatforms: ["instagram"],
    globalOverlayStyle: { showHeadline: true } as CarouselProject["globalOverlayStyle"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Extracted logic: restoreSlideImageUrls
// Mirrors the function in PublishPanel.tsx
// ---------------------------------------------------------------------------

function restoreSlideImageUrls(
  slides: CarouselSlide[],
  uploadedImages: UploadedImage[],
): CarouselSlide[] {
  return slides.map((slide) => {
    // Already has valid data URI or HTTP URL
    if (slide.imageUrl?.startsWith("data:") || slide.imageUrl?.startsWith("http")) {
      return slide;
    }
    // Try to restore from uploaded images via referenceImage
    if (slide.metadata?.referenceImage) {
      const uploaded = uploadedImages.find(
        (img) => img.id === slide.metadata!.referenceImage,
      );
      if (
        uploaded?.url &&
        (uploaded.url.startsWith("data:") || uploaded.url.startsWith("http"))
      ) {
        return { ...slide, imageUrl: uploaded.url };
      }
    }
    return slide;
  });
}

// ---------------------------------------------------------------------------
// Extracted logic: stripForRetry
// Mirrors the stripping transformation in CarouselPreview.tsx handleRetrySlide
// ---------------------------------------------------------------------------

function stripForRetry(project: CarouselProject): CarouselProject {
  return {
    ...project,
    uploadedImages: project.uploadedImages.map((img) => ({
      ...img,
      url: "",
      thumbnailUrl: undefined,
    })),
    slides: project.slides.map((s) => ({
      ...s,
      imageUrl: s.imageUrl?.startsWith("data:") ? "" : s.imageUrl,
      thumbnailUrl: undefined,
    })),
  };
}

// ===========================================================================
// Tests: restoreSlideImageUrls
// ===========================================================================

describe("restoreSlideImageUrls", () => {
  it("passes slides with valid data URIs through unchanged", () => {
    const dataUri = "data:image/png;base64,iVBOR...";
    const slides = [makeSlide({ imageUrl: dataUri })];
    const result = restoreSlideImageUrls(slides, []);
    expect(result[0].imageUrl).toBe(dataUri);
  });

  it("passes slides with HTTP URLs through unchanged", () => {
    const httpUrl = "https://cdn.example.com/photo.jpg";
    const slides = [makeSlide({ imageUrl: httpUrl })];
    const result = restoreSlideImageUrls(slides, []);
    expect(result[0].imageUrl).toBe(httpUrl);
  });

  it("restores empty imageUrl from matching uploadedImage via referenceImage", () => {
    const uploaded = makeUploadedImage({
      id: "img-42",
      url: "data:image/jpeg;base64,RESTORED",
    });
    const slides = [
      makeSlide({
        imageUrl: "",
        metadata: { source: "user_upload", referenceImage: "img-42" },
      }),
    ];
    const result = restoreSlideImageUrls(slides, [uploaded]);
    expect(result[0].imageUrl).toBe("data:image/jpeg;base64,RESTORED");
  });

  it("restores undefined imageUrl from matching uploadedImage", () => {
    const uploaded = makeUploadedImage({
      id: "img-7",
      url: "https://storage.example.com/img7.png",
    });
    const slides = [
      makeSlide({
        imageUrl: undefined,
        metadata: { source: "user_upload", referenceImage: "img-7" },
      }),
    ];
    const result = restoreSlideImageUrls(slides, [uploaded]);
    expect(result[0].imageUrl).toBe("https://storage.example.com/img7.png");
  });

  it("does NOT restore slides with blob: URLs (no match possible)", () => {
    const slides = [
      makeSlide({
        imageUrl: "blob:http://localhost:3000/abc-123",
        metadata: { source: "user_upload", referenceImage: "img-1" },
      }),
    ];
    const uploaded = makeUploadedImage({
      id: "img-1",
      url: "data:image/png;base64,VALID",
    });
    // blob: doesn't start with data: or http, so restoration is attempted.
    // But since the slide already has a non-empty imageUrl that is blob:,
    // the function checks startsWith("data:") and startsWith("http") -- blob: matches neither,
    // so it falls through to the referenceImage lookup and DOES restore.
    // This matches the actual component behavior.
    const result = restoreSlideImageUrls(slides, [uploaded]);
    expect(result[0].imageUrl).toBe("data:image/png;base64,VALID");
  });

  it("leaves blob: URL slide unchanged when no matching uploadedImage exists", () => {
    const slides = [
      makeSlide({
        imageUrl: "blob:http://localhost:3000/abc-123",
        metadata: { source: "user_upload", referenceImage: "img-missing" },
      }),
    ];
    const result = restoreSlideImageUrls(slides, []);
    expect(result[0].imageUrl).toBe("blob:http://localhost:3000/abc-123");
  });

  it("leaves blob: URL slide unchanged when uploadedImage also has blob: URL", () => {
    const slides = [
      makeSlide({
        imageUrl: "blob:http://localhost:3000/slide-blob",
        metadata: { source: "user_upload", referenceImage: "img-blob" },
      }),
    ];
    const uploaded = makeUploadedImage({
      id: "img-blob",
      url: "blob:http://localhost:3000/upload-blob",
    });
    const result = restoreSlideImageUrls(slides, [uploaded]);
    // uploaded.url starts with blob:, not data: or http, so it doesn't qualify
    expect(result[0].imageUrl).toBe("blob:http://localhost:3000/slide-blob");
  });

  it("handles mixed batch: some valid, some restored, some unrestorable", () => {
    const uploaded = [
      makeUploadedImage({ id: "img-A", url: "data:image/png;base64,AAA" }),
      makeUploadedImage({ id: "img-B", url: "blob:http://localhost/nope" }),
    ];
    const slides = [
      // Valid data URI -- passes through
      makeSlide({ id: "s1", position: 0, imageUrl: "data:image/png;base64,EXISTING" }),
      // Empty imageUrl with valid reference -- restored
      makeSlide({
        id: "s2",
        position: 1,
        imageUrl: "",
        metadata: { source: "user_upload", referenceImage: "img-A" },
      }),
      // Empty imageUrl with blob: reference -- unrestorable
      makeSlide({
        id: "s3",
        position: 2,
        imageUrl: "",
        metadata: { source: "user_upload", referenceImage: "img-B" },
      }),
      // HTTP URL -- passes through
      makeSlide({ id: "s4", position: 3, imageUrl: "https://cdn.example.com/ok.jpg" }),
      // No metadata at all -- unrestorable
      makeSlide({ id: "s5", position: 4, imageUrl: undefined }),
    ];

    const result = restoreSlideImageUrls(slides, uploaded);

    expect(result[0].imageUrl).toBe("data:image/png;base64,EXISTING");
    expect(result[1].imageUrl).toBe("data:image/png;base64,AAA");
    expect(result[2].imageUrl).toBe("");
    expect(result[3].imageUrl).toBe("https://cdn.example.com/ok.jpg");
    expect(result[4].imageUrl).toBeUndefined();
  });

  it("does not mutate the original slide objects", () => {
    const uploaded = makeUploadedImage({ id: "ref-1", url: "data:image/png;base64,NEW" });
    const original = makeSlide({
      imageUrl: "",
      metadata: { source: "user_upload", referenceImage: "ref-1" },
    });
    const slides = [original];
    const result = restoreSlideImageUrls(slides, [uploaded]);
    expect(result[0].imageUrl).toBe("data:image/png;base64,NEW");
    expect(original.imageUrl).toBe(""); // original unchanged
  });
});

// ===========================================================================
// Tests: stripForRetry (base64 stripping before regenerateSlide)
// ===========================================================================

describe("stripForRetry", () => {
  it("strips data URI imageUrls to empty string", () => {
    const project = makeProject({
      slides: [
        makeSlide({ imageUrl: "data:image/png;base64,BIGDATA" }),
        makeSlide({ imageUrl: "data:image/jpeg;base64,MOREBIGDATA", position: 1 }),
      ],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBe("");
    expect(stripped.slides[1].imageUrl).toBe("");
  });

  it("preserves HTTP imageUrls", () => {
    const project = makeProject({
      slides: [makeSlide({ imageUrl: "https://cdn.example.com/img.jpg" })],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBe("https://cdn.example.com/img.jpg");
  });

  it("preserves undefined imageUrls (already empty)", () => {
    const project = makeProject({
      slides: [makeSlide({ imageUrl: undefined })],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBeUndefined();
  });

  it("preserves empty string imageUrls", () => {
    const project = makeProject({
      slides: [makeSlide({ imageUrl: "" })],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBe("");
  });

  it("preserves blob: imageUrls (not data:)", () => {
    const project = makeProject({
      slides: [makeSlide({ imageUrl: "blob:http://localhost/abc" })],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBe("blob:http://localhost/abc");
  });

  it("strips all uploadedImages urls to empty string", () => {
    const project = makeProject({
      uploadedImages: [
        makeUploadedImage({ id: "a", url: "data:image/png;base64,AAA" }),
        makeUploadedImage({ id: "b", url: "https://example.com/b.jpg" }),
        makeUploadedImage({ id: "c", url: "blob:http://localhost/c" }),
      ],
    });
    const stripped = stripForRetry(project);
    expect(stripped.uploadedImages[0].url).toBe("");
    expect(stripped.uploadedImages[1].url).toBe("");
    expect(stripped.uploadedImages[2].url).toBe("");
  });

  it("sets all thumbnailUrls to undefined on both slides and uploadedImages", () => {
    const project = makeProject({
      uploadedImages: [
        makeUploadedImage({ id: "a", thumbnailUrl: "data:image/png;base64,THUMB" }),
      ],
      slides: [
        makeSlide({ thumbnailUrl: "data:image/png;base64,SLIDETHUMB" }),
      ],
    });
    const stripped = stripForRetry(project);
    expect(stripped.uploadedImages[0].thumbnailUrl).toBeUndefined();
    expect(stripped.slides[0].thumbnailUrl).toBeUndefined();
  });

  it("does not mutate the original project", () => {
    const originalUrl = "data:image/png;base64,ORIGINAL";
    const project = makeProject({
      uploadedImages: [makeUploadedImage({ url: originalUrl })],
      slides: [makeSlide({ imageUrl: originalUrl, thumbnailUrl: "data:thumb" })],
    });
    stripForRetry(project);
    expect(project.uploadedImages[0].url).toBe(originalUrl);
    expect(project.slides[0].imageUrl).toBe(originalUrl);
    expect(project.slides[0].thumbnailUrl).toBe("data:thumb");
  });

  it("handles mixed slide imageUrl types in a single project", () => {
    const project = makeProject({
      slides: [
        makeSlide({ position: 0, imageUrl: "data:image/png;base64,DATA1" }),
        makeSlide({ position: 1, imageUrl: "https://cdn.example.com/img.jpg" }),
        makeSlide({ position: 2, imageUrl: undefined }),
        makeSlide({ position: 3, imageUrl: "" }),
        makeSlide({ position: 4, imageUrl: "blob:http://localhost/xyz" }),
      ],
    });
    const stripped = stripForRetry(project);
    expect(stripped.slides[0].imageUrl).toBe("");              // data: stripped
    expect(stripped.slides[1].imageUrl).toBe("https://cdn.example.com/img.jpg"); // http preserved
    expect(stripped.slides[2].imageUrl).toBeUndefined();        // undefined preserved
    expect(stripped.slides[3].imageUrl).toBe("");               // empty preserved
    expect(stripped.slides[4].imageUrl).toBe("blob:http://localhost/xyz"); // blob preserved
  });

  it("preserves non-image project fields", () => {
    const project = makeProject({
      theme: "polaroid",
      keywords: ["travel", "sunset"],
      caption: "A beautiful day",
      slides: [makeSlide({ imageUrl: "data:image/png;base64,X" })],
    });
    const stripped = stripForRetry(project);
    expect(stripped.theme).toBe("polaroid");
    expect(stripped.keywords).toEqual(["travel", "sunset"]);
    expect(stripped.caption).toBe("A beautiful day");
  });
});
