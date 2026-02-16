import type { FilterConfig } from "./types";
import { PREDEFINED_FILTERS } from "./filter-presets";

// =============================================================================
// CSS Camera Filter Generation
// =============================================================================
// Generates CSS styles for real-time filter preview in the browser.
// Two-pass approach:
// 1. Named filter → CSS filter chain applied to the image element
// 2. Custom params → additional overlays (grain, vignette, bloom, color shift)

export interface CSSFilterStyles {
  /** CSS filter string for the <img> element */
  imageFilter: string;
  /** Gradient overlay for the named filter's color tint */
  overlayGradient?: string;
  /** CSS mix-blend-mode for the filter overlay */
  overlayBlendMode?: string;
  /** Radial gradient for vignette effect */
  vignetteGradient?: string;
  /** Opacity for the grain noise overlay (0-1) */
  grainOpacity: number;
  /** Additional CSS filter values from custom params (appended to imageFilter) */
  customFilterAdditions: string;
}

/**
 * Generates CSS filter styles for real-time preview.
 * Combines the named filter's CSS chain with custom parameter adjustments.
 */
export function getCameraFilterStyles(config: FilterConfig): CSSFilterStyles {
  const preset = PREDEFINED_FILTERS[config.predefinedFilter];
  const params = config.customParams;

  // --- Named filter base ---
  const baseFilter = preset.cssFilter === "none" ? "" : preset.cssFilter;

  // --- Custom parameter additions ---
  const additions: string[] = [];

  // bloom_diffusion: adds brightness boost and slight blur feel via contrast reduction
  if (params.bloom_diffusion > 0) {
    const brightnessBoost = 1 + params.bloom_diffusion * 0.002;
    additions.push(`brightness(${brightnessBoost.toFixed(3)})`);
  }

  // shadow_fade: lifts black point by reducing contrast and boosting brightness
  if (params.shadow_fade > 0) {
    const contrastReduction = 1 - params.shadow_fade * 0.003;
    const brightnessLift = 1 + params.shadow_fade * 0.002;
    additions.push(`contrast(${contrastReduction.toFixed(3)})`);
    additions.push(`brightness(${brightnessLift.toFixed(3)})`);
  }

  // color_bias: warm (positive) adds sepia+hue, cool (negative) adds hue-rotate to blue
  if (params.color_bias !== 0) {
    if (params.color_bias > 0) {
      // Warm: add sepia and slight hue shift toward amber
      const sepiaAmount = params.color_bias * 0.003;
      additions.push(`sepia(${sepiaAmount.toFixed(3)})`);
    } else {
      // Cool: hue-rotate toward blue
      const hueShift = params.color_bias * 0.5; // -50 max degrees
      additions.push(`hue-rotate(${hueShift.toFixed(1)}deg)`);
    }
  }

  const customFilterStr = additions.join(" ");

  // Combine base + custom
  const imageFilter = [baseFilter, customFilterStr].filter(Boolean).join(" ") || "none";

  // --- Vignette ---
  let vignetteGradient: string | undefined;
  if (params.vignette_depth > 0) {
    const opacity = params.vignette_depth * 0.008;
    vignetteGradient = `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${opacity.toFixed(3)}) 100%)`;
  }

  // --- Grain ---
  const grainOpacity = params.grain_amount > 0 ? params.grain_amount / 100 : 0;

  return {
    imageFilter,
    overlayGradient: preset.overlayGradient,
    overlayBlendMode: preset.overlayBlendMode,
    vignetteGradient,
    grainOpacity,
    customFilterAdditions: customFilterStr,
  };
}

/**
 * Generates an inline SVG data URI for film grain noise.
 * Uses an SVG feTurbulence filter for a lightweight noise texture.
 */
export function getGrainSVGDataUri(): string {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E")`;
}
