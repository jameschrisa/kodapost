import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildEmbeddedFontStyles } from "@/lib/font-embed";
import type { FontRequest } from "@/lib/font-embed";

// Mock CSS response from Google Fonts API.
// Produces MULTIPLE @font-face blocks per weight to simulate Google Fonts'
// Unicode subset splitting (cyrillic-ext, cyrillic, latin-ext, latin, etc.).
// This is critical because the original bug was caused by missing unicode-range
// in the output — the code downloaded all subsets but dropped the unicode-range
// property, causing librsvg to use the cyrillic-ext font (no Latin glyphs) for
// Latin text, producing tofu (□□□□).
const MOCK_SUBSETS = [
  { comment: "cyrillic-ext", range: "U+0460-052F, U+1C80-1C8A, U+20B4" },
  { comment: "cyrillic", range: "U+0301, U+0400-045F, U+0490-0491" },
  { comment: "latin-ext", range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC" },
  { comment: "latin", range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC" },
];

const mockCssResponse = (family: string, weight = 400, italic = false, subset = MOCK_SUBSETS[3]) => `
/* ${subset.comment} */
@font-face {
  font-family: '${family}';
  font-style: ${italic ? "italic" : "normal"};
  font-weight: ${weight};
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/${family.toLowerCase().replace(/ /g, "")}/v1/test-${weight}${italic ? "i" : ""}-${subset.comment}.woff2) format('woff2');
  unicode-range: ${subset.range};
}`;

const mockMultiWeightCss = (family: string, weights: number[], includeItalic: boolean) => {
  const blocks: string[] = [];
  for (const w of weights) {
    // Each weight gets ALL subsets, just like real Google Fonts responses
    for (const subset of MOCK_SUBSETS) {
      blocks.push(mockCssResponse(family, w, false, subset));
      if (includeItalic) {
        blocks.push(mockCssResponse(family, w, true, subset));
      }
    }
  }
  return blocks.join("\n");
};

// Simple fake font binary data
const fakeFontBuffer = new ArrayBuffer(8);

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function setupMockFetch(families: { family: string; italic: boolean }[]) {
  mockFetch.mockImplementation(async (url: string) => {
    // CSS API request
    if (url.startsWith("https://fonts.googleapis.com/css2")) {
      const matchedFamily = families.find((f) =>
        url.includes(encodeURIComponent(f.family))
      );
      if (!matchedFamily) {
        return { ok: false, status: 404 };
      }
      const css = mockMultiWeightCss(
        matchedFamily.family,
        [400, 600, 700, 900],
        matchedFamily.italic
      );
      return { ok: true, text: async () => css };
    }
    // woff2 font file request
    if (url.includes("fonts.gstatic.com")) {
      return { ok: true, arrayBuffer: async () => fakeFontBuffer };
    }
    return { ok: false, status: 404 };
  });
}

// ---------------------------------------------------------------------------
// buildEmbeddedFontStyles
// ---------------------------------------------------------------------------
describe("buildEmbeddedFontStyles", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Clear the module-level font cache by re-importing would be complex,
    // so we rely on test ordering and unique font names where cache matters.
  });

  it("returns a style block with embedded @font-face declarations", async () => {
    setupMockFetch([{ family: "Inter", italic: false }]);

    const result = await buildEmbeddedFontStyles([{ family: "Inter", italic: false }]);

    expect(result).toContain("<style>");
    expect(result).toContain("</style>");
    expect(result).toContain("@font-face");
    expect(result).toContain("font-family: 'Inter'");
    expect(result).toContain("base64,");
    expect(result).toContain("format('woff2')");
  });

  it("deduplicates identical font requests", async () => {
    setupMockFetch([{ family: "Roboto", italic: false }]);

    await buildEmbeddedFontStyles([
      { family: "Roboto", italic: false },
      { family: "Roboto", italic: false },
    ]);

    // Should only make one CSS API call, not two
    const cssCalls = mockFetch.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].startsWith("https://fonts.googleapis.com")
    );
    expect(cssCalls).toHaveLength(1);
  });

  it("handles italic requests with ital,wght axis", async () => {
    setupMockFetch([{ family: "Bodoni Moda", italic: true }]);

    const result = await buildEmbeddedFontStyles([
      { family: "Bodoni Moda", italic: true },
    ]);

    // Verify the CSS API URL includes ital,wght
    const cssCall = mockFetch.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].startsWith("https://fonts.googleapis.com")
    );
    expect(cssCall).toBeDefined();
    expect(cssCall![0]).toContain("ital,wght");

    // Should contain italic font-style in result
    expect(result).toContain("font-style: italic");
  });

  it("returns empty string for empty input", async () => {
    const result = await buildEmbeddedFontStyles([]);
    expect(result).toBe("");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("caches font data across calls", async () => {
    // Use a unique family name to avoid cache pollution from other tests
    setupMockFetch([{ family: "Lato", italic: false }]);

    const result1 = await buildEmbeddedFontStyles([{ family: "Lato", italic: false }]);
    const callCountAfterFirst = mockFetch.mock.calls.length;

    const result2 = await buildEmbeddedFontStyles([{ family: "Lato", italic: false }]);
    const callCountAfterSecond = mockFetch.mock.calls.length;

    // Both should produce output
    expect(result1).toContain("@font-face");
    expect(result2).toContain("@font-face");

    // Second call should not trigger additional fetches (served from cache)
    expect(callCountAfterSecond).toBe(callCountAfterFirst);
  });

  it("returns empty string on fetch failure (graceful degradation)", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const result = await buildEmbeddedFontStyles([
      { family: "NonExistentFont", italic: false },
    ]);

    expect(result).toBe("");
  });

  it("preserves unicode-range in @font-face output (prevents tofu bug)", async () => {
    setupMockFetch([{ family: "Inter", italic: false }]);

    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    expect(result.embedded).toContain("Inter");

    // Every @font-face block MUST include unicode-range.
    // Without it, librsvg picks the first @font-face (cyrillic-ext subset)
    // which has no Latin glyphs, producing tofu (□□□□) instead of text.
    const blocks = result.styleBlock.match(/@font-face\s*\{[^}]+\}/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block, "Every @font-face must include unicode-range to prevent tofu").toMatch(
        /unicode-range:/
      );
    }
  });

  it("filters out non-latin subsets (cyrillic, greek, etc.)", async () => {
    setupMockFetch([{ family: "Inter", italic: false }]);

    const result = await buildEmbeddedFontStyles(
      [{ family: "Inter", italic: false }],
      { detailed: true }
    );

    // Should NOT contain cyrillic or other non-latin ranges
    expect(result.styleBlock).not.toContain("U+0460-052F"); // cyrillic-ext
    expect(result.styleBlock).not.toContain("U+0400-045F"); // cyrillic

    // SHOULD contain latin ranges
    expect(result.styleBlock).toContain("U+0000-00FF"); // latin
    expect(result.styleBlock).toContain("U+0100-02BA"); // latin-ext
  });

  it("handles multiple font families", async () => {
    setupMockFetch([
      { family: "Montserrat", italic: false },
      { family: "Playfair Display", italic: false },
    ]);

    const result = await buildEmbeddedFontStyles([
      { family: "Montserrat", italic: false },
      { family: "Playfair Display", italic: false },
    ]);

    expect(result).toContain("font-family: 'Montserrat'");
    expect(result).toContain("font-family: 'Playfair Display'");
  });

  it("detailed mode returns embedded and failed font lists", async () => {
    // "Oswald" will succeed, "FakeFont" will 404
    setupMockFetch([{ family: "Oswald", italic: false }]);

    const result = await buildEmbeddedFontStyles(
      [
        { family: "Oswald", italic: false },
        { family: "FakeFont", italic: false },
      ],
      { detailed: true }
    );

    expect(result.embedded).toContain("Oswald");
    expect(result.failed).toContain("FakeFont");
    expect(result.styleBlock).toContain("font-family: 'Oswald'");
    expect(result.styleBlock).not.toContain("FakeFont");
  });

  it("times out on slow fetches instead of hanging", async () => {
    // Mock a fetch that respects AbortSignal but takes too long
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ ok: false, status: 408 }), 60_000);
        // Listen for abort signal (this is how real fetch works)
        options?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const start = Date.now();
    const result = await buildEmbeddedFontStyles([
      { family: "SlowFont", italic: false },
    ]);
    const elapsed = Date.now() - start;

    expect(result).toBe("");
    // Should abort within ~10s (FONT_FETCH_TIMEOUT_MS), not 60s
    expect(elapsed).toBeLessThan(15_000);
  }, 20_000);
});
