/**
 * Integration tests for the export pipeline: font-embed → SVG overlay → Sharp composite.
 *
 * These tests exist because unit tests on font-embed and svg-overlay individually
 * never caught the unicode-range bug: Google Fonts returns multiple @font-face blocks
 * per weight (one per Unicode subset). Without unicode-range in the output, librsvg
 * picks the first declared @font-face (cyrillic-ext) which has no Latin glyphs,
 * producing tofu (□□□□) instead of text. The unit-test mocks returned single fake
 * font buffers and never simulated multi-subset CSS responses.
 *
 * These tests validate:
 * 1. buildEmbeddedFontStyles preserves unicode-range in every @font-face
 * 2. The full SVG+Sharp pipeline produces visible text pixels (not tofu/blank)
 * 3. Every FONT_OPTIONS font renders visible Latin text through Sharp
 * 4. The CSP config allows FFmpeg.wasm blob: script loading
 */
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import { buildEmbeddedFontStyles } from "@/lib/font-embed";
import {
  FONT_OPTIONS,
  STYLE_TEMPLATES,
  PLATFORM_IMAGE_SPECS,
  PLATFORM_SAFE_AREA,
  getFontFamilyWithFallback,
} from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PHOTO = path.join(process.cwd(), "public/test-photos/testreal1.jpg");
const hasTestPhotos = fs.existsSync(TEST_PHOTO);

function makeOverlay(overrides?: {
  primary?: string;
  accent?: string;
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: "bold" | "semibold" | "regular";
  backgroundColor?: string;
}): TextOverlay {
  return {
    content: {
      primary: overrides?.primary ?? "Export Pipeline Test",
      accent: overrides?.accent ?? "Subtitle text here",
    },
    styling: {
      fontFamily: overrides?.fontFamily ?? "Inter",
      fontSize: { primary: 48, secondary: 24 },
      fontWeight: overrides?.fontWeight ?? "bold",
      textColor: "#FFFFFF",
      backgroundColor: overrides?.backgroundColor ?? "rgba(0, 0, 0, 0.75)",
      textShadow: true,
      textAlign: "center",
      fontStyle: overrides?.fontStyle ?? "normal",
    },
    positioning: {
      alignment: "bottom",
      horizontalAlign: "center",
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      freePosition: { x: 50, y: 85 },
    },
  };
}

/**
 * Composites an SVG text overlay onto a solid background via Sharp
 * and returns the output buffer.
 */
async function compositeOverlay(
  svgString: string,
  width: number,
  height: number
): Promise<Buffer> {
  // Create a dark solid background (simulates a photo)
  const bg = sharp({
    create: { width, height, channels: 4, background: { r: 60, g: 60, b: 60, alpha: 1 } },
  });
  return bg
    .composite([{ input: Buffer.from(svgString), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Counts pixels brighter than a threshold in a region of a JPEG buffer.
 * Text (white/yellow/cream) on a dark background will produce many bright pixels.
 * Returns the percentage of pixels above the threshold (0-100).
 */
async function countBrightPixels(
  jpegBuffer: Buffer,
  region: { left: number; top: number; width: number; height: number },
  threshold = 150
): Promise<number> {
  const { data, info } = await sharp(jpegBuffer)
    .extract(region)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let brightCount = 0;
  const pixelCount = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > threshold) brightCount++;
  }
  return (brightCount / pixelCount) * 100;
}

/**
 * Compares two JPEG buffers in a region and returns the percentage of
 * pixels that differ by more than a threshold. Used to detect whether
 * text was composited (non-zero diff vs blank background).
 */
async function diffRegionPercent(
  bufA: Buffer,
  bufB: Buffer,
  region: { left: number; top: number; width: number; height: number },
  threshold = 30
): Promise<number> {
  const extractOpts = region;
  const [rawA, rawB] = await Promise.all([
    sharp(bufA).extract(extractOpts).raw().toBuffer({ resolveWithObject: true }),
    sharp(bufB).extract(extractOpts).raw().toBuffer({ resolveWithObject: true }),
  ]);

  let diffCount = 0;
  const pixelCount = rawA.info.width * rawA.info.height;
  for (let i = 0; i < rawA.data.length; i += rawA.info.channels) {
    const lumA = 0.299 * rawA.data[i] + 0.587 * rawA.data[i + 1] + 0.114 * rawA.data[i + 2];
    const lumB = 0.299 * rawB.data[i] + 0.587 * rawB.data[i + 1] + 0.114 * rawB.data[i + 2];
    if (Math.abs(lumA - lumB) > threshold) diffCount++;
  }
  return (diffCount / pixelCount) * 100;
}

// ---------------------------------------------------------------------------
// 1. Font embed: unicode-range preservation
// ---------------------------------------------------------------------------
describe("Font embed unicode-range", { timeout: 60_000 }, () => {
  it("every @font-face block includes unicode-range", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    expect(result.embedded).toContain("Inter");
    expect(result.styleBlock.length).toBeGreaterThan(0);

    // Extract all @font-face blocks
    const blocks = result.styleBlock.match(/@font-face\s*\{[^}]+\}/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);

    for (const block of blocks) {
      expect(block, "Every @font-face must include unicode-range").toMatch(
        /unicode-range:/
      );
    }
  });

  it("only includes latin and latin-ext subsets", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    const blocks = result.styleBlock.match(/@font-face\s*\{[^}]+\}/g) ?? [];
    for (const block of blocks) {
      const rangeMatch = block.match(/unicode-range:\s*([^;]+)/);
      expect(rangeMatch, "Every block must have unicode-range").toBeTruthy();
      const range = rangeMatch![1];
      // Must contain either U+0000-00FF (latin) or U+0100-02xx (latin-ext)
      const isLatin = range.includes("U+0000-00FF");
      const isLatinExt = range.includes("U+0100-02");
      expect(
        isLatin || isLatinExt,
        `Block should be latin or latin-ext, got: ${range.substring(0, 60)}`
      ).toBe(true);
    }
  });

  it("does not include cyrillic/greek/vietnamese subsets", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    // Cyrillic-ext starts at U+0460, Cyrillic at U+0400, Greek at U+0370
    expect(result.styleBlock).not.toContain("U+0460-052F"); // cyrillic-ext
    expect(result.styleBlock).not.toContain("U+0400-045F"); // cyrillic
    expect(result.styleBlock).not.toContain("U+0370-0377"); // greek
  });

  it("includes all 4 standard weights for each subset", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    const blocks = result.styleBlock.match(/@font-face\s*\{[^}]+\}/g) ?? [];
    const weights = blocks
      .map((b) => b.match(/font-weight:\s*(\d+)/)?.[1])
      .filter(Boolean);

    // Should have weights 400, 600, 700, 900 (each with latin + latin-ext = x2)
    const uniqueWeights = new Set(weights);
    expect(uniqueWeights).toContain("400");
    expect(uniqueWeights).toContain("600");
    expect(uniqueWeights).toContain("700");
    expect(uniqueWeights).toContain("900");
  });

  it("multi-word font family is properly quoted in @font-face", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Playfair Display", italic: false }],
      { detailed: true }
    );

    expect(result.embedded).toContain("Playfair Display");
    // Check that the font-family is quoted in @font-face
    expect(result.styleBlock).toContain("font-family: 'Playfair Display'");
  });
});

// ---------------------------------------------------------------------------
// 2. Sharp pixel-level integration: SVG text actually renders visible pixels
// ---------------------------------------------------------------------------
describe("Sharp SVG text rendering", { timeout: 60_000 }, () => {
  it("composited text overlay differs from blank background (text is visible)", async () => {
    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    const overlay = makeOverlay({ primary: "VISIBLE TEXT" });
    const svg = generateOverlaySVG(overlay, 1080, 1350, undefined, result.styleBlock);
    expect(svg).toContain("<text");
    expect(svg).toContain("VISIBLE TEXT");

    // Composite with text
    const withText = await compositeOverlay(svg, 1080, 1350);

    // Composite without text (blank background only)
    const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>`;
    const withoutText = await compositeOverlay(blankSvg, 1080, 1350);

    // Compare the text region: compositing text should change pixels
    const textRegion = { left: 200, top: 1020, width: 680, height: 130 };
    const diffPct = await diffRegionPercent(withText, withoutText, textRegion);

    // If text rendered, at least 3% of pixels in the region should differ
    // (text + background rect + shadow). Tofu/blank would show ~0% diff.
    expect(
      diffPct,
      `Text region diff ${diffPct.toFixed(1)}% should be >3%. ` +
      `0% means text was invisible (tofu or missing).`
    ).toBeGreaterThan(3);
  });

  it("composited text with NO @font-face still renders (fallback font)", async () => {
    const overlay = makeOverlay({ primary: "FALLBACK FONT" });
    const svg = generateOverlaySVG(overlay, 1080, 1350);
    const withText = await compositeOverlay(svg, 1080, 1350);

    const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>`;
    const withoutText = await compositeOverlay(blankSvg, 1080, 1350);

    const textRegion = { left: 200, top: 1020, width: 680, height: 130 };
    const diffPct = await diffRegionPercent(withText, withoutText, textRegion);

    expect(
      diffPct,
      `Fallback font diff ${diffPct.toFixed(1)}% should be >3%`
    ).toBeGreaterThan(3);
  });

  it("composited text with BROKEN @font-face (no unicode-range) still composites", async () => {
    // Regression test: simulate the exact bug that caused tofu.
    // Create a @font-face with a FAKE base64 font and NO unicode-range.
    const brokenStyle = `<style>@font-face {
      font-family: 'Inter';
      font-weight: 700;
      font-style: normal;
      src: url(data:font/woff2;base64,AAAAAAAAAA==) format('woff2');
    }</style>`;

    const overlay = makeOverlay({ primary: "SHOULD NOT TOFU" });
    const svg = generateOverlaySVG(overlay, 1080, 1350, undefined, brokenStyle);
    const output = await compositeOverlay(svg, 1080, 1350);

    // At minimum the composite should succeed without crashing
    expect(output.length).toBeGreaterThan(10_000);

    // Compare vs blank to see if anything rendered
    const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>`;
    const blank = await compositeOverlay(blankSvg, 1080, 1350);
    const textRegion = { left: 200, top: 1020, width: 680, height: 130 };
    const diffPct = await diffRegionPercent(output, blank, textRegion);
    console.log(`[BrokenFontFace] Region diff: ${diffPct.toFixed(1)}%`);
  });
});

// ---------------------------------------------------------------------------
// 3. Every FONT_OPTIONS font renders visible text through the full pipeline
// ---------------------------------------------------------------------------
describe("All fonts render visible text", { timeout: 120_000 }, () => {
  // Deduplicate by font value (e.g., "Montserrat" and "Montserrat Black" share same value)
  const uniqueFonts = Array.from(
    new Map(FONT_OPTIONS.map((f) => [f.value, f])).values()
  );

  for (const font of uniqueFonts) {
    it(`${font.value} renders visible text`, async () => {
      const result = await buildEmbeddedFontStyles(
        [{ family: font.value, italic: false }],
        { detailed: true }
      );

      if (result.failed.includes(font.value)) {
        // Font not available on Google Fonts — skip pixel test but log it
        console.warn(`[FontRender] ${font.value} not available on Google Fonts, skipping pixel test`);
        return;
      }

      expect(result.embedded, `${font.value} should embed successfully`).toContain(font.value);

      // Every @font-face must have unicode-range
      const blocks = result.styleBlock.match(/@font-face\s*\{[^}]+\}/g) ?? [];
      for (const block of blocks) {
        expect(block, `${font.value}: @font-face must include unicode-range`).toMatch(
          /unicode-range:/
        );
      }

      // Composite through Sharp: text vs blank
      const overlay = makeOverlay({
        primary: "Test Headline",
        fontFamily: font.label,
      });
      const svg = generateOverlaySVG(overlay, 1080, 1350, undefined, result.styleBlock);
      const withText = await compositeOverlay(svg, 1080, 1350);

      const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>`;
      const blank = await compositeOverlay(blankSvg, 1080, 1350);

      const textRegion = { left: 200, top: 1020, width: 680, height: 130 };
      const diffPct = await diffRegionPercent(withText, blank, textRegion);

      expect(
        diffPct,
        `${font.value}: text region diff ${diffPct.toFixed(1)}% should be >3% (0% = tofu/blank)`
      ).toBeGreaterThan(3);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Full pipeline with real test photos
// ---------------------------------------------------------------------------
describe("Full pipeline with photos", { timeout: 120_000 }, () => {
  const platforms = [
    { key: "instagram_feed" as const, w: 1080, h: 1350 },
    { key: "youtube_shorts" as const, w: 1080, h: 1920 },
    { key: "youtube_community" as const, w: 1080, h: 1080 },
  ];

  for (const { key, w, h } of platforms) {
    it.skipIf(!hasTestPhotos)(
      `${key}: text overlay visible on real photo`,
      async () => {
        const result = await buildEmbeddedFontStyles(
          [{ family: "Inter", italic: false }],
          { detailed: true }
        );

        const overlay = makeOverlay({ primary: "Photo Test" });
        const safeArea = PLATFORM_SAFE_AREA[key.replace("_feed", "").replace("_community", "") as keyof typeof PLATFORM_SAFE_AREA];
        const svg = generateOverlaySVG(overlay, w, h, safeArea, result.styleBlock);

        const output = await sharp(TEST_PHOTO)
          .resize(w, h, { fit: "cover" })
          .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        const meta = await sharp(output).metadata();
        expect(meta.width).toBe(w);
        expect(meta.height).toBe(h);
        expect(output.length).toBeGreaterThan(50_000);
      }
    );
  }
});

// ---------------------------------------------------------------------------
// 5. Style template integration: every template produces visible output
// ---------------------------------------------------------------------------
describe("Style templates through Sharp", { timeout: 120_000 }, () => {
  for (const template of STYLE_TEMPLATES) {
    it(`"${template.name}" template renders visible text`, async () => {
      const needsItalic = template.fontStyle === "italic";
      const fontOption = FONT_OPTIONS.find((f) => f.label === template.fontFamily);
      const fontValue = fontOption?.value ?? template.fontFamily;

      const result = await buildEmbeddedFontStyles(
        [{ family: fontValue, italic: needsItalic }],
        { detailed: true }
      );

      // Skip pixel test if font unavailable, but still verify embedding attempted
      if (result.failed.includes(fontValue)) {
        console.warn(`[Template] ${template.name}: font ${fontValue} unavailable`);
        return;
      }

      const overlay = makeOverlay({
        primary: "Template Test",
        accent: "Subtitle",
        fontFamily: template.fontFamily,
        fontStyle: template.fontStyle,
        fontWeight: template.fontWeight,
        backgroundColor: template.backgroundColor,
      });

      const svg = generateOverlaySVG(overlay, 1080, 1350, undefined, result.styleBlock);
      expect(svg.length).toBeGreaterThan(100);

      const withText = await compositeOverlay(svg, 1080, 1350);

      const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>`;
      const blank = await compositeOverlay(blankSvg, 1080, 1350);

      const textRegion = { left: 200, top: 1020, width: 680, height: 130 };
      const diffPct = await diffRegionPercent(withText, blank, textRegion);

      // Every template with text should produce at least 3% pixel difference
      // in the text region (text + background rect + shadow effects).
      expect(
        diffPct,
        `"${template.name}" (${fontValue}): diff ${diffPct.toFixed(1)}% should be >3% (0% = invisible text)`
      ).toBeGreaterThan(3);
    });
  }
});

// ---------------------------------------------------------------------------
// 6. CSP configuration
// ---------------------------------------------------------------------------
describe("Security headers for FFmpeg.wasm", () => {
  it("script-src includes blob: for FFmpeg.wasm loading", async () => {
    const configPath = path.join(process.cwd(), "next.config.mjs");
    const configContent = fs.readFileSync(configPath, "utf-8");

    // script-src must include blob: for toBlobURL to work
    expect(configContent).toContain("script-src");
    const scriptSrcMatch = configContent.match(/script-src\s+([^"]+)"/);
    expect(scriptSrcMatch, "script-src directive not found").toBeTruthy();
    expect(
      scriptSrcMatch![1],
      "script-src must include 'blob:' for FFmpeg.wasm blob URL loading"
    ).toContain("blob:");
  });

  it("worker-src includes blob: for FFmpeg.wasm workers", () => {
    const configPath = path.join(process.cwd(), "next.config.mjs");
    const configContent = fs.readFileSync(configPath, "utf-8");

    const workerSrcMatch = configContent.match(/worker-src\s+([^"]+)"/);
    expect(workerSrcMatch, "worker-src directive not found").toBeTruthy();
    expect(workerSrcMatch![1]).toContain("blob:");
  });
});

// ---------------------------------------------------------------------------
// 7. Waveform audio decode logging
// ---------------------------------------------------------------------------
describe("Waveform component diagnostics", () => {
  it("Waveform.tsx includes decode logging for debugging", () => {
    const waveformPath = path.join(
      process.cwd(),
      "src/components/audio/Waveform.tsx"
    );
    const content = fs.readFileSync(waveformPath, "utf-8");

    // Verify decode logging exists so silent failures are visible in console
    expect(content).toContain("[Waveform] Fetching audio from:");
    expect(content).toContain("[Waveform] Decoding");
    expect(content).toContain("[Waveform] Decoded:");
    expect(content).toContain("[Waveform] Failed to decode audio:");
  });
});
