import crypto from "crypto";
import type {
  CarouselProject,
  UploadedImage,
  Platform,
  PredefinedFilterName,
  FilterConfig,
  CameraFilterParams,
  GlobalOverlayStyle,
} from "@/lib/types";
import {
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_GLOBAL_OVERLAY_STYLE,
} from "@/lib/constants";

// =============================================================================
// API Helper Utilities
// ID generation, config validation, and type mapping for the REST API
// =============================================================================

// -----------------------------------------------------------------------------
// ID Generation
// -----------------------------------------------------------------------------

/**
 * Generates a URL-safe random ID with an optional prefix.
 * Uses crypto.randomBytes (no nanoid dependency needed).
 *
 * @example generateId("job") → "job_a1B2c3D4e5F6"
 */
export function generateId(prefix: string = ""): string {
  const bytes = crypto.randomBytes(9); // 12 base64url chars
  const id = bytes.toString("base64url");
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generates a new API key with its SHA-256 hash and display prefix.
 * The raw key is returned once and never stored — only the hash is persisted.
 *
 * Format: kp_live_<48 hex chars>
 */
export function generateApiKey(): {
  rawKey: string;
  hashedKey: string;
  prefix: string;
} {
  const randomPart = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const rawKey = `kp_live_${randomPart}`;
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 16); // "kp_live_xxxxxxxx"
  return { rawKey, hashedKey, prefix };
}

// -----------------------------------------------------------------------------
// Config Validation
// -----------------------------------------------------------------------------

const VALID_PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "reddit",
  "lemon8",
];

const VALID_FILTERS: PredefinedFilterName[] = [
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

const VALID_CAPTION_STYLES = ["storyteller", "minimalist", "data_driven"];

interface ValidationError {
  field: string;
  message: string;
}

/** Simplified API config received from external consumers */
export interface GenerateConfig {
  theme: string;
  platforms: Platform[];
  slideCount?: number;
  keywords?: string[];
  cameraProfileId?: number;
  captionStyle?: "storyteller" | "minimalist" | "data_driven";
  filter?: {
    predefinedFilter?: PredefinedFilterName;
    customParams?: Partial<CameraFilterParams>;
  };
  overlayStyle?: {
    fontFamily?: string;
    fontSize?: { primary?: number; secondary?: number };
    fontWeight?: "bold" | "semibold" | "regular";
    textColor?: string;
    backgroundColor?: string;
    alignment?: "top" | "center" | "bottom";
    horizontalAlign?: "left" | "center" | "right";
    showHeadline?: boolean;
    showSubtitle?: boolean;
  };
}

/**
 * Validates the simplified API config against required fields and allowed values.
 * Returns validation errors or the parsed config.
 */
export function validateGenerateConfig(raw: unknown): {
  valid: boolean;
  errors: ValidationError[];
  parsed?: GenerateConfig;
} {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      errors: [{ field: "config", message: "Config must be a JSON object" }],
    };
  }

  const c = raw as Record<string, unknown>;

  // Required: theme
  if (!c.theme || typeof c.theme !== "string" || c.theme.trim().length === 0) {
    errors.push({
      field: "theme",
      message: "theme is required and must be a non-empty string",
    });
  }

  // Required: platforms
  if (!Array.isArray(c.platforms) || c.platforms.length === 0) {
    errors.push({
      field: "platforms",
      message:
        "platforms is required and must be a non-empty array. Valid: " +
        VALID_PLATFORMS.join(", "),
    });
  } else {
    for (const p of c.platforms) {
      if (!VALID_PLATFORMS.includes(p as Platform)) {
        errors.push({
          field: "platforms",
          message: `Invalid platform: "${p}". Valid: ${VALID_PLATFORMS.join(", ")}`,
        });
      }
    }
  }

  // Optional: slideCount (2-12)
  if (c.slideCount !== undefined) {
    const sc = Number(c.slideCount);
    if (!Number.isInteger(sc) || sc < 2 || sc > 12) {
      errors.push({
        field: "slideCount",
        message: "slideCount must be an integer between 2 and 12",
      });
    }
  }

  // Optional: captionStyle
  if (
    c.captionStyle !== undefined &&
    !VALID_CAPTION_STYLES.includes(c.captionStyle as string)
  ) {
    errors.push({
      field: "captionStyle",
      message: `Invalid captionStyle. Valid: ${VALID_CAPTION_STYLES.join(", ")}`,
    });
  }

  // Optional: filter
  if (c.filter && typeof c.filter === "object") {
    const f = c.filter as Record<string, unknown>;
    if (
      f.predefinedFilter &&
      !VALID_FILTERS.includes(f.predefinedFilter as PredefinedFilterName)
    ) {
      errors.push({
        field: "filter.predefinedFilter",
        message: `Invalid filter. Valid: ${VALID_FILTERS.join(", ")}`,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], parsed: c as unknown as GenerateConfig };
}

// -----------------------------------------------------------------------------
// Type Mapping: API Config → CarouselProject
// -----------------------------------------------------------------------------

/**
 * Maps the simplified API config + uploaded images into a full CarouselProject
 * that can be passed to the existing server actions (generateCarousel, etc.).
 *
 * Fills in defaults from constants.ts for any optional fields not specified.
 */
export function mapToCarouselProject(
  config: GenerateConfig,
  images: UploadedImage[]
): CarouselProject {
  const slideCount =
    config.slideCount || Math.min(Math.max(images.length, 2), 10);

  // Build filter config from API input
  let filterConfig: FilterConfig | undefined;
  if (config.filter) {
    filterConfig = {
      predefinedFilter: config.filter.predefinedFilter || "none",
      customParams: {
        grain_amount: config.filter.customParams?.grain_amount ?? 0,
        bloom_diffusion: config.filter.customParams?.bloom_diffusion ?? 0,
        shadow_fade: config.filter.customParams?.shadow_fade ?? 0,
        color_bias: config.filter.customParams?.color_bias ?? 0,
        vignette_depth: config.filter.customParams?.vignette_depth ?? 0,
      },
    };
  }

  // Build global overlay style from API input
  let globalOverlayStyle: GlobalOverlayStyle | undefined;
  if (config.overlayStyle) {
    const s = config.overlayStyle;
    globalOverlayStyle = {
      fontFamily: s.fontFamily || DEFAULT_GLOBAL_OVERLAY_STYLE.fontFamily,
      fontSize: {
        primary:
          s.fontSize?.primary || DEFAULT_GLOBAL_OVERLAY_STYLE.fontSize.primary,
        secondary:
          s.fontSize?.secondary ||
          DEFAULT_GLOBAL_OVERLAY_STYLE.fontSize.secondary,
      },
      fontWeight: s.fontWeight || DEFAULT_GLOBAL_OVERLAY_STYLE.fontWeight,
      textColor: s.textColor || DEFAULT_GLOBAL_OVERLAY_STYLE.textColor,
      backgroundColor:
        s.backgroundColor || DEFAULT_GLOBAL_OVERLAY_STYLE.backgroundColor,
      alignment: s.alignment || DEFAULT_GLOBAL_OVERLAY_STYLE.alignment,
      horizontalAlign:
        s.horizontalAlign || DEFAULT_GLOBAL_OVERLAY_STYLE.horizontalAlign,
      showHeadline: s.showHeadline ?? DEFAULT_GLOBAL_OVERLAY_STYLE.showHeadline,
      showSubtitle: s.showSubtitle ?? DEFAULT_GLOBAL_OVERLAY_STYLE.showSubtitle,
      padding: DEFAULT_GLOBAL_OVERLAY_STYLE.padding,
    };
  }

  return {
    id: `api-${generateId("proj")}`,
    postMode: slideCount === 1 ? "single" as const : "carousel" as const,
    theme: config.theme,
    keywords: config.keywords || [],
    slideCount,
    cameraProfileId: config.cameraProfileId ?? 0,
    uploadedImages: images,
    slides: [],
    analogCreativityMode: DEFAULT_PROJECT_SETTINGS.analogCreativityMode,
    imageAllocationMode: DEFAULT_PROJECT_SETTINGS.imageAllocationMode,
    targetPlatforms: config.platforms,
    captionStyle:
      config.captionStyle || DEFAULT_PROJECT_SETTINGS.captionStyle,
    globalOverlayStyle,
    filterConfig,
  };
}
