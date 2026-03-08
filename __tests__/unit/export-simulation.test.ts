import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import {
  STYLE_TEMPLATES,
  PLATFORM_IMAGE_SPECS,
  PLATFORM_SAFE_AREA,
  getFontFamilyWithFallback,
} from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PHOTO_DIR = path.join(process.cwd(), "public/test-photos");
const TEST_PHOTO = path.join(TEST_PHOTO_DIR, "testreal1.jpg");

// Platform specs to test (representative subset: 4:5, 9:16, 1:1)
const PLATFORM_SPECS = [
  { key: "instagram_feed" as const, label: "Instagram 4:5" },
  { key: "youtube_shorts" as const, label: "YouTube Shorts 9:16" },
  { key: "youtube_community" as const, label: "YouTube Community 1:1" },
] as const;

function makeOverlayFromTemplate(
  template: (typeof STYLE_TEMPLATES)[number]
): TextOverlay {
  return {
    content: { primary: "Export Test Headline", accent: "Subtitle Text" },
    styling: {
      fontFamily: template.fontFamily,
      fontSize: { primary: template.fontSize, secondary: 20 },
      fontWeight: template.fontWeight,
      textColor: template.textColor,
      backgroundColor: template.backgroundColor,
      textShadow: template.textShadow,
      textAlign: "center",
      fontStyle: template.fontStyle,
    },
    positioning: {
      alignment: "bottom",
      horizontalAlign: "center",
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      freePosition: { x: 50, y: 85 },
    },
  };
}

// ---------------------------------------------------------------------------
// Test: SVG generation for all templates x platform specs
// ---------------------------------------------------------------------------
describe("Export simulation: SVG generation", () => {
  for (const template of STYLE_TEMPLATES) {
    for (const platform of PLATFORM_SPECS) {
      it(`generates valid SVG for "${template.name}" at ${platform.label}`, () => {
        const spec = PLATFORM_IMAGE_SPECS[platform.key];
        const overlay = makeOverlayFromTemplate(template);
        const safeArea = PLATFORM_SAFE_AREA[platform.key === "youtube_shorts" ? "youtube_shorts" : ""] ?? undefined;

        const svg = generateOverlaySVG(overlay, spec.width, spec.height, safeArea);

        expect(svg).toBeTruthy();
        expect(svg).toContain("<svg");
        expect(svg).toContain(`width="${spec.width}"`);
        expect(svg).toContain(`height="${spec.height}"`);
        expect(svg).toContain("Export Test Headline");

        // Font family should be present
        const expectedFont = getFontFamilyWithFallback(template.fontFamily);
        expect(svg).toContain(expectedFont);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Test: Sharp compositing with SVG overlay
// ---------------------------------------------------------------------------
describe("Export simulation: Sharp compositing", () => {
  const hasTestPhoto = fs.existsSync(TEST_PHOTO);

  it.skipIf(!hasTestPhoto)("composites SVG overlay onto test image for instagram_feed", async () => {
    const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
    const overlay = makeOverlayFromTemplate(STYLE_TEMPLATES[0]); // Bold Statement

    // Generate SVG
    const svg = generateOverlaySVG(overlay, spec.width, spec.height);
    expect(svg).toBeTruthy();

    // Resize test photo to platform dimensions
    const pipeline = sharp(TEST_PHOTO).resize(spec.width, spec.height, {
      fit: "cover",
      position: "center",
    });

    // Composite SVG overlay
    const svgBuffer = Buffer.from(svg);
    const result = await pipeline
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: spec.quality })
      .toBuffer();

    // Verify output
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
    expect(metadata.format).toBe("jpeg");
    expect(result.length).toBeGreaterThan(0);
  });

  it.skipIf(!hasTestPhoto)("composites SVG overlay for youtube_shorts with safe area", async () => {
    const spec = PLATFORM_IMAGE_SPECS.youtube_shorts;
    const overlay = makeOverlayFromTemplate(STYLE_TEMPLATES[2]); // Vintage Serif
    const safeArea = PLATFORM_SAFE_AREA.youtube_shorts;

    const svg = generateOverlaySVG(overlay, spec.width, spec.height, safeArea);
    expect(svg).toBeTruthy();

    const pipeline = sharp(TEST_PHOTO).resize(spec.width, spec.height, {
      fit: "cover",
      position: "center",
    });

    const svgBuffer = Buffer.from(svg);
    const result = await pipeline
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: 80 })
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
  });

  it.skipIf(!hasTestPhoto)("composites SVG overlay for youtube_community 1:1", async () => {
    const spec = PLATFORM_IMAGE_SPECS.youtube_community;
    const overlay = makeOverlayFromTemplate(STYLE_TEMPLATES[4]); // Street Pop

    const svg = generateOverlaySVG(overlay, spec.width, spec.height);
    expect(svg).toBeTruthy();

    const pipeline = sharp(TEST_PHOTO).resize(spec.width, spec.height, {
      fit: "cover",
      position: "center",
    });

    const svgBuffer = Buffer.from(svg);
    const result = await pipeline
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: spec.quality })
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
  });

  // Text-only slide (no source image)
  it("creates text-only slide with solid background", async () => {
    const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
    const overlay = makeOverlayFromTemplate(STYLE_TEMPLATES[1]); // Minimal Clean

    const svg = generateOverlaySVG(overlay, spec.width, spec.height);
    expect(svg).toBeTruthy();

    // Create solid background (simulates text-only slide)
    const pipeline = sharp({
      create: {
        width: spec.width,
        height: spec.height,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 1 },
      },
    });

    const svgBuffer = Buffer.from(svg);
    const result = await pipeline
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: spec.quality })
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
    expect(metadata.format).toBe("jpeg");
  });

  // All 8 templates produce compositable SVGs
  it.skipIf(!hasTestPhoto)("all 8 templates composite without errors on instagram_feed", { timeout: 30000 }, async () => {
    const spec = PLATFORM_IMAGE_SPECS.instagram_feed;

    for (const template of STYLE_TEMPLATES) {
      const overlay = makeOverlayFromTemplate(template);
      const svg = generateOverlaySVG(overlay, spec.width, spec.height);
      expect(svg, `Template "${template.name}" should produce non-empty SVG`).toBeTruthy();

      const pipeline = sharp(TEST_PHOTO).resize(spec.width, spec.height, {
        fit: "cover",
        position: "center",
      });

      const svgBuffer = Buffer.from(svg);
      const result = await pipeline
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .jpeg({ quality: spec.quality })
        .toBuffer();

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(spec.width);
      expect(metadata.height).toBe(spec.height);
    }
  });

  // PNG output for linkedin
  it("produces PNG output for linkedin_pdf spec", async () => {
    const spec = PLATFORM_IMAGE_SPECS.linkedin_pdf;
    const overlay = makeOverlayFromTemplate(STYLE_TEMPLATES[3]); // Editorial

    const svg = generateOverlaySVG(overlay, spec.width, spec.height);

    const pipeline = sharp({
      create: {
        width: spec.width,
        height: spec.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    const svgBuffer = Buffer.from(svg);
    const result = await pipeline
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
    expect(metadata.format).toBe("png");
  });
});
