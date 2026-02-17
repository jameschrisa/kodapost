import type { CarouselProject, UploadedImage, Platform } from "@/lib/types";
import type { GenerateConfig } from "@/lib/api/helpers";
import { mapToCarouselProject } from "@/lib/api/helpers";

// =============================================================================
// Assistant Message Processing
// Types and helpers for the Production Assistant Mode workflow
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AssistantTextInput {
  type: "text";
  content: string;
}

export interface AssistantImageInput {
  type: "image";
  images: UploadedImage[];
  message?: string;
}

export interface AssistantAudioInput {
  type: "audio";
  transcription: string;
}

export type AssistantInput =
  | AssistantTextInput
  | AssistantImageInput
  | AssistantAudioInput;

export type AssistantEventType =
  | "thinking"
  | "analyzing"
  | "generating"
  | "compositing"
  | "captioning"
  | "preview-ready"
  | "error";

export interface AssistantEvent {
  type: AssistantEventType;
  message: string;
  /** The generated project, available when type is "preview-ready" */
  project?: CarouselProject;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** For user messages with images */
  images?: UploadedImage[];
  /** For user messages with audio */
  audioDuration?: number;
  /** For assistant messages showing generation progress */
  status?: AssistantEventType;
  /** The generated carousel project for preview */
  project?: CarouselProject;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

let messageCounter = 0;

export function createMessageId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

/**
 * Extracts a theme and keywords from a natural language user message.
 * Returns a simplified GenerateConfig suitable for mapToCarouselProject().
 */
export function parseUserIntent(message: string): {
  theme: string;
  keywords: string[];
  platforms: Platform[];
} {
  // Use the user's message as the theme directly — the AI pipeline
  // will interpret it during generation
  const theme = message.trim() || "nostalgic photo carousel";

  // Extract potential hashtag-like keywords from the message
  const hashtagMatches = message.match(/#(\w+)/g);
  const keywords = hashtagMatches
    ? hashtagMatches.map((h) => h.replace("#", ""))
    : extractKeywords(message);

  return {
    theme,
    keywords: keywords.slice(0, 5), // Max 5 keywords
    platforms: ["instagram"] as Platform[], // Default platform
  };
}

/**
 * Simple keyword extraction from a natural language message.
 * Picks out nouns/adjectives that might be relevant for carousel generation.
 */
function extractKeywords(message: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    "i", "me", "my", "a", "an", "the", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "to", "of", "in",
    "for", "on", "with", "at", "by", "from", "about", "as", "into", "this",
    "that", "these", "those", "it", "its", "and", "but", "or", "not", "no",
    "so", "if", "then", "than", "too", "very", "just", "some", "any", "all",
    "want", "make", "create", "post", "carousel", "please", "help",
  ]);

  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Return unique words
  return Array.from(new Set(words));
}

/**
 * Builds a CarouselProject from assistant input, ready for the AI pipeline.
 */
export function buildProjectFromInput(
  input: AssistantInput,
  images: UploadedImage[] = []
): CarouselProject {
  let theme: string;
  let keywords: string[];
  let platforms: Platform[];
  let storyTranscription: string | undefined;

  switch (input.type) {
    case "text": {
      const intent = parseUserIntent(input.content);
      theme = intent.theme;
      keywords = intent.keywords;
      platforms = intent.platforms;
      break;
    }
    case "image": {
      const msg = input.message || "photo carousel";
      const intent = parseUserIntent(msg);
      theme = intent.theme;
      keywords = intent.keywords;
      platforms = intent.platforms;
      images = input.images;
      break;
    }
    case "audio": {
      const intent = parseUserIntent(input.transcription);
      theme = intent.theme;
      keywords = intent.keywords;
      platforms = intent.platforms;
      storyTranscription = input.transcription;
      break;
    }
  }

  const config: GenerateConfig = {
    theme,
    platforms,
    keywords,
    slideCount: Math.min(Math.max(images.length, 3), 10),
    captionStyle: "storyteller",
  };

  const project = mapToCarouselProject(config, images);

  if (storyTranscription) {
    project.storyTranscription = storyTranscription;
  }

  return project;
}
