import { describe, it, expect } from "vitest";
import {
  generateProvenanceExif,
  generateWatermarkSVG,
  computeImageHash,
} from "@/lib/provenance";

describe("generateProvenanceExif", () => {
  it("returns correct EXIF fields", () => {
    const exif = generateProvenanceExif("JohnDoe", "abc123hash", "2024-06-15T10:30:00Z");
    expect(exif.Copyright).toBe("Made with JohnDoe");
    expect(exif.Artist).toBe("JohnDoe");
    expect(exif.Software).toBe("KodaPost");
    expect(exif.ImageDescription).toContain("SHA-256: abc123hash");
    expect(exif.ImageDescription).toContain("Created 2024-06-15T10:30:00Z");
  });

  it("handles empty creator name", () => {
    const exif = generateProvenanceExif("", "hash", "2024-01-01");
    expect(exif.Copyright).toBe("Made with ");
    expect(exif.Artist).toBe("");
  });
});

describe("generateWatermarkSVG", () => {
  it("returns valid SVG string", () => {
    const svg = generateWatermarkSVG("Test Watermark", 1080, 1350);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("Test Watermark");
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1350"');
  });

  it("respects custom options", () => {
    const svg = generateWatermarkSVG("Brand", 1080, 1350, {
      fontSize: 20,
      color: "#000",
      opacity: 0.3,
    });
    expect(svg).toContain('font-size="20"');
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('opacity="0.3"');
  });

  it("positions text relative to safe area", () => {
    const svg = generateWatermarkSVG("Brand", 1080, 1350, {
      safeArea: { top: 0, right: 100, bottom: 100, left: 0 },
    });
    // x = 1080 - 100 - 16 = 964, y = 1350 - 100 - 16 = 1234
    expect(svg).toContain('x="964"');
    expect(svg).toContain('y="1234"');
  });

  it("escapes XML characters in text", () => {
    const svg = generateWatermarkSVG("A & B <test>", 100, 100);
    expect(svg).toContain("A &amp; B &lt;test&gt;");
    expect(svg).not.toContain("A & B <test>");
  });
});

describe("computeImageHash", () => {
  it("returns a hex SHA-256 digest", () => {
    const buffer = Buffer.from("test image data");
    const hash = computeImageHash(buffer);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for same input", () => {
    const buffer = Buffer.from("deterministic");
    expect(computeImageHash(buffer)).toBe(computeImageHash(buffer));
  });

  it("differs for different inputs", () => {
    const a = computeImageHash(Buffer.from("aaa"));
    const b = computeImageHash(Buffer.from("bbb"));
    expect(a).not.toBe(b);
  });

  it("handles empty buffer", () => {
    const hash = computeImageHash(Buffer.from(""));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    // SHA-256 of empty string is known
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});
