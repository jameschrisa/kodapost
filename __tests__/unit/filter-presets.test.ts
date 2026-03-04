import { describe, it, expect } from "vitest";
import {
  PREDEFINED_FILTERS,
  CAMERA_FILTER_MAP,
  FILTER_NAME_ORDER,
  DEFAULT_FILTER_CONFIG,
} from "@/lib/filter-presets";
import type { PredefinedFilterName } from "@/lib/types";

describe("PREDEFINED_FILTERS", () => {
  it("contains all expected filter names", () => {
    const expectedNames: PredefinedFilterName[] = [
      "none", "1977", "earlybird", "lofi", "nashville",
      "toaster", "kelvin", "xpro2", "inkwell",
    ];
    for (const name of expectedNames) {
      expect(PREDEFINED_FILTERS[name]).toBeDefined();
    }
  });

  it("each filter has required fields", () => {
    for (const [key, filter] of Object.entries(PREDEFINED_FILTERS)) {
      expect(filter.name).toBeTruthy();
      expect(filter.description).toBeTruthy();
      expect(filter.cssFilter).toBeTruthy();
      expect(filter.defaultCustomParams).toBeDefined();
      expect(typeof filter.defaultCustomParams.grain_amount).toBe("number");
      expect(typeof filter.defaultCustomParams.bloom_diffusion).toBe("number");
      expect(typeof filter.defaultCustomParams.shadow_fade).toBe("number");
      expect(typeof filter.defaultCustomParams.color_bias).toBe("number");
      expect(typeof filter.defaultCustomParams.vignette_depth).toBe("number");
    }
  });

  it("none filter has all-zero default params", () => {
    const none = PREDEFINED_FILTERS.none;
    expect(none.defaultCustomParams.grain_amount).toBe(0);
    expect(none.defaultCustomParams.bloom_diffusion).toBe(0);
    expect(none.defaultCustomParams.shadow_fade).toBe(0);
    expect(none.defaultCustomParams.color_bias).toBe(0);
    expect(none.defaultCustomParams.vignette_depth).toBe(0);
  });

  it("none filter uses no CSS filter", () => {
    expect(PREDEFINED_FILTERS.none.cssFilter).toBe("none");
  });
});

describe("CAMERA_FILTER_MAP", () => {
  it("maps all 10 camera IDs", () => {
    for (let id = 1; id <= 10; id++) {
      expect(CAMERA_FILTER_MAP[id]).toBeDefined();
      expect(CAMERA_FILTER_MAP[id].filter).toBeTruthy();
      expect(CAMERA_FILTER_MAP[id].customParams).toBeDefined();
    }
  });

  it("each mapping references a valid predefined filter", () => {
    const validFilters = Object.keys(PREDEFINED_FILTERS);
    for (const mapping of Object.values(CAMERA_FILTER_MAP)) {
      expect(validFilters).toContain(mapping.filter);
    }
  });

  it("Polaroid 600 maps to toaster", () => {
    expect(CAMERA_FILTER_MAP[9].filter).toBe("toaster");
  });

  it("iPhone 3G maps to 1977", () => {
    expect(CAMERA_FILTER_MAP[10].filter).toBe("1977");
  });

  it("Sony Mavica maps to inkwell", () => {
    expect(CAMERA_FILTER_MAP[1].filter).toBe("inkwell");
  });
});

describe("FILTER_NAME_ORDER", () => {
  it("starts with none", () => {
    expect(FILTER_NAME_ORDER[0]).toBe("none");
  });

  it("contains all 9 predefined filters", () => {
    expect(FILTER_NAME_ORDER).toHaveLength(9);
    const filterKeys = Object.keys(PREDEFINED_FILTERS);
    for (const name of FILTER_NAME_ORDER) {
      expect(filterKeys).toContain(name);
    }
  });
});

describe("DEFAULT_FILTER_CONFIG", () => {
  it("uses none as predefined filter", () => {
    expect(DEFAULT_FILTER_CONFIG.predefinedFilter).toBe("none");
  });

  it("has all-zero custom params", () => {
    const { customParams } = DEFAULT_FILTER_CONFIG;
    expect(customParams.grain_amount).toBe(0);
    expect(customParams.bloom_diffusion).toBe(0);
    expect(customParams.shadow_fade).toBe(0);
    expect(customParams.color_bias).toBe(0);
    expect(customParams.vignette_depth).toBe(0);
  });
});
