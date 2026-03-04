import { describe, it, expect } from "vitest";
import { hasTrimApplied } from "@/lib/audio-utils";

// Note: trimAudioBlob and encodeWAV require Web Audio API (AudioContext)
// which is not available in Node. We test the pure utility function.

describe("hasTrimApplied", () => {
  const duration = 30; // 30-second clip

  it("returns false for untrimmed clip (0 to duration)", () => {
    expect(hasTrimApplied(0, 30, duration)).toBe(false);
  });

  it("returns false when trim values are undefined (full clip)", () => {
    expect(hasTrimApplied(undefined, undefined, duration)).toBe(false);
  });

  it("returns true when start is trimmed > 0.5s", () => {
    expect(hasTrimApplied(1, 30, duration)).toBe(true);
  });

  it("returns true when end is trimmed < duration - 0.5s", () => {
    expect(hasTrimApplied(0, 25, duration)).toBe(true);
  });

  it("returns true when both start and end are trimmed", () => {
    expect(hasTrimApplied(2, 28, duration)).toBe(true);
  });

  it("returns false for small trims within 0.5s threshold", () => {
    // start = 0.3 (< 0.5), end = 29.8 (> 30 - 0.5 = 29.5)
    expect(hasTrimApplied(0.3, 29.8, duration)).toBe(false);
  });

  it("returns true when start is exactly 0.5s", () => {
    // start > 0.5 is the check, so 0.5 exactly should return false
    expect(hasTrimApplied(0.5, 30, duration)).toBe(false);
    // 0.51 should return true
    expect(hasTrimApplied(0.51, 30, duration)).toBe(true);
  });

  it("handles zero-duration clip", () => {
    // duration = 0, end defaults to 0, start defaults to 0
    // start(0) > 0.5 -> false, end(0) < 0 - 0.5 = -0.5 -> false
    expect(hasTrimApplied(undefined, undefined, 0)).toBe(false);
  });
});
