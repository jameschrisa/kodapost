import { describe, it, expect } from "vitest";
import { cn, computeConfigHash, parseDataUri, isLightColor, formatError, handleAPIError } from "@/lib/utils";
import type { CarouselProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// cn (className merge utility)
// ---------------------------------------------------------------------------
describe("cn", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("handles empty / undefined inputs", () => {
    expect(cn()).toBe("");
    expect(cn(undefined, null, "a")).toBe("a");
  });
});

// ---------------------------------------------------------------------------
// computeConfigHash
// ---------------------------------------------------------------------------
describe("computeConfigHash", () => {
  const baseProject: CarouselProject = {
    id: "test-1",
    postMode: "carousel",
    theme: "retro",
    keywords: ["nostalgia"],
    slideCount: 5,
    cameraProfileId: 1,
    uploadedImages: [{ id: "img-1", url: "blob://x", filename: "a.jpg", uploadedAt: "2024-01-01", usedInSlides: [] }],
    slides: [],
    analogCreativityMode: "recommended",
    imageAllocationMode: "sequential",
    targetPlatforms: ["instagram"],
  };

  it("returns a JSON string", () => {
    const hash = computeConfigHash(baseProject);
    expect(() => JSON.parse(hash)).not.toThrow();
  });

  it("is deterministic for same inputs", () => {
    expect(computeConfigHash(baseProject)).toBe(computeConfigHash(baseProject));
  });

  it("changes when a relevant field changes", () => {
    const modified = { ...baseProject, theme: "vintage" };
    expect(computeConfigHash(modified)).not.toBe(computeConfigHash(baseProject));
  });

  it("ignores non-relevant fields (id, slides, caption)", () => {
    const withCaption = { ...baseProject, caption: "hello world" };
    expect(computeConfigHash(withCaption)).toBe(computeConfigHash(baseProject));
  });
});

// ---------------------------------------------------------------------------
// parseDataUri
// ---------------------------------------------------------------------------
describe("parseDataUri", () => {
  it("parses a valid JPEG data URI", () => {
    const result = parseDataUri("data:image/jpeg;base64,/9j/4AAQ");
    expect(result).toEqual({ mediaType: "image/jpeg", data: "/9j/4AAQ" });
  });

  it("parses a valid PNG data URI", () => {
    const result = parseDataUri("data:image/png;base64,iVBOR");
    expect(result).toEqual({ mediaType: "image/png", data: "iVBOR" });
  });

  it("returns null for non-data-URI strings", () => {
    expect(parseDataUri("https://example.com/img.jpg")).toBeNull();
    expect(parseDataUri("blob:http://localhost/abc")).toBeNull();
    expect(parseDataUri("")).toBeNull();
  });

  it("returns null for malformed data URIs", () => {
    expect(parseDataUri("data:image/jpeg;/9j/")).toBeNull();
    expect(parseDataUri("data:;base64,abc")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isLightColor
// ---------------------------------------------------------------------------
describe("isLightColor", () => {
  it("returns true for white (#FFFFFF)", () => {
    expect(isLightColor("#FFFFFF")).toBe(true);
  });

  it("returns false for black (#000000)", () => {
    expect(isLightColor("#000000")).toBe(false);
  });

  it("handles hex without # prefix", () => {
    expect(isLightColor("FFFFFF")).toBe(true);
    expect(isLightColor("000000")).toBe(false);
  });

  it("returns true for short/invalid hex (fallback)", () => {
    expect(isLightColor("#FFF")).toBe(true);
    expect(isLightColor("")).toBe(true);
  });

  it("detects mid-range colors correctly", () => {
    // Pure red: brightness = (255*299 + 0*587 + 0*114) / 1000 = 76.245 -> dark
    expect(isLightColor("#FF0000")).toBe(false);
    // Pure green: brightness = (0*299 + 255*587 + 0*114) / 1000 = 149.685 -> light
    expect(isLightColor("#00FF00")).toBe(true);
    // Yellow: brightness = (255*299 + 255*587 + 0*114) / 1000 = 225.93 -> light
    expect(isLightColor("#FFFF00")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatError
// ---------------------------------------------------------------------------
describe("formatError", () => {
  it("extracts message from Error instances", () => {
    expect(formatError(new Error("test error"))).toBe("test error");
  });

  it("returns string errors directly", () => {
    expect(formatError("string error")).toBe("string error");
  });

  it("extracts message from error-like objects", () => {
    expect(formatError({ message: "object error" })).toBe("object error");
  });

  it("returns fallback for unknown error types", () => {
    expect(formatError(42)).toBe("An unexpected error occurred. Please try again.");
    expect(formatError(null)).toBe("An unexpected error occurred. Please try again.");
    expect(formatError(undefined)).toBe("An unexpected error occurred. Please try again.");
  });

  it("does not extract non-string message properties", () => {
    expect(formatError({ message: 42 })).toBe("An unexpected error occurred. Please try again.");
  });
});

// ---------------------------------------------------------------------------
// handleAPIError
// ---------------------------------------------------------------------------
describe("handleAPIError", () => {
  it("returns the formatted error message", () => {
    const result = handleAPIError(new Error("API failed"));
    expect(result).toBe("API failed");
  });

  it("returns string errors directly", () => {
    expect(handleAPIError("timeout")).toBe("timeout");
  });
});
