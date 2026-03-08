import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import { PLATFORM_IMAGE_SPECS, PLATFORM_SAFE_AREA } from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PHOTO_DIR = path.join(process.cwd(), "public/test-photos");

// Available test photos (testreal2 does not exist)
const TEST_PHOTOS = [1, 3, 4, 5, 6, 7, 8].map((n) =>
  path.join(TEST_PHOTO_DIR, `testreal${n}.jpg`)
);

const hasTestPhotos = TEST_PHOTOS.every((p) => fs.existsSync(p));

function makeOverlay(): TextOverlay {
  return {
    content: { primary: "Headline Text Here", accent: "Subtitle line" },
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
}

async function compositeSlide(
  photoPath: string,
  width: number,
  height: number,
  quality: number,
  format: "jpeg" | "png" = "jpeg"
): Promise<Buffer> {
  const overlay = makeOverlay();
  const safeArea =
    width === 1080 && height === 1920
      ? PLATFORM_SAFE_AREA.youtube_shorts
      : undefined;
  const svg = generateOverlaySVG(overlay, width, height, safeArea);
  const svgBuffer = Buffer.from(svg);

  let pipeline = sharp(photoPath)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: svgBuffer, top: 0, left: 0 }]);

  if (format === "png") {
    return pipeline.png({ quality }).toBuffer();
  }
  return pipeline.jpeg({ quality }).toBuffer();
}

async function compositeSlideNoOverlay(
  photoPath: string,
  width: number,
  height: number,
  quality: number
): Promise<Buffer> {
  return sharp(photoPath)
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Payload size guards", { timeout: 30000 }, () => {
  // 1. Single slide JPEG size per platform
  // 9:16 formats have 42% more pixels than 4:5, so they get a higher budget
  describe("single slide JPEG size per platform", () => {
    const specs = [
      { key: "instagram_feed" as const, label: "Instagram 4:5", maxBytes: 524288 },
      { key: "youtube_shorts" as const, label: "YouTube Shorts 9:16", maxBytes: 614400 },
      { key: "youtube_community" as const, label: "YouTube Community 1:1", maxBytes: 524288 },
    ];

    for (const { key, label, maxBytes } of specs) {
      it.skipIf(!hasTestPhotos)(
        `${label} single slide < ${Math.round(maxBytes / 1024)}KB`,
        async () => {
          const spec = PLATFORM_IMAGE_SPECS[key];
          const buf = await compositeSlide(
            TEST_PHOTOS[0],
            spec.width,
            spec.height,
            spec.quality
          );
          expect(buf.length).toBeLessThan(maxBytes);
        }
      );
    }
  });

  // 2. Single slide PNG size (linkedin_pdf)
  it.skipIf(!hasTestPhotos)(
    "linkedin_pdf single slide PNG < 1.5MB",
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.linkedin_pdf;
      const buf = await compositeSlide(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        spec.quality,
        "png"
      );
      expect(buf.length).toBeLessThan(1572864);
    }
  );

  // 3. 10-slide batch total (instagram_feed)
  // Uses q80 to stay within Vercel 6MB payload limit (5MB budget with overhead)
  it.skipIf(!hasTestPhotos)(
    "10-slide instagram_feed batch base64 < 5MB at q80",
    { timeout: 60000 },
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
      // 7 unique photos + repeat first 3 to make 10
      const photos = [...TEST_PHOTOS, TEST_PHOTOS[0], TEST_PHOTOS[1], TEST_PHOTOS[2]];
      expect(photos).toHaveLength(10);

      let totalBase64 = 0;
      for (const photo of photos) {
        const buf = await compositeSlide(
          photo,
          spec.width,
          spec.height,
          80
        );
        const b64 = buf.toString("base64");
        totalBase64 += b64.length;
      }

      expect(totalBase64).toBeLessThan(5242880);
    }
  );

  // 4. 9:16 quality reduction effectiveness
  it.skipIf(!hasTestPhotos)(
    "youtube_shorts q80 is at least 15% smaller than q90",
    { timeout: 30000 },
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.youtube_shorts;
      const q90 = await compositeSlide(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        90
      );
      const q80 = await compositeSlide(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        80
      );
      const reduction = 1 - q80.length / q90.length;
      expect(reduction).toBeGreaterThanOrEqual(0.15);
    }
  );

  // 5. Quality parameter monotonic decrease
  it.skipIf(!hasTestPhotos)(
    "JPEG size decreases monotonically with quality (90 > 80 > 70)",
    { timeout: 30000 },
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
      const sizes = await Promise.all(
        [90, 80, 70].map(async (q) => {
          const buf = await compositeSlide(
            TEST_PHOTOS[0],
            spec.width,
            spec.height,
            q
          );
          return buf.length;
        })
      );
      expect(sizes[0]).toBeGreaterThan(sizes[1]);
      expect(sizes[1]).toBeGreaterThan(sizes[2]);
    }
  );

  // 6. Text overlay size impact
  it.skipIf(!hasTestPhotos)(
    "SVG overlay adds less than 15% to file size",
    { timeout: 30000 },
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
      const withOverlay = await compositeSlide(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        spec.quality
      );
      const withoutOverlay = await compositeSlideNoOverlay(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        spec.quality
      );
      const overhead = withOverlay.length / withoutOverlay.length - 1;
      expect(overhead).toBeLessThan(0.15);
    }
  );

  // 7. Multi-platform total estimate
  it.skipIf(!hasTestPhotos)(
    "5 slides across 3 platforms (15 images) < 10MB raw",
    { timeout: 120000 },
    async () => {
      const platforms = [
        PLATFORM_IMAGE_SPECS.instagram_feed,
        PLATFORM_IMAGE_SPECS.youtube_shorts,
        PLATFORM_IMAGE_SPECS.youtube_community,
      ] as const;

      const photos = TEST_PHOTOS.slice(0, 5);
      let totalSize = 0;

      for (const spec of platforms) {
        for (const photo of photos) {
          const buf = await compositeSlide(
            photo,
            spec.width,
            spec.height,
            spec.quality
          );
          totalSize += buf.length;
        }
      }

      expect(totalSize).toBeLessThan(10 * 1024 * 1024);
    }
  );

  // 8. Base64 encoding overhead
  it.skipIf(!hasTestPhotos)(
    "base64 encoding overhead is between 1.33x and 1.34x",
    async () => {
      const spec = PLATFORM_IMAGE_SPECS.instagram_feed;
      const buf = await compositeSlide(
        TEST_PHOTOS[0],
        spec.width,
        spec.height,
        spec.quality
      );
      const b64 = buf.toString("base64");
      const ratio = b64.length / buf.length;
      expect(ratio).toBeGreaterThanOrEqual(1.33);
      expect(ratio).toBeLessThanOrEqual(1.34);
    }
  );
});
