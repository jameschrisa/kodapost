import type { CarouselProject, GlobalOverlayStyle, VideoSettings } from "./types";

// -----------------------------------------------------------------------------
// Platform Caption Limits
// -----------------------------------------------------------------------------

export const PLATFORM_LIMITS = {
  instagram: {
    caption_max: 2200,
    hashtag_max: 30,
    hashtag_recommended: 10,
    first_line_preview: 125,
  },
  tiktok: {
    caption_max: 2200,
    hashtag_max: 100,
    hashtag_recommended: 5,
    first_line_preview: 150,
  },
  linkedin: {
    caption_max: 3000,
    hashtag_max: 3,
    hashtag_recommended: 3,
    first_line_preview: 140,
  },
  youtube: {
    caption_max: 5000,
    hashtag_max: 15,
    hashtag_recommended: 5,
    first_line_preview: 100,
  },
  reddit: {
    caption_max: 300,
    hashtag_max: 0,
    hashtag_recommended: 0,
    first_line_preview: 300,
  },
  lemon8: {
    caption_max: 2200,
    hashtag_max: 30,
    hashtag_recommended: 8,
    first_line_preview: 140,
  },
  x: {
    caption_max: 280,
    hashtag_max: 5,
    hashtag_recommended: 3,
    first_line_preview: 280,
  },
} as const;

// -----------------------------------------------------------------------------
// Platform Image Specifications
// -----------------------------------------------------------------------------

export const PLATFORM_IMAGE_SPECS = {
  instagram_feed: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    format: "JPEG",
    quality: 85,
  },
  tiktok: {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    format: "JPEG",
    quality: 90,
  },
  linkedin_pdf: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    format: "PNG",
    quality: 95,
  },
  youtube_community: {
    width: 1000,
    height: 1000,
    aspectRatio: "1:1",
    format: "JPEG",
    quality: 85,
  },
  reddit_gallery: {
    width: 1200,
    height: 1200,
    aspectRatio: "1:1",
    format: "PNG",
    quality: 95,
  },
  lemon8_post: {
    width: 1080,
    height: 1440,
    aspectRatio: "3:4",
    format: "JPEG",
    quality: 90,
  },
  x_post: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    format: "JPEG",
    quality: 90,
  },
} as const;

// -----------------------------------------------------------------------------
// Platform Preview Configuration
// -----------------------------------------------------------------------------

export const PLATFORM_PREVIEW_CONFIG = {
  instagram: {
    label: "Instagram",
    ratio: "4:5",
    aspectClass: "aspect-[4/5]",
  },
  tiktok: {
    label: "TikTok",
    ratio: "9:16",
    aspectClass: "aspect-[9/16]",
  },
  linkedin: {
    label: "LinkedIn",
    ratio: "4:5",
    aspectClass: "aspect-[4/5]",
  },
  youtube: {
    label: "YouTube",
    ratio: "1:1",
    aspectClass: "aspect-[1/1]",
  },
  reddit: {
    label: "Reddit",
    ratio: "1:1",
    aspectClass: "aspect-[1/1]",
  },
  lemon8: {
    label: "Lemon8",
    ratio: "3:4",
    aspectClass: "aspect-[3/4]",
  },
  x: {
    label: "X",
    ratio: "4:5",
    aspectClass: "aspect-[4/5]",
  },
} as const;

export type PreviewPlatform = keyof typeof PLATFORM_PREVIEW_CONFIG;
export type PreviewMode = PreviewPlatform | "letterbox";

export const LETTERBOX_PREVIEW_CONFIG = {
  label: "Letterbox",
  ratio: "16:9 in 4:5",
  aspectClass: "aspect-[4/5]",
} as const;

// -----------------------------------------------------------------------------
// Mobile Device Preview Configuration
// -----------------------------------------------------------------------------

export const MOBILE_ASPECT_RATIOS = {
  "19.5:9": {
    label: "19.5:9",
    description: "iPhone 14/15, Galaxy S23",
    aspectClass: "aspect-[9/19.5]",
  },
  "20:9": {
    label: "20:9",
    description: "Galaxy S24, Pixel 8",
    aspectClass: "aspect-[9/20]",
  },
} as const;

export type MobileAspectRatio = keyof typeof MOBILE_ASPECT_RATIOS;

// -----------------------------------------------------------------------------
// Analog Creativity Mode Configuration
// -----------------------------------------------------------------------------

export const ANALOG_MODE_CONFIG = {
  relaxed: {
    name: "Relaxed",
    description: "Any ratio allowed, AI can fill gaps freely",
    minUploadRatio: 0,
    enforcementLevel: "none",
    icon: "🌈",
  },
  recommended: {
    name: "Recommended",
    description: "Suggests 2:1 ratio but allows generation anyway",
    minUploadRatio: 0.4,
    recommendedRatio: 0.66,
    enforcementLevel: "warning",
    icon: "⚡",
  },
  strict: {
    name: "Strict Analog",
    description:
      "Requires 2:1 ratio minimum to maintain analog aesthetic",
    minUploadRatio: 0.66,
    enforcementLevel: "block",
    icon: "📸",
  },
} as const;

// -----------------------------------------------------------------------------
// Default Project Settings
// -----------------------------------------------------------------------------

export const DEFAULT_PROJECT_SETTINGS: Pick<
  CarouselProject,
  | "postMode"
  | "slideCount"
  | "analogCreativityMode"
  | "imageAllocationMode"
  | "captionStyle"
  | "targetPlatforms"
> = {
  postMode: "carousel",
  slideCount: 5,
  analogCreativityMode: "recommended",
  imageAllocationMode: "sequential",
  captionStyle: "storyteller",
  targetPlatforms: ["instagram"],
};

// -----------------------------------------------------------------------------
// OAuth Configuration
// -----------------------------------------------------------------------------

export const OAUTH_CONFIG = {
  instagram: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    longLivedTokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"],
    envKeys: { id: "INSTAGRAM_APP_ID", secret: "INSTAGRAM_APP_SECRET" },
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["video.publish", "video.upload", "user.info.basic"],
    envKeys: { id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET" },
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "w_member_social"],
    envKeys: { id: "LINKEDIN_CLIENT_ID", secret: "LINKEDIN_CLIENT_SECRET" },
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.upload"],
    envKeys: { id: "YOUTUBE_CLIENT_ID", secret: "YOUTUBE_CLIENT_SECRET" },
  },
  reddit: {
    authUrl: "https://www.reddit.com/api/v1/authorize",
    tokenUrl: "https://www.reddit.com/api/v1/access_token",
    scopes: ["submit", "identity"],
    envKeys: { id: "REDDIT_CLIENT_ID", secret: "REDDIT_CLIENT_SECRET" },
  },
  lemon8: {
    authUrl: "https://open.lemon8-app.com/oauth/authorize",
    tokenUrl: "https://open.lemon8-app.com/oauth/access_token",
    scopes: ["content.publish"],
    envKeys: { id: "LEMON8_CLIENT_KEY", secret: "LEMON8_CLIENT_SECRET" },
  },
  x: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.write", "tweet.read", "users.read", "offline.access"],
    envKeys: { id: "X_CLIENT_ID", secret: "X_CLIENT_SECRET" },
  },
} as const;

export type OAuthPlatform = keyof typeof OAUTH_CONFIG;

// -----------------------------------------------------------------------------
// Default Overlay Styling & Positioning
// -----------------------------------------------------------------------------

/** Default background padding for text highlight boxes (in pixels at export scale) */
export const DEFAULT_BG_PADDING = { x: 12, y: 4 } as const;

export const DEFAULT_OVERLAY_STYLING = {
  fontFamily: "Inter",
  fontSize: { primary: 42, secondary: 20 },
  fontWeight: "bold" as const,
  textColor: "#FFFFFF",
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  textShadow: true,
  textAlign: "center" as const,
  fontStyle: "normal" as const,
  backgroundPadding: { x: 12, y: 4 },
};

export const DEFAULT_OVERLAY_PADDING = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

export const MIN_OVERLAY_PADDING = 20;

// Default stroke (text outline) settings
export const DEFAULT_STROKE_WIDTH = 3;
export const DEFAULT_STROKE_COLOR = "#000000";

// Predefined stroke color options for the UI
export const STROKE_COLOR_OPTIONS = [
  { label: "Black", value: "#000000" },
  { label: "White", value: "#FFFFFF" },
  { label: "Red", value: "#FF0000" },
  { label: "Blue", value: "#0066FF" },
] as const;

// Freeform positioning: percentage-based (0-100) position for text overlays
export const DEFAULT_FREE_POSITION = { x: 50, y: 85 } as const;

export const FREE_POSITION_FROM_ALIGNMENT: Record<"top" | "center" | "bottom", { x: number; y: number }> = {
  top: { x: 50, y: 20 },
  center: { x: 50, y: 55 },
  bottom: { x: 50, y: 85 },
};

export const FREE_POSITION_X_FROM_HORIZONTAL: Record<"left" | "center" | "right", number> = {
  left: 25,
  center: 50,
  right: 75,
};

export const DEFAULT_GLOBAL_OVERLAY_STYLE: GlobalOverlayStyle = {
  fontFamily: "Inter",
  fontSize: { primary: 42, secondary: 20 },
  fontWeight: "bold",
  textColor: "#FFFFFF",
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  textShadow: true,
  alignment: "bottom",
  horizontalAlign: "center",
  padding: { top: 40, right: 40, bottom: 40, left: 40 },
  showHeadline: true,
  showSubtitle: false,
  freePosition: { x: 50, y: 85 },
  textAlign: "center",
  fontStyle: "normal",
  backgroundPadding: { x: 12, y: 4 },
};

// Color scheme presets for inverted text toggle
export const COLOR_SCHEMES = {
  dark: { textColor: "#FFFFFF", backgroundColor: "rgba(0, 0, 0, 0.75)" },
  light: { textColor: "#1A1A1A", backgroundColor: "rgba(255, 255, 255, 0.85)" },
} as const;

// -----------------------------------------------------------------------------
// Font Options
// -----------------------------------------------------------------------------

export interface FontOption {
  label: string;
  value: string;
  category: "sans-serif" | "serif" | "display";
  cssVariable: string;
  /** Override font weight when this variant is selected (e.g., 900 for "Black") */
  defaultWeight?: number;
}

export const FONT_OPTIONS: FontOption[] = [
  // Sans Serif
  { label: "Inter", value: "Inter", category: "sans-serif", cssVariable: "--font-inter" },
  { label: "Montserrat", value: "Montserrat", category: "sans-serif", cssVariable: "--font-montserrat" },
  { label: "Montserrat Black", value: "Montserrat", category: "sans-serif", cssVariable: "--font-montserrat", defaultWeight: 900 },
  { label: "Poppins", value: "Poppins", category: "sans-serif", cssVariable: "--font-poppins" },
  { label: "Syne", value: "Syne", category: "sans-serif", cssVariable: "--font-syne" },
  { label: "Bebas Neue", value: "Bebas Neue", category: "sans-serif", cssVariable: "--font-bebas-neue" },
  // Serif
  { label: "Playfair Display", value: "Playfair Display", category: "serif", cssVariable: "--font-playfair" },
  { label: "Playfair Display Black", value: "Playfair Display", category: "serif", cssVariable: "--font-playfair", defaultWeight: 900 },
  { label: "Merriweather", value: "Merriweather", category: "serif", cssVariable: "--font-merriweather" },
  { label: "Lora", value: "Lora", category: "serif", cssVariable: "--font-lora" },
  { label: "Bodoni Moda", value: "Bodoni Moda", category: "serif", cssVariable: "--font-bodoni-moda" },
  { label: "Cinzel", value: "Cinzel", category: "serif", cssVariable: "--font-cinzel" },
  { label: "Abril Fatface", value: "Abril Fatface", category: "serif", cssVariable: "--font-abril-fatface" },
  { label: "DM Serif Display", value: "DM Serif Display", category: "serif", cssVariable: "--font-dm-serif-display" },
  { label: "Prata", value: "Prata", category: "serif", cssVariable: "--font-prata" },
];

/**
 * Resolves a font name (which may be a label like "Montserrat Black") to its FontOption.
 * Checks label first, then value.
 */
export function resolveFontOption(fontName: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.label === fontName) ?? FONT_OPTIONS.find((f) => f.value === fontName);
}

/**
 * Returns the appropriate CSS font-family string with fallback for a given font name.
 */
export function getFontFamilyWithFallback(fontName: string): string {
  const option = resolveFontOption(fontName);
  if (!option) return `${fontName}, sans-serif`;
  const fallback = option.category === "serif" || option.category === "display" ? "serif" : "sans-serif";
  return `${option.value}, ${fallback}`;
}

// -----------------------------------------------------------------------------
// Derived Types
// -----------------------------------------------------------------------------

export type PlatformKey = keyof typeof PLATFORM_LIMITS;
export type ImageSpecKey = keyof typeof PLATFORM_IMAGE_SPECS;
export type AnalogMode = keyof typeof ANALOG_MODE_CONFIG;

// -----------------------------------------------------------------------------
// Video Generation Defaults
// -----------------------------------------------------------------------------

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  transition: "crossfade",
  transitionDuration: 0.5,
  slideDuration: 3,
  timingMode: "match-audio",
  fps: 30,
  quality: "standard",
};
