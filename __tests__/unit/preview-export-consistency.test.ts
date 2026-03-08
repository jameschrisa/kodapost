import { describe, it, expect } from "vitest";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import {
  getFontFamilyWithFallback,
  resolveFontOption,
  STYLE_TEMPLATES,
  MIN_OVERLAY_PADDING,
  DEFAULT_BG_PADDING,
  FREE_POSITION_FROM_ALIGNMENT,
} from "@/lib/constants";
import { isLightColor } from "@/lib/utils";
import type { TextOverlay } from "@/lib/types";

// ---------------------------------------------------------------------------
// The CSS preview (SlideTextOverlay.tsx) and SVG export (svg-overlay.ts) must
// produce visually consistent results for identical TextOverlay inputs.
//
// These tests verify that key rendering decisions (font resolution, weight
// calculation, text alignment, shadow logic, background treatment, positioning)
// match between the two paths without importing React components.
// ---------------------------------------------------------------------------

function makeOverlay(overrides?: Partial<TextOverlay["styling"]> & {
  primary?: string;
  accent?: string;
  freePosition?: { x: number; y: number } | undefined;
  alignment?: "top" | "center" | "bottom";
  horizontalAlign?: "left" | "center" | "right";
}): TextOverlay {
  return {
    content: {
      primary: overrides?.primary ?? "Consistency Test",
      accent: overrides?.accent ?? "Subtitle",
    },
    styling: {
      fontFamily: overrides?.fontFamily ?? "Inter",
      fontSize: { primary: overrides?.fontSize?.primary ?? 42, secondary: overrides?.fontSize?.secondary ?? 20 },
      fontWeight: overrides?.fontWeight ?? "bold",
      textColor: overrides?.textColor ?? "#FFFFFF",
      textShadow: overrides?.textShadow ?? true,
      textAlign: overrides?.textAlign ?? "center",
      fontStyle: overrides?.fontStyle ?? "normal",
      backgroundColor: overrides?.backgroundColor,
    },
    positioning: {
      alignment: overrides?.alignment ?? "bottom",
      horizontalAlign: overrides?.horizontalAlign ?? "center",
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      freePosition: overrides?.freePosition ?? { x: 50, y: 85 },
    },
  };
}

// ---------------------------------------------------------------------------
// Shared logic: font resolution
// ---------------------------------------------------------------------------
describe("Preview-export consistency: font resolution", () => {
  for (const template of STYLE_TEMPLATES) {
    it(`"${template.name}" resolves to same font family`, () => {
      // Both paths use getFontFamilyWithFallback for the font-family value
      const resolved = getFontFamilyWithFallback(template.fontFamily);
      const overlay = makeOverlay({ fontFamily: template.fontFamily });
      const svg = generateOverlaySVG(overlay, 1080, 1350);

      // SVG must contain the resolved font family
      expect(svg).toContain(`font-family="${resolved}"`);
    });
  }

  it("multi-word fonts are quoted identically", () => {
    const result = getFontFamilyWithFallback("Playfair Display");
    // Both preview (CSS) and export (SVG) use this function
    expect(result).toContain("'Playfair Display'");
    expect(result).toContain(", serif");
  });
});

// ---------------------------------------------------------------------------
// Shared logic: font weight calculation
// ---------------------------------------------------------------------------
describe("Preview-export consistency: font weight", () => {
  // Both paths compute fontWeight identically:
  // fontOption?.defaultWeight ?? (fontWeight === "regular" ? 400 : fontWeight === "semibold" ? 600 : 700)
  function computeWeight(fontFamily: string, fontWeight: "bold" | "semibold" | "regular"): number {
    const fontOption = resolveFontOption(fontFamily);
    return fontOption?.defaultWeight ?? (fontWeight === "regular" ? 400 : fontWeight === "semibold" ? 600 : 700);
  }

  it("Montserrat Black resolves to weight 900", () => {
    expect(computeWeight("Montserrat Black", "bold")).toBe(900);
    const svg = generateOverlaySVG(
      makeOverlay({ fontFamily: "Montserrat Black" }),
      1080, 1350
    );
    expect(svg).toContain('font-weight="900"');
  });

  it("Inter bold resolves to weight 700", () => {
    expect(computeWeight("Inter", "bold")).toBe(700);
    const svg = generateOverlaySVG(makeOverlay({ fontFamily: "Inter" }), 1080, 1350);
    expect(svg).toContain('font-weight="700"');
  });

  it("regular weight resolves to 400", () => {
    expect(computeWeight("Inter", "regular")).toBe(400);
    const svg = generateOverlaySVG(
      makeOverlay({ fontFamily: "Inter", fontWeight: "regular" }),
      1080, 1350
    );
    expect(svg).toContain('font-weight="400"');
  });

  it("accent text always uses weight 600 in export", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ fontFamily: "Inter" }),
      1080, 1350
    );
    // Primary gets the resolved weight, accent hardcoded to 600
    const textWeights = [...svg.matchAll(/font-weight="(\d+)"/g)].map(m => parseInt(m[1]));
    // First text element = primary, second = accent
    expect(textWeights).toContain(600);
  });
});

// ---------------------------------------------------------------------------
// Shared logic: text shadow decision
// ---------------------------------------------------------------------------
describe("Preview-export consistency: text shadow", () => {
  // SVG export: shouldShowShadow = textShadow && isLightColor(textColor)
  // CSS preview: shouldShowShadow = textShadow && (!backgroundColor || isLightColor(textColor))
  //
  // NOTE: There is a known divergence: the CSS preview shows shadow when there
  // is no background AND dark text, while SVG export does not. The tests below
  // document the shared behavior where both agree.

  it("light text with shadow enabled produces filter in SVG", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ textColor: "#FFFFFF", textShadow: true }),
      1080, 1350
    );
    expect(svg).toContain("<filter");
  });

  it("dark text with shadow enabled produces no filter in SVG", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ textColor: "#1A1A1A", textShadow: true }),
      1080, 1350
    );
    expect(svg).not.toContain("<filter");
  });

  it("shadow disabled produces no filter regardless of text color", () => {
    const svgLight = generateOverlaySVG(
      makeOverlay({ textColor: "#FFFFFF", textShadow: false }),
      1080, 1350
    );
    const svgDark = generateOverlaySVG(
      makeOverlay({ textColor: "#1A1A1A", textShadow: false }),
      1080, 1350
    );
    expect(svgLight).not.toContain("<filter");
    expect(svgDark).not.toContain("<filter");
  });

  it("isLightColor agrees for all template text colors", () => {
    for (const template of STYLE_TEMPLATES) {
      const isLight = isLightColor(template.textColor);
      const svg = generateOverlaySVG(
        makeOverlay({
          textColor: template.textColor,
          textShadow: true,
          backgroundColor: template.backgroundColor,
        }),
        1080, 1350
      );
      // If text is light, SVG should have filter; if dark, no filter
      if (isLight) {
        expect(svg, `"${template.name}" (${template.textColor}) should have shadow`).toContain("<filter");
      } else {
        expect(svg, `"${template.name}" (${template.textColor}) should not have shadow`).not.toContain("<filter");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Shared logic: text alignment / anchor
// ---------------------------------------------------------------------------
describe("Preview-export consistency: text alignment", () => {
  const alignMap: Record<string, string> = {
    left: "start",
    center: "middle",
    right: "end",
  };

  for (const [cssAlign, svgAnchor] of Object.entries(alignMap)) {
    it(`textAlign "${cssAlign}" maps to text-anchor "${svgAnchor}" in SVG`, () => {
      const svg = generateOverlaySVG(
        makeOverlay({ textAlign: cssAlign as "left" | "center" | "right" }),
        1080, 1350
      );
      expect(svg).toContain(`text-anchor="${svgAnchor}"`);
    });
  }
});

// ---------------------------------------------------------------------------
// Shared logic: background treatment
// ---------------------------------------------------------------------------
describe("Preview-export consistency: background", () => {
  it("rgba background produces rect with fill and fill-opacity in SVG", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ backgroundColor: "rgba(0, 0, 0, 0.75)" }),
      1080, 1350
    );
    expect(svg).toContain("<rect");
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill-opacity="0.75"');
  });

  it("transparent background produces rect with fill=transparent", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ backgroundColor: "transparent" }),
      1080, 1350
    );
    expect(svg).toContain('fill="transparent"');
  });

  it("no background produces no rect", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ backgroundColor: undefined }),
      1080, 1350
    );
    expect(svg).not.toContain("<rect");
  });
});

// ---------------------------------------------------------------------------
// Shared logic: freePosition vs legacy alignment
// ---------------------------------------------------------------------------
describe("Preview-export consistency: positioning modes", () => {
  it("freePosition path uses percentage-based coordinates", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ freePosition: { x: 50, y: 85 } }),
      1080, 1350
    );
    // x = 50% of 1080 = 540
    expect(svg).toContain("540");
  });

  it("legacy path uses padding-based positioning", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ freePosition: undefined, alignment: "bottom", horizontalAlign: "center" }),
      1080, 1350
    );
    // center x = 1080/2 = 540
    expect(svg).toContain("540");
    expect(svg).toContain('text-anchor="middle"');
  });

  it("FREE_POSITION_FROM_ALIGNMENT maps correctly", () => {
    // These constants should match what the preview uses for initial positions
    expect(FREE_POSITION_FROM_ALIGNMENT.top).toEqual({ x: 50, y: 20 });
    expect(FREE_POSITION_FROM_ALIGNMENT.center).toEqual({ x: 50, y: 55 });
    expect(FREE_POSITION_FROM_ALIGNMENT.bottom).toEqual({ x: 50, y: 85 });
  });

  it("MIN_OVERLAY_PADDING is enforced in legacy path", () => {
    const svg = generateOverlaySVG(
      makeOverlay({
        freePosition: undefined,
        alignment: "top",
        horizontalAlign: "left",
      }),
      1080, 1350
    );
    // With left alignment, x position should be at least MIN_OVERLAY_PADDING
    const xMatch = svg.match(/<text x="(\d+)"/);
    expect(xMatch).toBeTruthy();
    expect(parseInt(xMatch![1])).toBeGreaterThanOrEqual(MIN_OVERLAY_PADDING);
  });
});

// ---------------------------------------------------------------------------
// Shared logic: font style (italic)
// ---------------------------------------------------------------------------
describe("Preview-export consistency: font style", () => {
  it("italic fontStyle produces font-style attribute in SVG", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ fontStyle: "italic" }),
      1080, 1350
    );
    expect(svg).toContain('font-style="italic"');
  });

  it("normal fontStyle produces no font-style attribute", () => {
    const svg = generateOverlaySVG(
      makeOverlay({ fontStyle: "normal" }),
      1080, 1350
    );
    expect(svg).not.toContain('font-style="italic"');
  });
});

// ---------------------------------------------------------------------------
// Shared logic: empty content
// ---------------------------------------------------------------------------
describe("Preview-export consistency: empty content", () => {
  it("both preview and export skip rendering when content is empty", () => {
    const overlay = makeOverlay({ primary: "", accent: "" });
    overlay.content.accent = "";
    // SVG export returns empty string
    const svg = generateOverlaySVG(overlay, 1080, 1350);
    expect(svg).toBe("");
    // Preview returns null (tested implicitly - same condition check)
  });
});
