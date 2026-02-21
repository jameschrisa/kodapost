import type { CarouselProject, GlobalOverlayStyle, VideoSettings } from "./types";

// -----------------------------------------------------------------------------
// Platform Caption Limits
// -----------------------------------------------------------------------------

export const PLATFORM_LIMITS = {
  instagram: {
    caption_max: 2200,
    hashtag_max: 30,
    hashtag_recommended: 5,
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
  youtube_shorts: {
    caption_max: 2200,
    hashtag_max: 30,
    hashtag_recommended: 5,
    first_line_preview: 150,
  },
  reddit: {
    caption_max: 300,
    hashtag_max: 0,
    hashtag_recommended: 0,
    first_line_preview: 300,
  },
  x: {
    caption_max: 280,
    hashtag_max: 5,
    hashtag_recommended: 2,
    first_line_preview: 280,
  },
} as const;

// -----------------------------------------------------------------------------
// Platform Rules & Best Practices
// Source: Official platform docs + industry benchmarks (2025–2026)
// -----------------------------------------------------------------------------

export const PLATFORM_RULES = {
  instagram: {
    maxCarouselImages: 20,
    minCarouselImages: 2,
    supportsCarousel: true,
    carouselType: "native_swipe" as const,
    captionMax: 2200,
    captionFirstLinePreview: 125,
    hashtagMax: 30,
    hashtagOptimal: { min: 3, max: 5 },
    requirements: [
      "All carousel images must share the same aspect ratio",
      "First image aspect ratio sets the template for all slides",
      "Portrait 4:5 maximizes feed real estate",
      "Max 30 MB per image (JPEG, PNG, WebP)",
    ],
    bestPractices: [
      "Hook viewers in the first slide — it's the only one shown in feed",
      "End with a CTA slide to drive follows, saves, or link clicks",
      "Use 3–5 targeted hashtags (Instagram's own recommendation)",
      "Keep the first 125 characters caption-worthy — that's all that shows",
      "Carousels are reshown to non-swipers — optimise for both audiences",
    ],
  },
  tiktok: {
    maxCarouselImages: 35,
    minCarouselImages: 2,
    supportsCarousel: true,
    carouselType: "photo_mode" as const,
    captionMax: 2200,
    captionFirstLinePreview: 150,
    hashtagMax: 100,
    hashtagOptimal: { min: 3, max: 5 },
    requirements: [
      "Photo Mode supports 2–35 images per carousel",
      "Supported ratios: 9:16 (recommended), 4:5, 1:1",
      "All images should use the same aspect ratio",
      "Total carousel upload limit: 500 MB (JPEG, PNG)",
    ],
    bestPractices: [
      "Use 9:16 vertical for full-screen immersive viewing",
      "Optimal length is 5–10 slides — attention drops past 10",
      "Add text overlays: many TikTok users scroll with sound off",
      "TikTok rewards saves and shares — make content save-worthy",
      "Use 3–5 niche hashtags; avoid banned or oversaturated tags",
    ],
  },
  linkedin: {
    maxCarouselImages: 300,
    minCarouselImages: 2,
    supportsCarousel: true,
    carouselType: "pdf_document" as const,
    captionMax: 3000,
    captionFirstLinePreview: 140,
    hashtagMax: 3,
    hashtagOptimal: { min: 1, max: 3 },
    requirements: [
      "Carousels are uploaded as PDF documents (max 100 MB)",
      "Supports PDF, PPTX, DOCX formats",
      "Maximum 300 pages; recommend 5–20 slides",
      "Minimum 24pt headers, 18pt body text for mobile readability",
    ],
    bestPractices: [
      "LinkedIn PDFs get ~3× more reach than static image posts",
      "Title slide is the thumbnail — make it compelling and clear",
      "5–6 slides is the engagement sweet spot for professional content",
      "Max 3 hashtags — LinkedIn's algorithm penalises over-tagging",
      "Post Tue–Thu between 8–10am or 12–2pm in your audience's timezone",
    ],
  },
  youtube: {
    maxCarouselImages: 1,
    minCarouselImages: 1,
    supportsCarousel: false,
    carouselType: "single_image" as const,
    captionMax: 5000,
    captionFirstLinePreview: 100,
    hashtagMax: 15,
    hashtagOptimal: { min: 3, max: 5 },
    requirements: [
      "Community posts support a single image only — no carousels",
      "Recommended: 1080×1080 px square (1:1 aspect ratio)",
      "Supported aspect ratios: 2:5 to 5:2",
      "Supported formats: JPEG, PNG, WebP, non-animated GIF",
    ],
    bestPractices: [
      "Community posts keep subscribers engaged between video uploads",
      "Ask a question — comment engagement boosts post reach",
      "Square 1:1 format displays cleanly in all mobile feed contexts",
      "Use 3–5 relevant hashtags for YouTube search discoverability",
      "Post at the same time you'd normally publish a video for best reach",
    ],
  },
  youtube_shorts: {
    maxCarouselImages: 1,
    minCarouselImages: 1,
    supportsCarousel: false,
    carouselType: "single_image" as const,
    captionMax: 2200,
    captionFirstLinePreview: 150,
    hashtagMax: 30,
    hashtagOptimal: { min: 3, max: 5 },
    requirements: [
      "Shorts are vertical-first: 1080×1920 px (9:16 aspect ratio required)",
      "Content must be 60 seconds or under to qualify as a Short",
      "Single image Shorts use a still frame at full 9:16 resolution",
      "Supported formats: JPEG, PNG (for static image Shorts)",
    ],
    bestPractices: [
      "9:16 vertical fills the entire mobile screen — no letterboxing",
      "Shorts surface in YouTube's dedicated Shorts feed for massive reach",
      "Hook viewers in the first 2 seconds — attention span is very short",
      "Text overlays are critical — Shorts auto-play without sound",
      "Use 3–5 niche hashtags including #Shorts to enter the Shorts algorithm",
    ],
  },
  x: {
    maxCarouselImages: 4,
    minCarouselImages: 1,
    supportsCarousel: false,
    carouselType: "multi_image_grid" as const,
    captionMax: 280,
    captionFirstLinePreview: 280,
    hashtagMax: 5,
    hashtagOptimal: { min: 1, max: 2 },
    requirements: [
      "Maximum 4 images per post — no swipeable carousel",
      "Images display in auto-arranged grid (2-up, 3-up, or 2×2)",
      "Supported aspect ratios: 2:1 to 1:2 (4:5 portrait works well)",
      "Max 5 MB per image (JPEG, PNG, WebP, GIF)",
      "Free accounts: 280-character limit; X Premium: 4,000 characters",
    ],
    bestPractices: [
      "4:5 portrait takes maximum vertical feed space — more attention",
      "Posts under 100 characters get ~17% higher engagement",
      "1–2 hashtags max — engagement drops sharply beyond 2 tags",
      "X does not swipe carousels — all images show in a grid simultaneously",
      "Alt text on all images improves reach and accessibility ranking",
    ],
  },
} as const;

export type PlatformRulesKey = keyof typeof PLATFORM_RULES;

// -----------------------------------------------------------------------------
// Platform Image Specifications
// -----------------------------------------------------------------------------

export const PLATFORM_IMAGE_SPECS = {
  instagram_feed: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    format: "JPEG",
    quality: 90,
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
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    format: "JPEG",
    quality: 90,
  },
  youtube_shorts: {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    format: "JPEG",
    quality: 90,
  },
  reddit_gallery: {
    width: 1200,
    height: 1200,
    aspectRatio: "1:1",
    format: "PNG",
    quality: 95,
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
  youtube_shorts: {
    label: "YouTube Shorts",
    ratio: "9:16",
    aspectClass: "aspect-[9/16]",
  },
  reddit: {
    label: "Reddit",
    ratio: "1:1",
    aspectClass: "aspect-[1/1]",
  },
  x: {
    label: "X/Twitter",
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
  youtube_shorts: {
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
  headlineMode: "all" as const,
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
