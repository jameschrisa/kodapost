import { describe, it, expect } from "vitest";
import { calculateImageSourceStrategy, getSlideType } from "@/lib/image-source-calculator";

describe("getSlideType", () => {
  it("first slide is always hook", () => {
    expect(getSlideType(0, 5)).toBe("hook");
    expect(getSlideType(0, 1)).toBe("hook");
  });

  it("last slide is always closer (when > 1 slide)", () => {
    expect(getSlideType(4, 5)).toBe("closer");
    expect(getSlideType(2, 3)).toBe("closer");
  });

  it("single slide is both hook and closer (hook wins)", () => {
    // position 0 = hook, and position 0 = totalSlides - 1 = closer
    // function checks hook first, so it returns "hook"
    expect(getSlideType(0, 1)).toBe("hook");
  });

  it("middle slides are story", () => {
    expect(getSlideType(1, 5)).toBe("story");
    expect(getSlideType(2, 5)).toBe("story");
    expect(getSlideType(3, 5)).toBe("story");
  });
});

describe("calculateImageSourceStrategy", () => {
  it("allocates all uploads sequentially when images >= slides", () => {
    const result = calculateImageSourceStrategy(5, 5);
    expect(result.totalSlides).toBe(5);
    expect(result.uploadedImages).toBe(5);
    expect(result.ratio.percentage).toBe(100);
    expect(result.meetsRecommendation).toBe(true);
    expect(result.sourceAllocation).toHaveLength(5);
    expect(result.sourceAllocation.every((s) => s.source === "user_upload")).toBe(true);
  });

  it("marks extra slots as text_only when images < slides", () => {
    const result = calculateImageSourceStrategy(2, 5);
    expect(result.uploadedImages).toBe(2);
    expect(result.ratio.uploaded).toBe(2);
    expect(result.ratio.generated).toBe(3); // text_only slots
    expect(result.ratio.percentage).toBe(40); // 2/5 = 40%
    expect(result.sourceAllocation[0].source).toBe("user_upload");
    expect(result.sourceAllocation[1].source).toBe("user_upload");
    expect(result.sourceAllocation[2].source).toBe("text_only");
    expect(result.sourceAllocation[3].source).toBe("text_only");
    expect(result.sourceAllocation[4].source).toBe("text_only");
  });

  it("caps uploaded images to slide count", () => {
    const result = calculateImageSourceStrategy(10, 3);
    expect(result.uploadedImages).toBe(3);
    expect(result.ratio.generated).toBe(0);
    expect(result.ratio.percentage).toBe(100);
  });

  it("handles zero uploaded images", () => {
    const result = calculateImageSourceStrategy(0, 5);
    expect(result.uploadedImages).toBe(0);
    expect(result.meetsRecommendation).toBe(false);
    expect(result.ratio.percentage).toBe(0);
    expect(result.sourceAllocation.every((s) => s.source === "text_only")).toBe(true);
  });

  it("handles zero slides", () => {
    const result = calculateImageSourceStrategy(5, 0);
    expect(result.totalSlides).toBe(0);
    expect(result.ratio.percentage).toBe(0);
    expect(result.sourceAllocation).toHaveLength(0);
  });

  it("always reports requiredAIGenerated as 0", () => {
    const result = calculateImageSourceStrategy(1, 5);
    expect(result.requiredAIGenerated).toBe(0);
  });

  it("sequential allocation assigns referenceImageIndex correctly", () => {
    const result = calculateImageSourceStrategy(3, 5);
    expect(result.sourceAllocation[0].referenceImageIndex).toBe(0);
    expect(result.sourceAllocation[1].referenceImageIndex).toBe(1);
    expect(result.sourceAllocation[2].referenceImageIndex).toBe(2);
    expect(result.sourceAllocation[3].referenceImageIndex).toBeUndefined();
  });

  it("defaults to sequential allocation mode", () => {
    const result = calculateImageSourceStrategy(3, 5);
    expect(result.allocationMode).toBe("sequential");
  });

  it("smart_auto and manual fall back to sequential for MVP", () => {
    const smart = calculateImageSourceStrategy(3, 5, "smart_auto");
    const manual = calculateImageSourceStrategy(3, 5, "manual");
    expect(smart.allocationMode).toBe("smart_auto");
    expect(manual.allocationMode).toBe("manual");
    // Both produce same allocation as sequential
    const seq = calculateImageSourceStrategy(3, 5, "sequential");
    expect(smart.sourceAllocation).toEqual(seq.sourceAllocation);
    expect(manual.sourceAllocation).toEqual(seq.sourceAllocation);
  });
});
