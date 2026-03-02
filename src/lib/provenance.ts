import { createHash } from "crypto";

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
    Copyright: `Made with KodaPost by ${creatorName}`,
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

/** Escape special XML characters in text content. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
