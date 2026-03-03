import { createHash } from "crypto";
import sharp from "sharp";

// -----------------------------------------------------------------------------
// Provenance Utilities
// EXIF metadata embedding, SHA-256 image hashing, and visible watermark SVG
// for creator attribution and content provenance tracking.
// -----------------------------------------------------------------------------

/**
 * Generates EXIF IFD0 metadata object for embedding creator provenance.
 * Compatible with Sharp's `withMetadata({ exif })` API.
 */
export function generateProvenanceExif(
  creatorName: string,
  imageHash: string,
  createdAt: string
): Record<string, string> {
  return {
    Copyright: `Made with ${creatorName}`,
    Artist: creatorName,
    Software: "KodaPost",
    ImageDescription: `Created ${createdAt} | SHA-256: ${imageHash}`,
  };
}

/**
 * Generates an SVG string for a semi-transparent watermark overlay.
 * Composited onto export images via Sharp's SVG composite.
 */
export function generateWatermarkSVG(
  text: string,
  width: number,
  height: number,
  options: {
    fontSize?: number;
    color?: string;
    opacity?: number;
    safeArea?: { top: number; right: number; bottom: number; left: number };
  } = {}
): string {
  const {
    fontSize = 14,
    color = "#fff",
    opacity = 0.6,
    safeArea = { top: 0, right: 0, bottom: 0, left: 0 },
  } = options;

  // Position in bottom-right corner, respecting safe areas
  const x = width - safeArea.right - 16;
  const y = height - safeArea.bottom - 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text
    x="${x}"
    y="${y}"
    font-family="sans-serif"
    font-size="${fontSize}"
    fill="${color}"
    opacity="${opacity}"
    text-anchor="end"
    dominant-baseline="auto"
  >${escapeXml(text)}</text>
</svg>`;
}

/**
 * Computes a SHA-256 hex digest of an image buffer.
 */
export function computeImageHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Maps position strings to Sharp gravity values for logo placement.
 */
const POSITION_TO_GRAVITY: Record<string, string> = {
  southeast: "southeast",
  southwest: "southwest",
  northeast: "northeast",
  northwest: "northwest",
  center: "center",
};

/**
 * Composites a logo watermark onto an image pipeline using Sharp.
 * Resizes the logo to `scale * imageWidth`, applies opacity, and positions it.
 */
export async function applyLogoWatermark(
  pipeline: sharp.Sharp,
  logoBuffer: Buffer,
  imageWidth: number,
  imageHeight: number,
  options: {
    position: string;
    opacity: number;
    scale: number;
    safeArea?: { top: number; right: number; bottom: number; left: number };
  }
): Promise<sharp.Sharp> {
  const { position, opacity, scale, safeArea } = options;
  const targetWidth = Math.round(scale * imageWidth);

  // Resize logo to target width, preserving aspect ratio
  const resizedLogo = sharp(logoBuffer).resize(targetWidth, undefined, {
    fit: "inside",
    withoutEnlargement: false,
  });

  // Get resized dimensions for positioning
  const resizedMeta = await resizedLogo.clone().metadata();
  const logoW = resizedMeta.width ?? targetWidth;
  const logoH = resizedMeta.height ?? targetWidth;

  // Apply opacity by compositing with a translucent rectangle using dest-in blend
  const opacityOverlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${logoW}" height="${logoH}">
      <rect width="${logoW}" height="${logoH}" fill="white" opacity="${opacity}" />
    </svg>`
  );

  const logoWithOpacity = await resizedLogo
    .ensureAlpha()
    .composite([{ input: opacityOverlay, blend: "dest-in" }])
    .png()
    .toBuffer();

  // Calculate position offsets based on gravity and safe area
  const margin = 16;
  const sTop = safeArea?.top ?? 0;
  const sRight = safeArea?.right ?? 0;
  const sBottom = safeArea?.bottom ?? 0;
  const sLeft = safeArea?.left ?? 0;

  let top: number;
  let left: number;
  const gravity = POSITION_TO_GRAVITY[position] ?? "southeast";

  switch (gravity) {
    case "northwest":
      top = sTop + margin;
      left = sLeft + margin;
      break;
    case "northeast":
      top = sTop + margin;
      left = imageWidth - logoW - sRight - margin;
      break;
    case "southwest":
      top = imageHeight - logoH - sBottom - margin;
      left = sLeft + margin;
      break;
    case "center":
      top = Math.round((imageHeight - logoH) / 2);
      left = Math.round((imageWidth - logoW) / 2);
      break;
    case "southeast":
    default:
      top = imageHeight - logoH - sBottom - margin;
      left = imageWidth - logoW - sRight - margin;
      break;
  }

  // Clamp to valid range
  top = Math.max(0, top);
  left = Math.max(0, left);

  return pipeline.composite([{ input: logoWithOpacity, top, left }]);
}

/** Escape special XML characters in text content. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
