/**
 * Server-side font embedding for SVG text overlays.
 *
 * Fetches Google Font woff2 files at runtime and returns base64-encoded
 * data URIs suitable for embedding in SVG @font-face declarations.
 * Cached in-memory across requests within the same serverless instance.
 */

// In-memory cache: "FontFamily:weight:italic" -> base64 woff2 data
const fontCache = new Map<string, string>();

// Cache for font families known to be unavailable on Google Fonts
const failedFonts = new Set<string>();

/** Timeout for individual fetch requests (CSS or font file) */
const FONT_FETCH_TIMEOUT_MS = 10_000;

interface FontFaceEntry {
  family: string;
  weight: number;
  italic: boolean;
  base64: string;
  unicodeRange?: string;
}

/** Fetch with an AbortController timeout to prevent indefinite hangs. */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = FONT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches all available weights/styles for a Google Font in a single API call.
 * Returns base64-encoded woff2 data for each available variant.
 *
 * Requests a broad range of weights (400,600,700,900) to cover:
 * - Regular text (400)
 * - Accent/secondary text (600)
 * - Bold headings (700)
 * - Black variants like "Montserrat Black" (900)
 *
 * Also fetches italic variants when requested.
 */
async function fetchFontVariants(
  fontFamily: string,
  weights: number[],
  includeItalic: boolean
): Promise<FontFaceEntry[]> {
  const results: FontFaceEntry[] = [];

  // Skip fonts known to be unavailable
  if (failedFonts.has(fontFamily)) return results;

  // We always fetch from Google because the CSS contains multiple unicode-range
  // subsets per weight. Caching individual subsets by weight alone loses data.
  // Instead, we cache by family-level "all variants fetched" flag.
  const allFetchedKey = `${fontFamily}:all:${includeItalic}`;
  if (fontCache.has(allFetchedKey)) {
    // Return all cached entries for this family
    const cached: FontFaceEntry[] = [];
    for (const [key, value] of fontCache.entries()) {
      if (key.startsWith(`${fontFamily}:face:`)) {
        cached.push(JSON.parse(value));
      }
    }
    if (cached.length > 0) return cached;
  }

  try {
    // Build Google Fonts CSS2 API URL with all weights
    // Format: family=Font+Name:ital,wght@0,400;0,700;1,400;1,700
    const weightSpecs: string[] = [];

    if (includeItalic) {
      for (const w of weights) {
        weightSpecs.push(`0,${w}`);
        weightSpecs.push(`1,${w}`);
      }
      weightSpecs.sort();
    } else {
      for (const w of weights) {
        weightSpecs.push(`${w}`);
      }
    }

    const axisPrefix = includeItalic ? "ital,wght" : "wght";
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:${axisPrefix}@${weightSpecs.join(";")}&display=swap`;

    const cssRes = await fetchWithTimeout(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!cssRes.ok) {
      console.warn(`[FontEmbed] CSS fetch failed for ${fontFamily}: ${cssRes.status}`);
      failedFonts.add(fontFamily);
      return results;
    }

    const css = await cssRes.text();

    // Parse all @font-face blocks from the CSS
    const faceRegex = /@font-face\s*\{([^}]+)\}/g;
    let faceMatch;
    const fontFilePromises: Promise<FontFaceEntry | null>[] = [];

    while ((faceMatch = faceRegex.exec(css)) !== null) {
      const block = faceMatch[1];

      // Extract weight
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : 400;

      // Extract style (normal vs italic)
      const styleMatch = block.match(/font-style:\s*(\w+)/);
      const isItalic = styleMatch?.[1] === "italic";

      // Extract unicode-range (critical: each @font-face covers a different subset)
      const rangeMatch = block.match(/unicode-range:\s*([^;]+)/);
      const unicodeRange = rangeMatch ? rangeMatch[1].trim() : undefined;

      // Only fetch latin and latin-ext subsets to keep payload size reasonable.
      // Latin contains U+0000-00FF, latin-ext contains U+0100-02BA or similar.
      // Skip cyrillic, greek, vietnamese, etc. subsets.
      if (unicodeRange && !unicodeRange.includes("U+0000-00FF") && !unicodeRange.includes("U+0100-02")) {
        continue;
      }

      // Extract woff2 URL
      const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
      if (!urlMatch) continue;

      // Fetch font files in parallel for speed
      const url = urlMatch[1];
      const faceIndex = fontFilePromises.length;
      fontFilePromises.push(
        fetchWithTimeout(url)
          .then(async (fontRes) => {
            if (!fontRes.ok) return null;
            const buf = await fontRes.arrayBuffer();
            const base64 = Buffer.from(buf).toString("base64");
            const entry: FontFaceEntry = { family: fontFamily, weight, italic: isItalic, base64, unicodeRange };
            // Cache each face individually
            const cacheKey = `${fontFamily}:face:${weight}:${isItalic ? "italic" : "normal"}:${faceIndex}`;
            fontCache.set(cacheKey, JSON.stringify(entry));
            return entry;
          })
          .catch(() => null)
      );
    }

    // Wait for all font file downloads (with individual timeouts)
    const fontResults = await Promise.all(fontFilePromises);
    for (const entry of fontResults) {
      if (entry) results.push(entry);
    }

    // Mark this family as fully fetched for caching
    if (results.length > 0) {
      fontCache.set(allFetchedKey, "1");
    }

    if (results.length === 0 && fontFilePromises.length === 0) {
      // Google Fonts returned CSS but it contained no @font-face blocks
      console.warn(`[FontEmbed] No @font-face blocks found for ${fontFamily}`);
      failedFonts.add(fontFamily);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[FontEmbed] Timeout fetching ${fontFamily} (>${FONT_FETCH_TIMEOUT_MS}ms)`);
    } else {
      console.warn(`[FontEmbed] Failed to fetch ${fontFamily}:`, err);
    }
  }

  return results;
}

export interface FontRequest {
  family: string;
  italic: boolean;
}

export interface FontEmbedResult {
  /** SVG <style> block with @font-face declarations, or empty string */
  styleBlock: string;
  /** Font families that were successfully embedded */
  embedded: string[];
  /** Font families that failed to load (timeout, 404, no @font-face blocks) */
  failed: string[];
}

/**
 * Builds a single SVG <style> block with @font-face declarations for all
 * requested fonts. Fetches all standard weights (400, 600, 700, 900) to
 * ensure coverage for primary text, accent text, and bold/black variants.
 *
 * Returns both the style block and status of each font family so the
 * caller can warn about missing fonts.
 */
export async function buildEmbeddedFontStyles(
  fonts: FontRequest[]
): Promise<string>;
export async function buildEmbeddedFontStyles(
  fonts: FontRequest[],
  options: { detailed: true }
): Promise<FontEmbedResult>;
export async function buildEmbeddedFontStyles(
  fonts: FontRequest[],
  options?: { detailed: true }
): Promise<string | FontEmbedResult> {
  // Standard weights to fetch for each font
  const STANDARD_WEIGHTS = [400, 600, 700, 900];

  // Deduplicate font families, merge italic flags
  const familyMap = new Map<string, boolean>();
  for (const f of fonts) {
    const existing = familyMap.get(f.family) ?? false;
    familyMap.set(f.family, existing || f.italic);
  }

  // Fetch all font variants in parallel
  const allEntries = await Promise.all(
    Array.from(familyMap.entries()).map(([family, needsItalic]) =>
      fetchFontVariants(family, STANDARD_WEIGHTS, needsItalic)
    )
  );

  // Track which families succeeded vs failed
  const embedded: string[] = [];
  const failed: string[] = [];
  const familyNames = Array.from(familyMap.keys());
  for (let i = 0; i < familyNames.length; i++) {
    if (allEntries[i].length > 0) {
      embedded.push(familyNames[i]);
    } else {
      failed.push(familyNames[i]);
    }
  }

  const entries = allEntries.flat();
  if (entries.length === 0) {
    if (options?.detailed) return { styleBlock: "", embedded, failed };
    return "";
  }

  const faces = entries.map(
    (e) =>
      `@font-face {
      font-family: '${e.family}';
      font-weight: ${e.weight};
      font-style: ${e.italic ? "italic" : "normal"};
      src: url(data:font/woff2;base64,${e.base64}) format('woff2');${e.unicodeRange ? `\n      unicode-range: ${e.unicodeRange};` : ""}
    }`
  );

  const styleBlock = `<style>${faces.join("\n    ")}</style>`;
  if (options?.detailed) return { styleBlock, embedded, failed };
  return styleBlock;
}

