import type { CameraFilterParams, PredefinedFilterName } from "./types";

// =============================================================================
// Predefined Filter Definitions
// =============================================================================
// Each filter is based on CSSgram's CSS filter chains for real-time preview,
// plus associated default custom parameters for the 5 nostalgic sliders.

export interface PredefinedFilterDef {
  /** Display name */
  name: string;
  /** Short description of the filter's look */
  description: string;
  /** CSS filter chain for the image element */
  cssFilter: string;
  /** Optional gradient overlay for color tinting */
  overlayGradient?: string;
  /** CSS blend mode for the gradient overlay */
  overlayBlendMode?: string;
  /** Default custom slider values when this filter is selected */
  defaultCustomParams: CameraFilterParams;
}

export const PREDEFINED_FILTERS: Record<PredefinedFilterName, PredefinedFilterDef> = {
  none: {
    name: "None",
    description: "No filter applied",
    cssFilter: "none",
    defaultCustomParams: {
      grain_amount: 0,
      bloom_diffusion: 0,
      shadow_fade: 0,
      color_bias: 0,
      vignette_depth: 0,
    },
  },
  "1977": {
    name: "1977",
    description: "Faded pinkish-purple tint of 70s/80s film",
    cssFilter: "contrast(1.1) brightness(1.1) saturate(1.3)",
    overlayGradient:
      "linear-gradient(to right, rgba(243,106,188,0.3), rgba(236,205,169,0.15))",
    overlayBlendMode: "screen",
    defaultCustomParams: {
      grain_amount: 35,
      bloom_diffusion: 25,
      shadow_fade: 40,
      color_bias: 30,
      vignette_depth: 20,
    },
  },
  earlybird: {
    name: "Earlybird",
    description: "Golden-yellow Kodak EasyShare warmth",
    cssFilter: "contrast(0.9) sepia(0.2)",
    overlayGradient:
      "radial-gradient(circle at center, rgba(210,180,140,0.2), rgba(29,2,16,0.2))",
    overlayBlendMode: "multiply",
    defaultCustomParams: {
      grain_amount: 25,
      bloom_diffusion: 30,
      shadow_fade: 30,
      color_bias: 55,
      vignette_depth: 45,
    },
  },
  lofi: {
    name: "Lo-Fi",
    description: "Punchy point-and-shoot digital look",
    cssFilter: "saturate(1.1) contrast(1.5)",
    defaultCustomParams: {
      grain_amount: 15,
      bloom_diffusion: 5,
      shadow_fade: 5,
      color_bias: 5,
      vignette_depth: 60,
    },
  },
  nashville: {
    name: "Nashville",
    description: "Analog-to-digital transition, magenta/cream tint",
    cssFilter: "sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)",
    overlayGradient:
      "linear-gradient(to bottom, rgba(247,176,59,0.15), rgba(0,70,150,0.15))",
    overlayBlendMode: "multiply",
    defaultCustomParams: {
      grain_amount: 20,
      bloom_diffusion: 20,
      shadow_fade: 25,
      color_bias: 35,
      vignette_depth: 15,
    },
  },
  toaster: {
    name: "Toaster",
    description: "Harsh aged Polaroid/disposable camera look",
    cssFilter: "contrast(1.5) brightness(0.9)",
    overlayGradient:
      "radial-gradient(circle at center, rgba(128,78,15,0.2) 0%, rgba(59,0,59,0.3) 100%)",
    overlayBlendMode: "screen",
    defaultCustomParams: {
      grain_amount: 40,
      bloom_diffusion: 35,
      shadow_fade: 15,
      color_bias: 45,
      vignette_depth: 70,
    },
  },
  kelvin: {
    name: "Kelvin",
    description: "Strong orange/yellow indoor lighting wash",
    cssFilter: "sepia(0.15) saturate(1.4) brightness(1.2)",
    overlayGradient:
      "linear-gradient(to bottom, rgba(255,140,0,0.25), rgba(0,0,0,0))",
    overlayBlendMode: "multiply",
    defaultCustomParams: {
      grain_amount: 15,
      bloom_diffusion: 30,
      shadow_fade: 10,
      color_bias: 70,
      vignette_depth: 10,
    },
  },
  xpro2: {
    name: "X-Pro II",
    description: "Cross-processing with vibrant greens and deep blues",
    cssFilter: "sepia(0.3)",
    overlayGradient:
      "linear-gradient(to bottom, rgba(0,48,80,0.3), rgba(232,193,35,0.2))",
    overlayBlendMode: "multiply",
    defaultCustomParams: {
      grain_amount: 20,
      bloom_diffusion: 15,
      shadow_fade: 15,
      color_bias: -20,
      vignette_depth: 35,
    },
  },
  inkwell: {
    name: "Inkwell",
    description: "Gritty B&W mimicking early digital grayscale",
    cssFilter: "sepia(0.3) contrast(1.1) brightness(1.1) grayscale(1)",
    defaultCustomParams: {
      grain_amount: 40,
      bloom_diffusion: 10,
      shadow_fade: 20,
      color_bias: 0,
      vignette_depth: 25,
    },
  },
};

// =============================================================================
// Camera Profile → Filter Mapping
// =============================================================================
// Maps each of the 10 camera profiles (by ID) to a recommended predefined
// filter and default custom parameter values.

export interface CameraFilterMapping {
  /** Recommended predefined filter name */
  filter: PredefinedFilterName;
  /** Camera-specific custom parameter defaults */
  customParams: CameraFilterParams;
}

export const CAMERA_FILTER_MAP: Record<number, CameraFilterMapping> = {
  // Sony Mavica FD-91 — CRT/muted/low-res grayscale feel
  1: {
    filter: "inkwell",
    customParams: { grain_amount: 45, bloom_diffusion: 15, shadow_fade: 25, color_bias: 0, vignette_depth: 30 },
  },
  // Canon PowerShot ELPH — Punchy Y2K party photography
  2: {
    filter: "lofi",
    customParams: { grain_amount: 20, bloom_diffusion: 10, shadow_fade: 5, color_bias: 10, vignette_depth: 55 },
  },
  // Nikon Coolpix 990 — Neutral prosumer, custom params only
  3: {
    filter: "none",
    customParams: { grain_amount: 15, bloom_diffusion: 20, shadow_fade: 10, color_bias: 5, vignette_depth: 15 },
  },
  // Olympus Camedia C-3040 — Warm dreamy CCD bloom
  4: {
    filter: "earlybird",
    customParams: { grain_amount: 20, bloom_diffusion: 40, shadow_fade: 30, color_bias: 45, vignette_depth: 40 },
  },
  // Fujifilm FinePix S602 — Vibrant film simulation colors
  5: {
    filter: "nashville",
    customParams: { grain_amount: 15, bloom_diffusion: 15, shadow_fade: 20, color_bias: 30, vignette_depth: 20 },
  },
  // Casio Exilim EX-Z3 — Cool blue shadows, cross-process
  6: {
    filter: "xpro2",
    customParams: { grain_amount: 25, bloom_diffusion: 10, shadow_fade: 10, color_bias: -30, vignette_depth: 40 },
  },
  // Kodak EasyShare CX7430 — Golden amber family album warmth
  7: {
    filter: "kelvin",
    customParams: { grain_amount: 20, bloom_diffusion: 25, shadow_fade: 15, color_bias: 65, vignette_depth: 15 },
  },
  // Panasonic Lumix DMC-FZ20 — Professional precision, custom params only
  8: {
    filter: "none",
    customParams: { grain_amount: 10, bloom_diffusion: 5, shadow_fade: 5, color_bias: 0, vignette_depth: 10 },
  },
  // Polaroid 600 — Heavy vignette, aged instant film
  9: {
    filter: "toaster",
    customParams: { grain_amount: 45, bloom_diffusion: 40, shadow_fade: 20, color_bias: 50, vignette_depth: 75 },
  },
  // iPhone 3G — Early mobile photography retro feel
  10: {
    filter: "1977",
    customParams: { grain_amount: 30, bloom_diffusion: 20, shadow_fade: 35, color_bias: 25, vignette_depth: 25 },
  },
};

/** Returns the predefined filter names in display order */
export const FILTER_NAME_ORDER: PredefinedFilterName[] = [
  "none",
  "1977",
  "earlybird",
  "lofi",
  "nashville",
  "toaster",
  "kelvin",
  "xpro2",
  "inkwell",
];

/** Default filter config when no camera is selected */
export const DEFAULT_FILTER_CONFIG = {
  predefinedFilter: "none" as PredefinedFilterName,
  customParams: {
    grain_amount: 0,
    bloom_diffusion: 0,
    shadow_fade: 0,
    color_bias: 0,
    vignette_depth: 0,
  },
};
