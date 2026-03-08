import { describe, it, expect } from "vitest";
import {
  PLATFORM_IMAGE_SPECS,
  FONT_OPTIONS,
  resolveFontOption,
  DEFAULT_PROJECT_SETTINGS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// PLATFORM_SPEC_MAP validation
// ---------------------------------------------------------------------------
describe("PLATFORM_SPEC_MAP", () => {
  // Recreate the map from actions.ts since it's in a "use server" file
  const PLATFORM_SPEC_MAP: Record<string, keyof typeof PLATFORM_IMAGE_SPECS> = {
    instagram: "instagram_feed",
    tiktok: "tiktok",
    linkedin: "linkedin_pdf",
    youtube: "youtube_community",
    youtube_shorts: "youtube_shorts",
    reddit: "reddit_gallery",
    x: "x_post",
  };

  it("maps all 7 platforms to valid PLATFORM_IMAGE_SPECS keys", () => {
    const specKeys = Object.keys(PLATFORM_IMAGE_SPECS);
    for (const [platform, specKey] of Object.entries(PLATFORM_SPEC_MAP)) {
      expect(specKeys, `${platform} -> ${specKey} should be a valid spec key`).toContain(specKey);
    }
  });

  it("contains exactly 7 platform entries", () => {
    expect(Object.keys(PLATFORM_SPEC_MAP)).toHaveLength(7);
  });

  it.each([
    ["instagram", "instagram_feed"],
    ["tiktok", "tiktok"],
    ["linkedin", "linkedin_pdf"],
    ["youtube", "youtube_community"],
    ["youtube_shorts", "youtube_shorts"],
    ["reddit", "reddit_gallery"],
    ["x", "x_post"],
  ])("maps %s to %s", (platform, specKey) => {
    expect(PLATFORM_SPEC_MAP[platform]).toBe(specKey);
  });
});

// ---------------------------------------------------------------------------
// Font weight mapping
// ---------------------------------------------------------------------------
describe("Font weight mapping", () => {
  // Recreate the weight extraction logic from actions.ts
  function resolveWeight(weightStr: string, defaultWeight?: number): number {
    if (defaultWeight) return defaultWeight;
    switch (weightStr) {
      case "regular":
        return 400;
      case "semibold":
        return 600;
      case "bold":
        return 700;
      default:
        return 400;
    }
  }

  it('maps "regular" to 400', () => {
    expect(resolveWeight("regular")).toBe(400);
  });

  it('maps "semibold" to 600', () => {
    expect(resolveWeight("semibold")).toBe(600);
  });

  it('maps "bold" to 700', () => {
    expect(resolveWeight("bold")).toBe(700);
  });

  it("uses defaultWeight when set (Montserrat Black -> 900)", () => {
    const opt = resolveFontOption("Montserrat Black");
    expect(resolveWeight("bold", opt?.defaultWeight)).toBe(900);
  });
});

// ---------------------------------------------------------------------------
// Font request collection from slides
// ---------------------------------------------------------------------------
describe("Font request collection from slides", () => {
  interface MockSlide {
    textOverlay?: {
      styling?: {
        fontFamily?: string;
        fontStyle?: "normal" | "italic";
      };
    };
  }

  interface FontRequest {
    family: string;
    italic: boolean;
  }

  function collectFontRequests(slides: MockSlide[]): FontRequest[] {
    const requests: FontRequest[] = [];
    for (const slide of slides) {
      if (slide.textOverlay?.styling?.fontFamily) {
        const fontOpt = resolveFontOption(slide.textOverlay.styling.fontFamily);
        const family = fontOpt?.value ?? slide.textOverlay.styling.fontFamily;
        const needsItalic = slide.textOverlay.styling.fontStyle === "italic";
        requests.push({ family, italic: needsItalic });
      }
    }
    return requests;
  }

  it('resolves "Montserrat Black" to family "Montserrat"', () => {
    const slides: MockSlide[] = [
      { textOverlay: { styling: { fontFamily: "Montserrat Black", fontStyle: "normal" } } },
    ];
    const requests = collectFontRequests(slides);
    expect(requests[0].family).toBe("Montserrat");
  });

  it('resolves "Inter" to family "Inter"', () => {
    const slides: MockSlide[] = [
      { textOverlay: { styling: { fontFamily: "Inter", fontStyle: "normal" } } },
    ];
    const requests = collectFontRequests(slides);
    expect(requests[0].family).toBe("Inter");
  });

  it("sets italic: true when fontStyle is italic", () => {
    const slides: MockSlide[] = [
      { textOverlay: { styling: { fontFamily: "Inter", fontStyle: "italic" } } },
    ];
    const requests = collectFontRequests(slides);
    expect(requests[0].italic).toBe(true);
  });

  it("sets italic: false when fontStyle is normal", () => {
    const slides: MockSlide[] = [
      { textOverlay: { styling: { fontFamily: "Inter", fontStyle: "normal" } } },
    ];
    const requests = collectFontRequests(slides);
    expect(requests[0].italic).toBe(false);
  });

  it("skips slides without text overlay", () => {
    const slides: MockSlide[] = [
      {},
      { textOverlay: { styling: { fontFamily: "Poppins", fontStyle: "normal" } } },
    ];
    const requests = collectFontRequests(slides);
    expect(requests).toHaveLength(1);
    expect(requests[0].family).toBe("Poppins");
  });
});

// ---------------------------------------------------------------------------
// resolveFontOption font weight resolution
// ---------------------------------------------------------------------------
describe("resolveFontOption", () => {
  it('"Montserrat Black" has defaultWeight 900', () => {
    const opt = resolveFontOption("Montserrat Black");
    expect(opt).toBeDefined();
    expect(opt!.defaultWeight).toBe(900);
  });

  it('"Playfair Display Black" has defaultWeight 900', () => {
    const opt = resolveFontOption("Playfair Display Black");
    expect(opt).toBeDefined();
    expect(opt!.defaultWeight).toBe(900);
  });

  it('"Inter" has no defaultWeight', () => {
    const opt = resolveFontOption("Inter");
    expect(opt).toBeDefined();
    expect(opt!.defaultWeight).toBeUndefined();
  });

  it('"Bebas Neue" has no defaultWeight', () => {
    const opt = resolveFontOption("Bebas Neue");
    expect(opt).toBeDefined();
    expect(opt!.defaultWeight).toBeUndefined();
  });

  it("returns undefined for unknown font", () => {
    expect(resolveFontOption("Comic Sans")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// All FONT_OPTIONS have valid categories
// ---------------------------------------------------------------------------
describe("FONT_OPTIONS categories", () => {
  const validCategories = ["sans-serif", "serif", "display"];

  it("every font option has a valid category", () => {
    for (const font of FONT_OPTIONS) {
      expect(validCategories, `${font.label} has invalid category "${font.category}"`).toContain(
        font.category
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Platform image specs completeness
// ---------------------------------------------------------------------------
describe("PLATFORM_IMAGE_SPECS completeness", () => {
  const requiredFields = ["width", "height", "aspectRatio", "format", "quality"] as const;

  it.each(Object.entries(PLATFORM_IMAGE_SPECS))(
    "%s has all required fields",
    (specKey, spec) => {
      for (const field of requiredFields) {
        expect(spec, `${specKey} is missing "${field}"`).toHaveProperty(field);
      }
    }
  );

  it("all specs have positive width and height", () => {
    for (const [key, spec] of Object.entries(PLATFORM_IMAGE_SPECS)) {
      expect(spec.width, `${key} width`).toBeGreaterThan(0);
      expect(spec.height, `${key} height`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Default platform
// ---------------------------------------------------------------------------
describe("DEFAULT_PROJECT_SETTINGS", () => {
  it('includes "instagram" in targetPlatforms', () => {
    expect(DEFAULT_PROJECT_SETTINGS.targetPlatforms).toContain("instagram");
  });
});
