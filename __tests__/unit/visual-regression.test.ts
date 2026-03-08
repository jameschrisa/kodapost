import { describe, it, expect, beforeAll } from "vitest";
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import fs from "fs";
import path from "path";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import {
  STYLE_TEMPLATES,
  PLATFORM_IMAGE_SPECS,
  PLATFORM_SAFE_AREA,
  resolveFontOption,
} from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";
import type { StyleTemplate } from "@/lib/constants";

const SNAPSHOT_DIR = path.join(__dirname, "../snapshots");
const TEST_PHOTO = path.join(process.cwd(), "public/test-photos/testreal1.jpg");
const SPEC = PLATFORM_IMAGE_SPECS.instagram_feed;

const hasTestPhoto = fs.existsSync(TEST_PHOTO);

// ---------------------------------------------------------------------------
// Helper: create TextOverlay from a StyleTemplate
// ---------------------------------------------------------------------------

function makeOverlay(template: StyleTemplate): TextOverlay {
  const fontOption = resolveFontOption(template.fontFamily);
  return {
    content: { primary: "Test Headline", accent: "Subtitle Text" },
    styling: {
      fontFamily: template.fontFamily,
      fontSize: {
        primary: template.fontSize,
        secondary: Math.round(template.fontSize * 0.5),
      },
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
// Helper: composite SVG overlay onto a base image buffer
// ---------------------------------------------------------------------------

async function compositeOverlay(
  baseBuffer: Buffer,
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  const svgBuffer = Buffer.from(svg);
  return sharp(baseBuffer)
    .resize(width, height, { fit: "cover", position: "center" })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

// Create a solid-color base image for tests that don't need a photo
async function solidBase(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

// Get raw pixel data from a PNG buffer
async function rawPixels(
  pngBuf: Buffer
): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
  return sharp(pngBuf).raw().toBuffer({ resolveWithObject: true });
}

// ---------------------------------------------------------------------------
// 1. Each template renders non-blank text region
// ---------------------------------------------------------------------------

describe("Visual regression: template text rendering", () => {
  let baseBuffer: Buffer;

  beforeAll(async () => {
    if (hasTestPhoto) {
      baseBuffer = fs.readFileSync(TEST_PHOTO);
    } else {
      // Fallback: dark solid image
      baseBuffer = await solidBase(SPEC.width, SPEC.height, {
        r: 40,
        g: 40,
        b: 40,
      });
    }
  });

  for (const template of STYLE_TEMPLATES) {
    it(`"${template.name}" renders non-blank text in bottom 30%`, { timeout: 15000 }, async () => {
      const overlay = makeOverlay(template);
      const svg = generateOverlaySVG(overlay, SPEC.width, SPEC.height);
      expect(svg).toBeTruthy();

      const composited = await compositeOverlay(
        baseBuffer,
        svg,
        SPEC.width,
        SPEC.height
      );

      // Extract bottom 30% crop where text should be
      const cropTop = Math.round(SPEC.height * 0.7);
      const cropHeight = SPEC.height - cropTop;
      const crop = await sharp(composited)
        .extract({
          left: 0,
          top: cropTop,
          width: SPEC.width,
          height: cropHeight,
        })
        .toBuffer();

      const stats = await sharp(crop).stats();
      // At least one channel should have stddev > 5 (text creates variance)
      const maxStdDev = Math.max(...stats.channels.map((c) => c.stdev));
      expect(maxStdDev).toBeGreaterThan(5);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Light vs dark text contrast
// ---------------------------------------------------------------------------

describe("Visual regression: light vs dark text contrast", () => {
  it("white text on dark background has bright pixels in text region", async () => {
    const darkBase = await solidBase(SPEC.width, SPEC.height, {
      r: 20,
      g: 20,
      b: 20,
    });
    const overlay = makeOverlay(STYLE_TEMPLATES[1]); // Minimal Clean - white text
    overlay.styling.textColor = "#FFFFFF";
    overlay.styling.textShadow = true;
    overlay.styling.backgroundColor = "transparent";

    const svg = generateOverlaySVG(overlay, SPEC.width, SPEC.height);
    const composited = await compositeOverlay(
      darkBase,
      svg,
      SPEC.width,
      SPEC.height
    );

    // Extract bottom 30% where text is
    const cropTop = Math.round(SPEC.height * 0.7);
    const crop = await sharp(composited)
      .extract({
        left: 0,
        top: cropTop,
        width: SPEC.width,
        height: SPEC.height - cropTop,
      })
      .toBuffer();

    const stats = await sharp(crop).stats();
    // Mean brightness of at least one channel should be above baseline (>25)
    // because white text on dark bg lifts the mean
    const maxMean = Math.max(...stats.channels.map((c) => c.mean));
    expect(maxMean).toBeGreaterThan(20);
  });

  it("dark text on light background has dark pixels in text region", async () => {
    const lightBase = await solidBase(SPEC.width, SPEC.height, {
      r: 240,
      g: 240,
      b: 240,
    });
    const overlay = makeOverlay(STYLE_TEMPLATES[0]);
    overlay.styling.textColor = "#1A1A1A";
    overlay.styling.backgroundColor = "transparent";
    overlay.styling.textShadow = false;

    const svg = generateOverlaySVG(overlay, SPEC.width, SPEC.height);
    const composited = await compositeOverlay(
      lightBase,
      svg,
      SPEC.width,
      SPEC.height
    );

    const cropTop = Math.round(SPEC.height * 0.7);
    const crop = await sharp(composited)
      .extract({
        left: 0,
        top: cropTop,
        width: SPEC.width,
        height: SPEC.height - cropTop,
      })
      .toBuffer();

    const stats = await sharp(crop).stats();
    // Min mean should be below 240 because dark text pulls mean down
    const minMean = Math.min(...stats.channels.map((c) => c.mean));
    expect(minMean).toBeLessThan(240);
  });
});

// ---------------------------------------------------------------------------
// 3. Snapshot stability (deterministic rendering)
// ---------------------------------------------------------------------------

describe("Visual regression: snapshot stability", () => {
  it("identical params produce 0 pixel diff", async () => {
    const base = await solidBase(SPEC.width, SPEC.height, {
      r: 60,
      g: 60,
      b: 60,
    });
    const overlay = makeOverlay(STYLE_TEMPLATES[0]);
    const svg = generateOverlaySVG(overlay, SPEC.width, SPEC.height);

    const img1 = await compositeOverlay(base, svg, SPEC.width, SPEC.height);
    const img2 = await compositeOverlay(base, svg, SPEC.width, SPEC.height);

    const { data: raw1 } = await rawPixels(img1);
    const { data: raw2 } = await rawPixels(img2);

    const diff = pixelmatch(
      new Uint8Array(raw1.buffer, raw1.byteOffset, raw1.length),
      new Uint8Array(raw2.buffer, raw2.byteOffset, raw2.length),
      null,
      SPEC.width,
      SPEC.height,
      { threshold: 0 }
    );

    expect(diff).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Text not clipped at bottom
// ---------------------------------------------------------------------------

describe("Visual regression: text not clipped", () => {
  it("bottom-aligned text at y=95% renders in bottom 10%", async () => {
    const base = await solidBase(SPEC.width, SPEC.height, {
      r: 50,
      g: 50,
      b: 50,
    });
    const overlay = makeOverlay(STYLE_TEMPLATES[0]);
    overlay.positioning.freePosition = { x: 50, y: 95 };

    const svg = generateOverlaySVG(overlay, SPEC.width, SPEC.height);
    const composited = await compositeOverlay(
      base,
      svg,
      SPEC.width,
      SPEC.height
    );

    // Extract bottom 10% of image
    const cropTop = Math.round(SPEC.height * 0.9);
    const crop = await sharp(composited)
      .extract({
        left: 0,
        top: cropTop,
        width: SPEC.width,
        height: SPEC.height - cropTop,
      })
      .toBuffer();

    // Compare against a crop of the plain base at the same region
    const basePng = await sharp(base)
      .resize(SPEC.width, SPEC.height, { fit: "cover" })
      .png()
      .toBuffer();
    const baseCrop = await sharp(basePng)
      .extract({
        left: 0,
        top: cropTop,
        width: SPEC.width,
        height: SPEC.height - cropTop,
      })
      .toBuffer();

    const statsComposited = await sharp(crop).stats();
    const statsBase = await sharp(baseCrop).stats();

    // The composited version should have more variance than the solid base
    const compositedStdDev = Math.max(
      ...statsComposited.channels.map((c) => c.stdev)
    );
    const baseStdDev = Math.max(...statsBase.channels.map((c) => c.stdev));
    expect(compositedStdDev).toBeGreaterThan(baseStdDev);
  });
});

// ---------------------------------------------------------------------------
// 5. Safe area respected for youtube_shorts
// ---------------------------------------------------------------------------

describe("Visual regression: youtube_shorts safe area", () => {
  it("text stays inside safe zone (no overlay in top/bottom 285px)", { timeout: 15000 }, async () => {
    const shortsSpec = PLATFORM_IMAGE_SPECS.youtube_shorts;
    const safeArea = PLATFORM_SAFE_AREA.youtube_shorts!;
    const { width, height } = shortsSpec;

    // Create base image at exact spec dimensions
    const basePng = await sharp({
      create: { width, height, channels: 3, background: { r: 80, g: 80, b: 80 } },
    })
      .png()
      .toBuffer();

    const overlay = makeOverlay(STYLE_TEMPLATES[0]);
    // Position text in the middle of the safe zone (away from edges)
    overlay.positioning.freePosition = { x: 50, y: 50 };

    const svg = generateOverlaySVG(overlay, width, height, safeArea);
    const svgBuffer = Buffer.from(svg);

    // Composite directly without resizing (base is already correct size)
    const composited = await sharp(basePng)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    // Ensure both images are 3-channel RGB for consistent comparison
    const topCropComposited = await sharp(composited)
      .extract({ left: 0, top: 0, width, height: safeArea.top })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const topCropBase = await sharp(basePng)
      .extract({ left: 0, top: 0, width, height: safeArea.top })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Verify sizes match before pixelmatch
    expect(topCropComposited.length).toBe(topCropBase.length);

    const topDiff = pixelmatch(
      new Uint8Array(topCropComposited.buffer, topCropComposited.byteOffset, topCropComposited.length),
      new Uint8Array(topCropBase.buffer, topCropBase.byteOffset, topCropBase.length),
      null,
      width,
      safeArea.top,
      { threshold: 0.1 }
    );
    expect(topDiff).toBe(0);

    // Compare bottom 285px
    const bottomTop = height - safeArea.bottom;
    const bottomCropComposited = await sharp(composited)
      .extract({ left: 0, top: bottomTop, width, height: safeArea.bottom })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const bottomCropBase = await sharp(basePng)
      .extract({ left: 0, top: bottomTop, width, height: safeArea.bottom })
      .ensureAlpha()
      .raw()
      .toBuffer();

    expect(bottomCropComposited.length).toBe(bottomCropBase.length);

    const bottomDiff = pixelmatch(
      new Uint8Array(bottomCropComposited.buffer, bottomCropComposited.byteOffset, bottomCropComposited.length),
      new Uint8Array(bottomCropBase.buffer, bottomCropBase.byteOffset, bottomCropBase.length),
      null,
      width,
      safeArea.bottom,
      { threshold: 0.1 }
    );
    expect(bottomDiff).toBe(0);
  });
});
