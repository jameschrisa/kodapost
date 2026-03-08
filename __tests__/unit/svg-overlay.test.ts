import { describe, it, expect } from "vitest";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import {
  getFontFamilyWithFallback,
  resolveFontOption,
  FONT_OPTIONS,
  STYLE_TEMPLATES,
  MIN_OVERLAY_PADDING,
} from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helper: builds a default TextOverlay for tests
// ---------------------------------------------------------------------------
function makeOverlay(overrides?: {
  primary?: string;
  accent?: string;
  styling?: Partial<TextOverlay["styling"]>;
  positioning?: Partial<TextOverlay["positioning"]>;
}): TextOverlay {
  return {
    content: {
      primary: overrides?.primary ?? "Test Headline",
      accent: overrides?.accent ?? "Subtitle",
    },
    styling: {
      fontFamily: "Inter",
      fontSize: { primary: 42, secondary: 20 },
      fontWeight: "bold",
      textColor: "#FFFFFF",
      textShadow: true,
      textAlign: "center",
      fontStyle: "normal",
      ...overrides?.styling,
    },
    positioning: {
      alignment: "bottom",
      horizontalAlign: "center",
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      freePosition: { x: 50, y: 85 },
      ...overrides?.positioning,
    },
  };
}

// ---------------------------------------------------------------------------
// getFontFamilyWithFallback
// ---------------------------------------------------------------------------
describe("getFontFamilyWithFallback", () => {
  it("quotes multi-word font names and appends serif fallback", () => {
    const result = getFontFamilyWithFallback("Playfair Display");
    expect(result).toContain("'Playfair Display'");
    expect(result).toContain(", serif");
  });

  it("does not quote single-word font names", () => {
    const result = getFontFamilyWithFallback("Inter");
    expect(result).toBe("Inter, sans-serif");
  });
});

// ---------------------------------------------------------------------------
// resolveFontOption
// ---------------------------------------------------------------------------
describe("resolveFontOption", () => {
  it("resolves by label and returns defaultWeight for variant", () => {
    const option = resolveFontOption("Montserrat Black");
    expect(option).toBeDefined();
    expect(option!.defaultWeight).toBe(900);
  });

  it("resolves by value when label does not match", () => {
    const option = resolveFontOption("Montserrat");
    expect(option).toBeDefined();
    expect(option!.value).toBe("Montserrat");
  });

  it("returns undefined for unknown font", () => {
    expect(resolveFontOption("NonExistentFont")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateOverlaySVG — basic structure
// ---------------------------------------------------------------------------
describe("generateOverlaySVG", () => {
  it("produces valid SVG with expected structure", () => {
    const overlay = makeOverlay();
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1350"');
    expect(svg).toContain("<text");
    expect(svg).toContain("Test Headline");
    expect(svg).toContain("Subtitle");
  });

  it("passes through embeddedFontStyle into SVG output", () => {
    const overlay = makeOverlay();
    const fontStyle = "<style>@font-face{font-family:'Test';src:url(data:...)}</style>";
    const svg = generateOverlaySVG(overlay, 1080, 1350, undefined, fontStyle);

    expect(svg).toContain(fontStyle);
  });

  // ── freePosition path ──
  it("uses freePosition coordinates for text placement", () => {
    const overlay = makeOverlay({
      positioning: { freePosition: { x: 50, y: 85 } },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    // x = 50% of 1080 = 540
    expect(svg).toContain("540");
    expect(svg).toContain("<text");
  });

  // ── Safe area clamping ──
  it("clamps Y coordinates within safe area", () => {
    // Use only primary text (no accent) to simplify Y calculation
    const overlaySafe = makeOverlay({
      primary: "Clamped",
      accent: undefined,
      styling: { backgroundColor: undefined },
      positioning: { freePosition: { x: 50, y: 99 } },
    });
    overlaySafe.content.accent = undefined;
    const safeArea = { top: 285, right: 0, bottom: 285, left: 0 };
    const svgSafe = generateOverlaySVG(overlaySafe, 1080, 1920, safeArea);

    const overlayNoSafe = makeOverlay({
      primary: "Clamped",
      accent: undefined,
      styling: { backgroundColor: undefined },
      positioning: { freePosition: { x: 50, y: 99 } },
    });
    overlayNoSafe.content.accent = undefined;
    const svgNoSafe = generateOverlaySVG(overlayNoSafe, 1080, 1920);

    // Extract all y="..." values from both SVGs
    const extractYs = (svg: string) =>
      [...svg.matchAll(/\by="([\d.]+)"/g)].map((m) => parseFloat(m[1]));

    const ysSafe = extractYs(svgSafe);
    const ysNoSafe = extractYs(svgNoSafe);

    expect(ysSafe.length).toBeGreaterThan(0);
    expect(ysNoSafe.length).toBe(ysSafe.length);

    // The max Y in the clamped version should be less than in the unclamped version
    const maxSafe = Math.max(...ysSafe);
    const maxNoSafe = Math.max(...ysNoSafe);
    expect(maxSafe).toBeLessThan(maxNoSafe);
  });

  // ── Legacy path ──
  it("uses legacy padding+alignment when freePosition is not set", () => {
    const overlay = makeOverlay({
      positioning: {
        alignment: "bottom",
        horizontalAlign: "center",
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        freePosition: undefined,
      },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toContain("<svg");
    expect(svg).toContain("<text");
    // x should be width/2 = 540 for center alignment
    expect(svg).toContain('text-anchor="middle"');
  });

  // ── MIN_OVERLAY_PADDING enforcement ──
  it("enforces MIN_OVERLAY_PADDING for legacy path", () => {
    const overlay = makeOverlay({
      positioning: {
        alignment: "bottom",
        horizontalAlign: "left",
        padding: { top: 5, right: 5, bottom: 5, left: 5 },
        freePosition: undefined,
      },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    // With left alignment and MIN_OVERLAY_PADDING=20, x should be at least 20
    const xValues = [...svg.matchAll(/<text x="([\d.]+)"/g)].map((m) =>
      parseFloat(m[1])
    );
    for (const x of xValues) {
      expect(x).toBeGreaterThanOrEqual(MIN_OVERLAY_PADDING);
    }
  });

  // ── Text shadow filter ──
  it("adds shadow filter for light text with textShadow enabled", () => {
    const overlay = makeOverlay({
      styling: { textColor: "#FFFFFF", textShadow: true },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toContain("<filter");
    expect(svg).toContain("feDropShadow");
  });

  it("omits shadow filter for dark text even with textShadow enabled", () => {
    const overlay = makeOverlay({
      styling: { textColor: "#1A1A1A", textShadow: true },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).not.toContain("<filter");
  });

  // ── Background rect with rgba ──
  it("converts rgba background to fill + fill-opacity", () => {
    const overlay = makeOverlay({
      styling: { backgroundColor: "rgba(0, 0, 0, 0.75)" },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toContain("<rect");
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill-opacity="0.75"');
  });

  it("handles transparent background without fill-opacity", () => {
    const overlay = makeOverlay({
      styling: { backgroundColor: "transparent" },
    });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toContain("<rect");
    expect(svg).toContain('fill="transparent"');
    expect(svg).not.toContain("fill-opacity");
  });

  // ── XML escaping ──
  it("escapes special XML characters in text content", () => {
    const overlay = makeOverlay({ primary: "Tom & Jerry <3" });
    const svg = generateOverlaySVG(overlay, 1080, 1350);

    expect(svg).toContain("&amp;");
    expect(svg).toContain("&lt;");
    expect(svg).not.toContain("Tom & Jerry <3");
  });

  // ── Empty content ──
  it("returns empty string when both primary and accent are empty", () => {
    const overlay = makeOverlay({ primary: "", accent: "" });
    // accent maps to content.accent which is checked alongside primary
    overlay.content.accent = "";
    const result = generateOverlaySVG(overlay, 1080, 1350);

    expect(result).toBe("");
  });

  // ── All templates produce valid SVG ──
  it("generates valid SVG for every STYLE_TEMPLATE", () => {
    for (const template of STYLE_TEMPLATES) {
      const overlay = makeOverlay({
        primary: "Template Test",
        styling: {
          fontFamily: template.fontFamily,
          fontWeight: template.fontWeight,
          textColor: template.textColor,
          backgroundColor: template.backgroundColor,
          textShadow: template.textShadow,
          fontStyle: template.fontStyle,
        },
      });
      const svg = generateOverlaySVG(overlay, 1080, 1350);

      expect(svg, `Template "${template.name}" should produce valid SVG`).toContain("<svg");
      // Verify the resolved font family appears in the output
      const expectedFamily = getFontFamilyWithFallback(template.fontFamily);
      expect(svg, `Template "${template.name}" should use font "${expectedFamily}"`).toContain(
        expectedFamily
      );
    }
  });
});

// ---------------------------------------------------------------------------
// CJK / non-Latin text width estimation
// ---------------------------------------------------------------------------
describe("CJK and non-Latin text width estimation", () => {
  it("CJK text produces wider background rects than same-length Latin text", () => {
    const latinOverlay = makeOverlay({
      primary: "Hello",
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });
    const cjkOverlay = makeOverlay({
      primary: "\u4F60\u597D\u4E16\u754C\u548C",  // 5 CJK chars
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });

    const latinSvg = generateOverlaySVG(latinOverlay, 1080, 1350);
    const cjkSvg = generateOverlaySVG(cjkOverlay, 1080, 1350);

    // Extract rect width from SVG
    const getWidth = (svg: string) => {
      const match = svg.match(/width="([\d.]+)"/);
      // Skip the root SVG width, get the rect width
      const rectMatch = svg.match(/<rect[^>]*width="([\d.]+)"/);
      return rectMatch ? parseFloat(rectMatch[1]) : 0;
    };

    const latinWidth = getWidth(latinSvg);
    const cjkWidth = getWidth(cjkSvg);

    // CJK chars should produce wider rects (1.0 factor vs 0.6)
    expect(cjkWidth).toBeGreaterThan(latinWidth);
  });

  it("Arabic text produces wider background rects than Latin", () => {
    const latinOverlay = makeOverlay({
      primary: "Hello",
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });
    const arabicOverlay = makeOverlay({
      primary: "\u0645\u0631\u062D\u0628\u0627",  // 5 Arabic chars
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });

    const latinSvg = generateOverlaySVG(latinOverlay, 1080, 1350);
    const arabicSvg = generateOverlaySVG(arabicOverlay, 1080, 1350);

    const getRectWidth = (svg: string) => {
      const match = svg.match(/<rect[^>]*width="([\d.]+)"/);
      return match ? parseFloat(match[1]) : 0;
    };

    const latinWidth = getRectWidth(latinSvg);
    const arabicWidth = getRectWidth(arabicSvg);

    // Arabic (0.7 factor) should produce wider rects than Latin (0.6 factor)
    expect(arabicWidth).toBeGreaterThan(latinWidth);
  });

  it("mixed Latin + CJK text width is between pure Latin and pure CJK", () => {
    const mixedOverlay = makeOverlay({
      primary: "Hi\u4F60\u597DHi",  // "Hi" + 2 CJK + "Hi" = 6 chars
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });
    const latinOverlay = makeOverlay({
      primary: "HiXXHi",  // same length, all Latin
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });
    const cjkOverlay = makeOverlay({
      primary: "\u4F60\u597D\u4E16\u754C\u548C\u5E73",  // 6 CJK chars
      styling: { backgroundColor: "rgba(0,0,0,0.75)" },
    });

    const getRectWidth = (svg: string) => {
      const match = svg.match(/<rect[^>]*width="([\d.]+)"/);
      return match ? parseFloat(match[1]) : 0;
    };

    const mixedWidth = getRectWidth(generateOverlaySVG(mixedOverlay, 1080, 1350));
    const latinWidth = getRectWidth(generateOverlaySVG(latinOverlay, 1080, 1350));
    const cjkWidth = getRectWidth(generateOverlaySVG(cjkOverlay, 1080, 1350));

    expect(mixedWidth).toBeGreaterThan(latinWidth);
    expect(mixedWidth).toBeLessThan(cjkWidth);
  });
});
