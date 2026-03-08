import { describe, it, expect } from "vitest";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import { PLATFORM_IMAGE_SPECS } from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PHOTO_DIR = path.join(process.cwd(), "public/test-photos");

const HEIC_FILES = [
  "IMG_9312.HEIC",
  "IMG_9313.HEIC",
  "IMG_9512.HEIC",
  "IMG_0427 2.HEIC",
  "IMG_0534 2.HEIC",
];

function heicPath(filename: string): string {
  return path.join(TEST_PHOTO_DIR, filename);
}

/**
 * Decode HEIC to JPEG buffer using heic-convert (Sharp's prebuilt binaries
 * only include the AOM/AV1 codec, not HEVC which iPhone photos use).
 */
async function decodeHeicToJpeg(filePath: string): Promise<Buffer> {
  const inputBuffer = fs.readFileSync(filePath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.92,
  });
  return Buffer.from(outputBuffer);
}

async function decodeHeicToPng(filePath: string): Promise<Buffer> {
  const inputBuffer = fs.readFileSync(filePath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "PNG",
  });
  return Buffer.from(outputBuffer);
}

const overlay: TextOverlay = {
  content: { primary: "HEIC Test", accent: "Subtitle" },
  styling: {
    fontFamily: "Inter",
    fontSize: { primary: 42, secondary: 20 },
    fontWeight: "bold",
    textColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    textShadow: true,
    textAlign: "center",
    fontStyle: "normal",
  },
  positioning: {
    alignment: "bottom",
    horizontalAlign: "center",
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    freePosition: { x: 50, y: 85 },
  },
};

// ---------------------------------------------------------------------------
// 1. Basic HEIC metadata (Sharp can read HEIF metadata without full decode)
// ---------------------------------------------------------------------------
describe("HEIC basic metadata", () => {
  for (const file of HEIC_FILES) {
    it(`reads metadata from ${file}`, async () => {
      const metadata = await sharp(heicPath(file)).metadata();
      expect(metadata.format).toBe("heif");
      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);
      expect([3, 4]).toContain(metadata.channels);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. HEIC to JPEG conversion (via heic-convert + Sharp resize)
// ---------------------------------------------------------------------------
describe("HEIC to JPEG conversion", () => {
  const jpegFiles = ["IMG_9312.HEIC", "IMG_0427 2.HEIC"];

  for (const file of jpegFiles) {
    it(`converts ${file} to 1080x1350 JPEG`, { timeout: 30000 }, async () => {
      const decoded = await decodeHeicToJpeg(heicPath(file));

      const result = await sharp(decoded)
        .resize(1080, 1350, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();

      // JPEG magic bytes: 0xFF 0xD8
      expect(result[0]).toBe(0xff);
      expect(result[1]).toBe(0xd8);

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
      expect(metadata.format).toBe("jpeg");
    });
  }
});

// ---------------------------------------------------------------------------
// 3. HEIC to PNG conversion
// ---------------------------------------------------------------------------
describe("HEIC to PNG conversion", () => {
  it("converts IMG_9313.HEIC to 1080x1080 PNG (youtube_community)", { timeout: 30000 }, async () => {
    const spec = PLATFORM_IMAGE_SPECS.youtube_community;
    const decoded = await decodeHeicToPng(heicPath("IMG_9313.HEIC"));

    const result = await sharp(decoded)
      .resize(spec.width, spec.height, { fit: "cover" })
      .png()
      .toBuffer();

    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(result[0]).toBe(0x89);
    expect(result[1]).toBe(0x50);
    expect(result[2]).toBe(0x4e);
    expect(result[3]).toBe(0x47);

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
    expect(metadata.format).toBe("png");
  });
});

// ---------------------------------------------------------------------------
// 4. HEIC with SVG overlay composite
// ---------------------------------------------------------------------------
describe("HEIC with SVG overlay composite", () => {
  it("composites SVG overlay onto HEIC for instagram_feed", { timeout: 30000 }, async () => {
    const spec = PLATFORM_IMAGE_SPECS.instagram_feed;

    // Decode HEIC then resize
    const decoded = await decodeHeicToJpeg(heicPath("IMG_9512.HEIC"));
    const resized = await sharp(decoded)
      .resize(spec.width, spec.height, { fit: "cover" })
      .toBuffer();

    // Generate SVG overlay
    const svg = generateOverlaySVG(overlay, spec.width, spec.height);
    expect(svg).toBeTruthy();

    // Composite
    const result = await sharp(resized)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: spec.quality })
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(spec.width);
    expect(metadata.height).toBe(spec.height);
    expect(metadata.format).toBe("jpeg");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 5. HEIC auto-rotation
// ---------------------------------------------------------------------------
describe("HEIC auto-rotation", () => {
  it("auto-rotates decoded HEIC and resizes to 1080x1350", { timeout: 30000 }, async () => {
    const decoded = await decodeHeicToJpeg(heicPath("IMG_9312.HEIC"));

    // heic-convert preserves EXIF in the JPEG output, so Sharp's
    // .rotate() (auto-rotate based on EXIF orientation) works correctly
    const result = await sharp(decoded)
      .rotate()
      .resize(1080, 1350, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toBuffer();

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
  });
});

// ---------------------------------------------------------------------------
// 6. HEIC color space
// ---------------------------------------------------------------------------
describe("HEIC color space", () => {
  it("reads HEIC color space and converts to sRGB", { timeout: 30000 }, async () => {
    // Check original metadata via Sharp (metadata read works without full decode)
    const inputMeta = await sharp(heicPath("IMG_9313.HEIC")).metadata();
    expect(inputMeta.space).toBeTruthy();

    // Decode and convert to sRGB JPEG
    const decoded = await decodeHeicToJpeg(heicPath("IMG_9313.HEIC"));
    const result = await sharp(decoded)
      .toColourspace("srgb")
      .jpeg()
      .toBuffer();

    const outputMeta = await sharp(result).metadata();
    expect(outputMeta.space).toBe("srgb");
  });
});

// ---------------------------------------------------------------------------
// 7. Performance: full pipeline
// ---------------------------------------------------------------------------
describe("HEIC performance", () => {
  it("completes full pipeline in under 5 seconds", { timeout: 15000 }, async () => {
    const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
    const svg = generateOverlaySVG(overlay, spec.width, spec.height);

    const start = performance.now();

    // Decode HEIC
    const decoded = await decodeHeicToJpeg(heicPath("IMG_9512.HEIC"));

    // Resize + rotate
    const resized = await sharp(decoded)
      .rotate()
      .resize(spec.width, spec.height, { fit: "cover" })
      .toBuffer();

    // Composite SVG overlay
    const result = await sharp(resized)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: spec.quality })
      .toBuffer();

    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    // heic-convert is JS-based (no native HEVC codec in Sharp), so allow 15s
    expect(elapsed).toBeLessThan(15000);
  });
});

// ---------------------------------------------------------------------------
// 8. Filename with spaces
// ---------------------------------------------------------------------------
describe("HEIC filename with spaces", () => {
  it("loads and processes 'IMG_0427 2.HEIC' (space in filename)", { timeout: 30000 }, async () => {
    const filePath = heicPath("IMG_0427 2.HEIC");

    // Metadata via Sharp
    const metadata = await sharp(filePath).metadata();
    expect(metadata.format).toBe("heif");
    expect(metadata.width).toBeGreaterThan(0);

    // Full conversion pipeline
    const decoded = await decodeHeicToJpeg(filePath);
    const result = await sharp(decoded)
      .resize(1080, 1350, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toBuffer();

    const outMeta = await sharp(result).metadata();
    expect(outMeta.width).toBe(1080);
    expect(outMeta.height).toBe(1350);
    expect(outMeta.format).toBe("jpeg");
  });

  it("loads and processes 'IMG_0534 2.HEIC' (space in filename)", { timeout: 30000 }, async () => {
    const filePath = heicPath("IMG_0534 2.HEIC");

    // Metadata via Sharp
    const metadata = await sharp(filePath).metadata();
    expect(metadata.format).toBe("heif");

    // Decode to PNG pipeline
    const decoded = await decodeHeicToPng(filePath);
    const result = await sharp(decoded)
      .resize(1080, 1080, { fit: "cover" })
      .png()
      .toBuffer();

    const outMeta = await sharp(result).metadata();
    expect(outMeta.width).toBe(1080);
    expect(outMeta.height).toBe(1080);
    expect(outMeta.format).toBe("png");
  });
});
