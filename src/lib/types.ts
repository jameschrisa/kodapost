// =============================================================================
// KodaPost Type System
// Complete type definitions for the carousel builder application
// =============================================================================

// -----------------------------------------------------------------------------
// Image Analysis Types
// -----------------------------------------------------------------------------

/** Result of Claude Vision analysis on an uploaded image */
export interface ImageAnalysis {
  /** Primary subject identified in the image */
  mainSubject: string;
  /** Composition style of the photograph */
  composition: "wide_shot" | "close_up" | "portrait" | "landscape" | "detail";
  /** Notable elements detected in the image */
  keyElements: string[];
  /** Description of the image setting/environment */
  setting: string;
  /** Overall mood or feeling conveyed */
  mood: string;
  /** Lighting conditions detected */
  lightingConditions:
    | "bright"
    | "soft"
    | "dramatic"
    | "low_light"
    | "backlit";
  /** Dominant colors extracted from the image */
  colorPalette: string[];
  /** AI-recommended slide placement based on content */
  suggestedUseCase: "hook" | "story" | "detail" | "closer";
}

// -----------------------------------------------------------------------------
// Uploaded Image Types
// -----------------------------------------------------------------------------

/** A user-uploaded image with optional AI analysis */
export interface UploadedImage {
  /** Unique identifier */
  id: string;
  /** URL to the stored image (blob or remote) */
  url: string;
  /** Original filename from upload */
  filename: string;
  /** ISO timestamp of when the image was uploaded */
  uploadedAt: string;
  /** Claude Vision analysis results, if available */
  analysis?: ImageAnalysis;
  /** ISO timestamp of when analysis was cached */
  analysisCachedAt?: string;
  /** Slide positions where this image is used */
  usedInSlides: number[];
}

// -----------------------------------------------------------------------------
// Text Overlay Types
// -----------------------------------------------------------------------------

/** Text content and visual styling for slide overlays */
export interface TextOverlay {
  /** Text content for the overlay */
  content: {
    /** Main headline text */
    primary: string;
    /** Supporting subtitle text */
    secondary?: string;
    /** Accent/highlight text (e.g., numbers, callouts) */
    accent?: string;
  };
  /** Visual styling configuration */
  styling: {
    /** CSS font-family value */
    fontFamily: string;
    /** Font sizes in pixels for each text tier */
    fontSize: {
      primary: number;
      secondary: number;
      accent?: number;
    };
    /** Font weight for the overlay text */
    fontWeight: "bold" | "semibold" | "regular";
    /** CSS color value for text */
    textColor: string;
    /** Optional background color behind text */
    backgroundColor?: string;
    /** Whether to apply a text shadow for readability */
    textShadow?: boolean;
    /** Stroke width in pixels for outlined text */
    strokeWidth?: number;
    /** CSS color value for text stroke */
    strokeColor?: string;
    /** Text alignment within the overlay block */
    textAlign?: "left" | "center" | "right";
    /** Font style (normal or italic) */
    fontStyle?: "normal" | "italic";
    /** Padding for text background highlight: x = horizontal, y = vertical (in px at export scale) */
    backgroundPadding?: { x: number; y: number };
  };
  /** Layout positioning within the slide */
  positioning: {
    /** Vertical alignment */
    alignment: "top" | "center" | "bottom";
    /** Horizontal alignment */
    horizontalAlign: "left" | "center" | "right";
    /** Padding in pixels for each side */
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    /** Percentage-based freeform position (0-100). When set, overrides padding+alignment for rendering. */
    freePosition?: { x: number; y: number };
  };
}

/** Tracks the state and edit history of a slide's text overlay */
export interface TextOverlayState {
  /** ID of the slide this state belongs to */
  slideId: string;
  /** Whether the overlay is currently visible */
  enabled: boolean;
  /** How the current overlay content was produced */
  source: "ai_generated" | "user_override" | "preset_applied";
  /** ISO timestamp of last modification */
  lastModified: string;
  /** Tracks which aspects the user has manually edited */
  customizations: {
    textEdited: boolean;
    styleEdited: boolean;
    positionEdited: boolean;
  };
}

// -----------------------------------------------------------------------------
// Global Overlay Style
// -----------------------------------------------------------------------------

/** Global overlay style configuration, set before generation and applied to all slides */
export interface GlobalOverlayStyle {
  /** CSS font-family value */
  fontFamily: string;
  /** Font sizes in pixels for headline and subtitle */
  fontSize: {
    primary: number;
    secondary: number;
  };
  /** Font weight */
  fontWeight: "bold" | "semibold" | "regular";
  /** CSS color value for text */
  textColor: string;
  /** Optional background color behind text */
  backgroundColor?: string;
  /** Whether to apply a text shadow for readability */
  textShadow?: boolean;
  /** Vertical alignment */
  alignment: "top" | "center" | "bottom";
  /** Horizontal alignment */
  horizontalAlign: "left" | "center" | "right";
  /** Padding in pixels for each side */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Whether to show the headline text (default: true) */
  showHeadline: boolean;
  /** Whether to show the subtitle text (default: false) */
  showSubtitle: boolean;
  /** Default freeform position to apply to generated slides */
  freePosition?: { x: number; y: number };
  /** Text alignment within the overlay block */
  textAlign?: "left" | "center" | "right";
  /** Font style (normal or italic) */
  fontStyle?: "normal" | "italic";
  /** Stroke width in pixels for outlined text */
  strokeWidth?: number;
  /** CSS color value for text stroke */
  strokeColor?: string;
  /** Padding for text background highlight: x = horizontal, y = vertical (in px at export scale) */
  backgroundPadding?: { x: number; y: number };
}

// -----------------------------------------------------------------------------
// Carousel Slide Types
// -----------------------------------------------------------------------------

/** A single slide within a carousel project */
export interface CarouselSlide {
  /** Unique identifier */
  id: string;
  /** Zero-based position in the carousel */
  position: number;
  /** Role of this slide in the narrative arc */
  slideType: "hook" | "story" | "closer";
  /** URL of the image displayed on this slide */
  imageUrl?: string;
  /** User-customized or preset-applied text overlay */
  textOverlay?: TextOverlay;
  /** State tracking for the text overlay */
  textOverlayState?: TextOverlayState;
  /** AI-generated overlay suggestion (before user edits) */
  aiGeneratedOverlay?: TextOverlay;
  /** Current generation/processing status */
  status: "pending" | "generating" | "ready" | "error";
  /** Image source metadata */
  metadata?: {
    /** Whether the image was uploaded, AI-generated, or text-only */
    source: "user_upload" | "ai_generated" | "text_only";
    /** Original filename if user-uploaded */
    originalFilename?: string;
    /** Reference image ID used for AI generation */
    referenceImage?: string;
    /** Strategy used when AI-generating this slide's image */
    generationStrategy?:
      | "variation"
      | "new_angle"
      | "detail_shot"
      | "wide_shot";
  };
  /** Percentage-based crop area applied to this slide's image */
  cropArea?: { x: number; y: number; width: number; height: number };
}

// -----------------------------------------------------------------------------
// Image Source Strategy Types
// -----------------------------------------------------------------------------

/** Mapping of a single slide to its image source */
export interface SlideImageSource {
  /** Slide position this allocation applies to */
  slidePosition: number;
  /** Whether the image comes from upload, AI generation, or text-only */
  source: "user_upload" | "ai_generated" | "text_only";
  /** Index into uploadedImages array (for user uploads) */
  referenceImageIndex?: number;
  /** Strategy for AI generation (for generated images) */
  generationStrategy?:
    | "variation"
    | "new_angle"
    | "detail_shot"
    | "wide_shot";
}

/** Calculates how images are distributed across carousel slides */
export interface ImageSourceStrategy {
  /** Total number of slides in the carousel */
  totalSlides: number;
  /** Number of user-uploaded images available */
  uploadedImages: number;
  /** Number of slides that need AI-generated images */
  requiredAIGenerated: number;
  /** Upload-to-generated ratio breakdown */
  ratio: {
    /** Count of slides using uploaded images */
    uploaded: number;
    /** Count of slides using generated images */
    generated: number;
    /** Percentage of slides using uploaded images (0-100) */
    percentage: number;
  };
  /** Whether the ratio meets the recommended threshold */
  meetsRecommendation: boolean;
  /** Per-slide source allocation plan */
  sourceAllocation: SlideImageSource[];
  /** Algorithm used for allocation */
  allocationMode: "sequential" | "smart_auto" | "manual";
}

// -----------------------------------------------------------------------------
// Camera Filter Types
// -----------------------------------------------------------------------------

/** Named predefined filter preset (Instagram-style) */
export type PredefinedFilterName =
  | "none"
  | "1977"
  | "earlybird"
  | "lofi"
  | "nashville"
  | "toaster"
  | "kelvin"
  | "xpro2"
  | "inkwell";

/** Custom adjustable filter parameters (5 nostalgic sliders) */
export interface CameraFilterParams {
  /** Film grain / noise intensity (0-100) */
  grain_amount: number;
  /** Highlight bloom / diffusion (0-100) */
  bloom_diffusion: number;
  /** Black point fade / shadow lifting (0-100) */
  shadow_fade: number;
  /** Color temperature shift: -100 (cool/blue) to +100 (warm/amber) */
  color_bias: number;
  /** Vignette edge darkening (0-100) */
  vignette_depth: number;
}

/** Complete filter configuration for a project */
export interface FilterConfig {
  /** Selected predefined filter name */
  predefinedFilter: PredefinedFilterName;
  /** Custom adjustable parameters (applied on top of predefined filter) */
  customParams: CameraFilterParams;
}

/**
 * A saved filter template (preset) containing a named FilterConfig.
 * Stored in localStorage until Clerk auth is integrated, then migrated to server.
 */
export interface FilterTemplate {
  /** Unique identifier */
  id: string;
  /** User-given display name for this template */
  name: string;
  /** The complete filter configuration snapshot */
  filterConfig: FilterConfig;
  /** ISO timestamp of when the template was created */
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Configuration & Preset Types
// -----------------------------------------------------------------------------

/** A vintage/analog camera profile with style prompt for AI generation */
export interface CameraProfile {
  /** Unique numeric identifier */
  id: number;
  /** Display name of the camera (e.g., "Polaroid SX-70") */
  camera_name: string;
  /** Prompt fragment describing this camera's visual style */
  style_prompt: string;
  /** Additional processing parameters for image generation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processing_tags: Record<string, any>;
}

/** A call-to-action preset for the final carousel slide */
export interface CTAPreset {
  /** CTA category (e.g., "engagement", "conversion") */
  category: string;
  /** The actual CTA text displayed to viewers */
  cta_text: string;
  /** Description of when to use this CTA */
  description: string;
  /** The marketing objective this CTA supports */
  marketing_goal: string;
}

/** A reusable text overlay style preset */
export interface OverlayPreset {
  /** Unique identifier */
  id: string;
  /** Display name of the preset */
  name: string;
  /** Preset category (e.g., "minimal", "bold", "vintage") */
  category: string;
  /** Description of the preset's visual style */
  description: string;
  /** Optional thumbnail image URL for preset preview */
  preview_thumbnail?: string;
  /** Styling configuration inherited by TextOverlay */
  styling: TextOverlay["styling"];
  /** Positioning configuration inherited by TextOverlay */
  positioning: TextOverlay["positioning"];
}

// -----------------------------------------------------------------------------
// Validation Types
// -----------------------------------------------------------------------------

/** Result of validating a carousel project before generation */
export interface ValidationResult {
  /** Whether the project passes all validation checks */
  valid: boolean;
  /** Blocking errors that prevent generation */
  errors: string[];
  /** Non-blocking warnings the user should review */
  warnings: string[];
  /** Whether generation can proceed (valid or only warnings) */
  canProceed: boolean;
}

// -----------------------------------------------------------------------------
// Social Media & Settings Types
// -----------------------------------------------------------------------------

/** Supported social media platforms */
export type Platform = "instagram" | "tiktok" | "linkedin" | "youtube" | "reddit" | "lemon8";

/** A linked social media account for export targeting */
export interface SocialMediaAccount {
  /** Platform identifier */
  platform: Platform;
  /** Username / handle (e.g., @johndoe) */
  username: string;
  /** Optional display name */
  displayName?: string;
  /** Whether this account is active for exports */
  active: boolean;
}

/** OAuth connection status for a social media platform */
export interface OAuthConnection {
  /** Platform identifier */
  platform: Platform;
  /** Whether the user has completed OAuth */
  connected: boolean;
  /** Platform-specific user ID (e.g., Instagram Business Account ID) */
  platformUserId?: string;
  /** Username/handle from the platform */
  platformUsername?: string;
  /** Display name from the platform */
  platformDisplayName?: string;
  /** ISO timestamp of when the connection was established */
  connectedAt?: string;
  /** ISO timestamp of when the access token expires */
  tokenExpiresAt?: string;
}

/** User-level settings persisted across sessions */
export interface UserSettings {
  /** Configured social media accounts */
  socialAccounts: SocialMediaAccount[];
  /** Default platforms selected when creating a new project */
  defaultPlatforms: Platform[];
  /** OAuth connection states — server-authoritative, synced to client */
  oauthConnections?: OAuthConnection[];
}

// -----------------------------------------------------------------------------
// Core Project Type
// -----------------------------------------------------------------------------

/** Whether the user is creating a single post or a multi-slide carousel */
export type PostMode = "single" | "carousel";

/** Top-level carousel project containing all configuration and slide data */
export interface CarouselProject {
  /** Unique project identifier */
  id: string;
  /** Single post or multi-slide carousel */
  postMode: PostMode;
  /** Selected nostalgic theme (e.g., "90s_disposable", "polaroid") */
  theme: string;
  /** User-provided keywords describing the carousel content */
  keywords: string[];
  /** Number of slides in the carousel (3-10) */
  slideCount: number;
  /** Selected camera profile ID from cameras.json */
  cameraProfileId: number;
  /** User-uploaded source images */
  uploadedImages: UploadedImage[];
  /** All slides in the carousel */
  slides: CarouselSlide[];
  /** Computed image source distribution strategy */
  imageSourceStrategy?: ImageSourceStrategy;
  /** How strictly AI should match the analog camera style */
  analogCreativityMode: "relaxed" | "recommended" | "strict";
  /** How uploaded images are assigned to slide positions */
  imageAllocationMode: "sequential" | "smart_auto" | "manual";
  /** Social media platforms this carousel targets */
  targetPlatforms: Platform[];
  /** AI writing style for generated text overlays */
  captionStyle?: "storyteller" | "minimalist" | "data_driven" | "witty" | "educational" | "poetic" | "custom";
  /** Custom writing style text when captionStyle is "custom" */
  customCaptionStyle?: string;
  /** Selected call-to-action for the closer slide */
  selectedCTA?: CTAPreset;
  /** Global overlay style configured before generation */
  globalOverlayStyle?: GlobalOverlayStyle;
  /** Pre-imported CSV text overrides, applied during generation */
  csvOverrides?: { primary: string; secondary?: string }[];
  /** AI-generated social media caption for the post */
  caption?: string;
  /** Audio transcription from voice recording */
  storyTranscription?: string;
  /** Audio clip attached for nano-cast export */
  audioClip?: AudioClip;
  /** ISO timestamp for scheduled publishing */
  scheduledPublishAt?: string;
  /** Platforms selected for scheduled publishing */
  scheduledPlatforms?: Platform[];
  /** Camera filter configuration (predefined filter + custom parameters) */
  filterConfig?: FilterConfig;
  /** JSON hash of generation-affecting config at last generation time */
  lastGeneratedConfigHash?: string;
  /** User-assigned project name */
  projectName?: string;
}

// -----------------------------------------------------------------------------
// Post History Types
// -----------------------------------------------------------------------------

/** Post publication status */
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

/** Type of post content */
export type PostType = "single" | "carousel";

/** Calendar view mode */
export type CalendarView = "daily" | "weekly" | "monthly";

// -----------------------------------------------------------------------------
// Audio & Nano-Cast Types
// -----------------------------------------------------------------------------

/** Source of audio content */
export type AudioSource = "recording" | "upload" | "library";

/** Audio clip metadata */
export interface AudioClip {
  /** Unique identifier */
  id: string;
  /** How the audio was acquired */
  source: AudioSource;
  /** Display name / filename */
  name: string;
  /** Duration in seconds */
  duration: number;
  /** MIME type (audio/mp3, audio/wav, etc.) */
  mimeType: string;
  /** Size in bytes */
  size: number;
  /** Object URL for playback (blob: URL) */
  objectUrl: string;
  /** Optional transcription text */
  transcription?: string;
  /** Trim start point in seconds */
  trimStart?: number;
  /** Trim end point in seconds */
  trimEnd?: number;
  /** Music library attribution info */
  attribution?: AudioAttribution;
  /** ISO timestamp of creation */
  createdAt: string;
}

/** Attribution info for music library tracks */
export interface AudioAttribution {
  /** Track title */
  trackTitle: string;
  /** Artist name */
  artistName: string;
  /** Source platform (jamendo, audius, ccmixter) */
  platform: string;
  /** URL to the original track */
  trackUrl: string;
  /** License type (CC-BY, CC0, etc.) */
  license: string;
  /** Pre-formatted attribution text for captions */
  attributionText: string;
}

/** Nano-cast export format */
export type NanoCastFormat = "package" | "video";

/** Transition type for video slideshow */
export type SlideTransition = "none" | "crossfade" | "slide";

// -----------------------------------------------------------------------------
// Music Search Types
// -----------------------------------------------------------------------------

/** Supported music search platforms */
export type MusicPlatform = "jamendo" | "audius";

/** A normalized music track from any supported platform */
export interface MusicTrack {
  /** Unique identifier (platform-specific) */
  id: string;
  /** Track title */
  title: string;
  /** Artist / creator name */
  artist: string;
  /** Duration in seconds */
  duration: number;
  /** Direct stream URL for playback */
  streamUrl: string;
  /** URL to album/track artwork */
  artworkUrl: string;
  /** Which platform this track comes from */
  platform: MusicPlatform;
  /** URL to the track on its native platform */
  platformUrl: string;
  /** License information (CC license URL or rights statement) */
  license: string;
  /** Genre tag, if available */
  genre?: string;
  /** Pre-formatted attribution text for captions */
  attributionText: string;
}

/** A recorded post in the user's content history */
export interface PostRecord {
  /** Unique identifier */
  id: string;
  /** Clerk user ID who created this post */
  userId: string;
  /** Post title/description snippet */
  title: string;
  /** single or carousel */
  postType: PostType;
  /** Current status */
  status: PostStatus;
  /** Platform published/scheduled to */
  platform?: string;
  /** Platform-specific post ID returned after publish */
  platformPostId?: string;
  /** URL to the published post */
  postUrl?: string;
  /** Number of slides/images */
  slideCount: number;
  /** ISO timestamp when published */
  publishedAt?: string;
  /** ISO timestamp for scheduled publish */
  scheduledAt?: string;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}
