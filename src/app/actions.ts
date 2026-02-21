"use server";

import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type {
  CarouselProject,
  CarouselSlide,
  FilterConfig,
  GlobalOverlayStyle,
  ImageAnalysis,
  TextOverlay,
} from "@/lib/types";
import { generateOverlaySVG } from "@/lib/svg-overlay";
import { PLATFORM_IMAGE_SPECS, DEFAULT_OVERLAY_STYLING, DEFAULT_OVERLAY_PADDING, FREE_POSITION_FROM_ALIGNMENT, FREE_POSITION_X_FROM_HORIZONTAL } from "@/lib/constants";
import {
  calculateImageSourceStrategy,
  getSlideType,
} from "@/lib/image-source-calculator";
import { handleAPIError, parseDataUri } from "@/lib/utils";
import { applyCameraFilters } from "@/lib/camera-filters-sharp";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Strips markdown code fences from LLM responses before JSON parsing.
 * Handles ```json ... ```, ``` ... ```, and raw JSON.
 */
function extractJSON(text: string): string {
  // Remove markdown code fences: ```json\n...\n``` or ```\n...\n```
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

// -----------------------------------------------------------------------------
// API Clients (lazy-initialized to avoid crashing at build time)
// -----------------------------------------------------------------------------

function getAnthropicClient(): Anthropic {
  // Use NOSTALGIA_ANTHROPIC_KEY to avoid conflict with Claude Code's
  // own ANTHROPIC_API_KEY env var (which shadows .env.local values).
  const key = process.env.NOSTALGIA_ANTHROPIC_KEY;
  if (!key) {
    throw new Error(
      "Missing NOSTALGIA_ANTHROPIC_KEY environment variable. " +
        "Add it to .env.local — get your key at https://console.anthropic.com/settings/keys"
    );
  }
  return new Anthropic({ apiKey: key });
}

// -----------------------------------------------------------------------------
// Server Action Result Type
// -----------------------------------------------------------------------------

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -----------------------------------------------------------------------------
// Image Analysis
// -----------------------------------------------------------------------------

/**
 * Uses Claude Vision to analyze an uploaded image.
 * Returns structured metadata including composition, mood, subjects,
 * lighting, color palette, and a suggested carousel placement.
 */
export async function analyzeImage(
  imageUrl: string
): Promise<ActionResult<ImageAnalysis>> {
  try {
    // Build the image source: use base64 for data URIs, URL for remote images
    const parsed = parseDataUri(imageUrl);
    const imageSource: Anthropic.ImageBlockParam["source"] = parsed
      ? {
          type: "base64" as const,
          media_type: parsed.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: parsed.data,
        }
      : { type: "url" as const, url: imageUrl };

    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: imageSource,
            },
            {
              type: "text",
              text: `Analyze this image for use in a social media carousel. Return ONLY valid JSON matching this exact schema:

{
  "mainSubject": "primary subject description",
  "composition": "wide_shot" | "close_up" | "portrait" | "landscape" | "detail",
  "keyElements": ["element1", "element2", "element3"],
  "setting": "description of environment",
  "mood": "overall mood/feeling",
  "lightingConditions": "bright" | "soft" | "dramatic" | "low_light" | "backlit",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "suggestedUseCase": "hook" | "story" | "detail" | "closer"
}

For suggestedUseCase:
- "hook": bold, eye-catching images ideal for the first slide
- "story": narrative images that build a sequence
- "detail": close-ups or texture shots for mid-carousel
- "closer": memorable images suited for the final slide`,
            },
          ],
        },
      ],
    });

    const fallback: ImageAnalysis = {
      mainSubject: "Unknown subject",
      composition: "landscape",
      keyElements: [],
      setting: "Unknown",
      mood: "neutral",
      lightingConditions: "soft",
      colorPalette: [],
      suggestedUseCase: "story",
    };

    try {
      const textBlock = message.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        return {
          success: true,
          data: { ...fallback, ...JSON.parse(extractJSON(textBlock.text)) },
        };
      }
    } catch {
      // JSON parse failed — use fallback
    }

    return { success: true, data: fallback };
  } catch (error) {
    return { success: false, error: handleAPIError(error) };
  }
}

// -----------------------------------------------------------------------------
// Text Overlay Generation
// -----------------------------------------------------------------------------

/**
 * Resolves the headline mode from GlobalOverlayStyle with backward-compat fallback.
 * Existing projects that only have showHeadline (bool) are mapped to "all" or "none".
 */
function resolveHeadlineMode(gos?: GlobalOverlayStyle): "all" | "first_only" | "none" {
  if (gos?.headlineMode) return gos.headlineMode;
  return gos?.showHeadline === false ? "none" : "all";
}

/**
 * Generates a text overlay for a single slide using Claude.
 * Returns a TextOverlay with AI-written primary/secondary text
 * and default styling.
 */
async function generateTextOverlay(
  theme: string,
  keywords: string[],
  slideType: "hook" | "story" | "closer",
  slidePosition: number,
  totalSlides: number,
  globalStyle?: GlobalOverlayStyle,
  captionStyle?: "storyteller" | "minimalist" | "data_driven" | "witty" | "educational" | "poetic" | "custom",
  customCaptionStyle?: string
): Promise<TextOverlay> {
  const styleLines: Record<string, string> = {
    storyteller: "\n- Style: storyteller — warm, personal, narrative tone",
    minimalist: "\n- Style: minimalist — ultra-short, modern, fewer words is better",
    data_driven: "\n- Style: data-driven — use numbers, stats, or facts when possible",
    witty: "\n- Style: witty — clever wordplay, humor, and a light entertaining tone",
    educational: "\n- Style: educational — teach something, share tips or insights clearly",
    poetic: "\n- Style: poetic — lyrical, evocative language that paints a picture",
  };
  const styleLine = captionStyle === "custom" && customCaptionStyle
    ? `\n- Style: ${customCaptionStyle}`
    : styleLines[captionStyle ?? "storyteller"] ?? styleLines.storyteller;

  const message = await getAnthropicClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate short text overlay content for slide ${slidePosition + 1} of ${totalSlides} in a social media carousel.

Theme: ${theme}
Keywords: ${keywords.join(", ")}
Slide role: ${slideType}

Rules:
- "primary": A punchy headline (max 8 words)
- For hook slides: grab attention immediately
- For story slides: continue the narrative
- For closer slides: include a call-to-action feel${styleLine}

Respond with ONLY valid JSON in this exact format:
{"primary": "..."}`,
          },
        ],
      },
    ],
  });

  let primary = "Your Story Starts Here";

  try {
    const textBlock = message.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      const parsed = JSON.parse(extractJSON(textBlock.text));
      primary = parsed.primary || primary;
    }
  } catch {
    // Fall back to defaults if parsing fails
  }

  return {
    content: { primary },
    styling: {
      fontFamily: globalStyle?.fontFamily ?? DEFAULT_OVERLAY_STYLING.fontFamily,
      fontSize: {
        primary: globalStyle?.fontSize.primary ?? DEFAULT_OVERLAY_STYLING.fontSize.primary,
        secondary: globalStyle?.fontSize.secondary ?? DEFAULT_OVERLAY_STYLING.fontSize.secondary,
      },
      fontWeight: globalStyle?.fontWeight ?? (DEFAULT_OVERLAY_STYLING.fontWeight as "bold"),
      textColor: globalStyle?.textColor ?? DEFAULT_OVERLAY_STYLING.textColor,
      backgroundColor: globalStyle?.backgroundColor ?? DEFAULT_OVERLAY_STYLING.backgroundColor,
      textShadow: globalStyle?.textShadow ?? DEFAULT_OVERLAY_STYLING.textShadow,
    },
    positioning: {
      alignment: globalStyle?.alignment ?? "bottom",
      horizontalAlign: globalStyle?.horizontalAlign ?? "center",
      padding: globalStyle?.padding ? { ...globalStyle.padding } : { ...DEFAULT_OVERLAY_PADDING },
      freePosition: globalStyle?.freePosition ?? {
        x: FREE_POSITION_X_FROM_HORIZONTAL[globalStyle?.horizontalAlign ?? "center"],
        y: FREE_POSITION_FROM_ALIGNMENT[globalStyle?.alignment ?? "bottom"].y,
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Main Carousel Generation
// -----------------------------------------------------------------------------

/**
 * Main carousel generation server action.
 *
 * Calculates image source strategy, assigns uploaded images to slides,
 * marks remaining slides as text-only, produces text overlays for every
 * slide, and returns the fully populated project.
 */
export async function generateCarousel(
  project: CarouselProject
): Promise<ActionResult<CarouselProject>> {
  console.log("[generateCarousel] Starting generation for", project.slideCount, "slides");
  try {
    // 1. Calculate image source strategy
    const strategy = calculateImageSourceStrategy(
      project.uploadedImages.length,
      project.slideCount,
      project.imageAllocationMode
    );

    // 2. Build initial slides array
    const slides: CarouselSlide[] = strategy.sourceAllocation.map(
      (allocation) => {
        const slideType = getSlideType(
          allocation.slidePosition,
          project.slideCount
        );
        return {
          id: `slide-${allocation.slidePosition}`,
          position: allocation.slidePosition,
          slideType,
          status: "pending" as const,
          metadata: {
            source: allocation.source,
            referenceImage:
              allocation.referenceImageIndex !== undefined
                ? project.uploadedImages[allocation.referenceImageIndex]?.id
                : undefined,
            generationStrategy: allocation.generationStrategy,
          },
        };
      }
    );

    let errorCount = 0;
    let firstError = "";

    // Resolve headline mode once for the entire run
    const headlineMode = resolveHeadlineMode(project.globalOverlayStyle);

    // 3. Process each slide: assign images and generate overlays
    for (const slide of slides) {
      try {
        slide.status = "generating";

        if (slide.metadata?.source === "user_upload") {
          const refId = slide.metadata.referenceImage;
          const uploaded = project.uploadedImages.find(
            (img) => img.id === refId
          );
          if (uploaded) {
            slide.imageUrl = uploaded.url;
            slide.metadata.originalFilename = uploaded.filename;
          }
        }
        // text_only slides: no imageUrl — these will render as styled
        // text-on-background during preview and get a solid color
        // background during export compositing.

        // Generate text overlay for every slide
        const overlay = await generateTextOverlay(
          project.theme,
          project.keywords,
          slide.slideType,
          slide.position,
          project.slideCount,
          project.globalOverlayStyle,
          project.captionStyle,
          project.customCaptionStyle
        );

        // Always preserve full AI text in aiGeneratedOverlay
        slide.aiGeneratedOverlay = overlay;
        // Apply headline mode visibility per slide
        const showOnThisSlide =
          headlineMode === "all" ||
          (headlineMode === "first_only" && slide.position === 0);
        slide.textOverlay = {
          ...overlay,
          content: {
            ...overlay.content,
            primary: showOnThisSlide ? overlay.content.primary : "",
            secondary: undefined,
          },
        };

        // Apply CSV overrides if available
        const csvRow = project.csvOverrides?.[slide.position];
        if (csvRow) {
          slide.textOverlay.content.primary = csvRow.primary;
        }

        slide.textOverlayState = {
          slideId: slide.id,
          enabled: true,
          source: csvRow ? "user_override" : "ai_generated",
          lastModified: new Date().toISOString(),
          customizations: {
            textEdited: false,
            styleEdited: false,
            positionEdited: false,
          },
        };

        slide.status = "ready";
      } catch (error) {
        slide.status = "error";
        errorCount++;
        const msg = handleAPIError(error);
        if (!firstError) firstError = msg;
      }
    }

    // Strip base64 image data from the response to avoid exceeding
    // Vercel's serverless response size limit (~6MB). The client merges
    // the original images back from its local state after receiving this.
    const strippedImages = project.uploadedImages.map(img => ({
      ...img,
      url: "", // Stripped — client will restore from local state
    }));

    // Also strip imageUrl from slides (these contain base64 data copies)
    const strippedSlides = slides.map(slide => ({
      ...slide,
      imageUrl: slide.imageUrl?.startsWith("data:") ? "" : slide.imageUrl,
    }));

    const result: CarouselProject = {
      ...project,
      uploadedImages: strippedImages,
      slides: strippedSlides,
      imageSourceStrategy: strategy,
    };

    if (errorCount === slides.length) {
      return {
        success: false,
        error: `All slides failed to generate. First error: ${firstError}`,
      };
    }

    console.log("[generateCarousel] Success — returning", result.slides.length, "slides");
    return { success: true, data: result };
  } catch (error) {
    console.error("[generateCarousel] Error:", error);
    return { success: false, error: handleAPIError(error) };
  }
}

// -----------------------------------------------------------------------------
// Single Slide Regeneration (Retry)
// -----------------------------------------------------------------------------

/**
 * Regenerates a single slide that previously failed or needs refreshing.
 * Re-uses the same project context (theme, keywords, overlay style) to
 * produce a new text overlay for the given slide position.
 */
export async function regenerateSlide(
  project: CarouselProject,
  slideIndex: number
): Promise<ActionResult<CarouselSlide>> {
  try {
    const slide = project.slides[slideIndex];
    if (!slide) {
      return { success: false, error: `Slide index ${slideIndex} not found` };
    }

    // Re-assign image if user_upload
    let imageUrl = slide.imageUrl;
    if (slide.metadata?.source === "user_upload") {
      const refId = slide.metadata.referenceImage;
      const uploaded = project.uploadedImages.find((img) => img.id === refId);
      if (uploaded) {
        imageUrl = uploaded.url;
      }
    }

    // Regenerate text overlay
    const overlay = await generateTextOverlay(
      project.theme,
      project.keywords,
      slide.slideType,
      slide.position,
      project.slideCount,
      project.globalOverlayStyle,
      project.captionStyle,
      project.customCaptionStyle
    );

    const updatedSlide: CarouselSlide = {
      ...slide,
      imageUrl,
      aiGeneratedOverlay: overlay,
      textOverlay: {
        ...overlay,
        content: {
          ...overlay.content,
          primary: project.globalOverlayStyle?.showHeadline === false ? "" : overlay.content.primary,
          secondary: project.globalOverlayStyle?.showSubtitle === false ? undefined : overlay.content.secondary,
        },
      },
      textOverlayState: {
        slideId: slide.id,
        enabled: true,
        source: "ai_generated",
        lastModified: new Date().toISOString(),
        customizations: {
          textEdited: false,
          styleEdited: false,
          positionEdited: false,
        },
      },
      status: "ready",
    };

    return { success: true, data: updatedSlide };
  } catch (error) {
    return { success: false, error: handleAPIError(error) };
  }
}

// -----------------------------------------------------------------------------
// AI Caption Generation
// -----------------------------------------------------------------------------

/**
 * Generates a social media caption using Claude.
 * Incorporates the theme, keywords (as hashtags), and optional transcription context.
 */
export async function generateCaption(
  theme: string,
  keywords: string[],
  storyTranscription?: string,
  audioContext?: {
    source: "recording" | "upload" | "library";
    trackTitle?: string;
    artistName?: string;
  },
  captionStyle?: "storyteller" | "minimalist" | "data_driven" | "witty" | "educational" | "poetic" | "custom",
  customCaptionStyle?: string
): Promise<ActionResult<string>> {
  try {
    const hashtagsLine = keywords.length > 0
      ? `\nHashtags to include: ${keywords.map((k) => `#${k.replace(/\s+/g, "")}`).join(" ")}`
      : "";

    const transcriptionLine = storyTranscription
      ? `\nStory context from voice recording: "${storyTranscription}"`
      : "";

    const audioLine =
      audioContext?.source === "library" && audioContext.trackTitle
        ? `\nThe post includes a music track: "${audioContext.trackTitle}" by ${audioContext.artistName ?? "Unknown Artist"}`
        : "";

    const styleGuides: Record<string, string> = {
      storyteller: "\n\nWriting style: Storyteller — use a warm, narrative voice. Make it personal and emotionally engaging.",
      minimalist: "\n\nWriting style: Minimalist — use short, punchy sentences. Be modern, clean, and direct. Think less is more.",
      data_driven: "\n\nWriting style: Data-driven — incorporate stats, numbers, or facts. Sound authoritative and knowledgeable.",
      witty: "\n\nWriting style: Witty — use humor, clever wordplay, and a light tone. Be entertaining and shareable.",
      educational: "\n\nWriting style: Educational — teach something valuable. Use clear explanations, tips, or step-by-step insights.",
      poetic: "\n\nWriting style: Poetic — use lyrical, evocative language. Paint a picture with words and create an emotional atmosphere.",
    };
    const styleGuide = captionStyle === "custom" && customCaptionStyle
      ? `\n\nWriting style: ${customCaptionStyle}`
      : styleGuides[captionStyle ?? "storyteller"] ?? styleGuides.storyteller;

    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Write a compelling social media caption for an Instagram carousel post.

Theme: ${theme}${hashtagsLine}${transcriptionLine}${audioLine}${styleGuide}

Rules:
- Keep it engaging and authentic (2-4 sentences)
- Include a call-to-action (e.g., "Save this for later", "Tag someone who needs this")
- End with relevant hashtags — use NO MORE than 8 hashtags total
- Keep total length under 2200 characters
- Do NOT use markdown formatting
- Write ONLY the caption text, nothing else${audioLine ? "\n- If relevant, subtly reference the music vibe (don't force it)" : ""}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      return { success: true, data: textBlock.text.trim() };
    }

    return { success: false, error: "No text in response" };
  } catch (error) {
    return { success: false, error: handleAPIError(error) };
  }
}

// -----------------------------------------------------------------------------
// Image Export / Compositing
// -----------------------------------------------------------------------------

interface CompositeResult {
  platform: string;
  slideIndex: number;
  imageBase64: string;
  format: "jpeg" | "png";
}

const PLATFORM_SPEC_MAP: Record<string, keyof typeof PLATFORM_IMAGE_SPECS> = {
  instagram: "instagram_feed",
  tiktok: "tiktok",
  linkedin: "linkedin_pdf",
  youtube: "youtube_community",
  reddit: "reddit_gallery",
  lemon8: "lemon8_post",
};

/**
 * Composites text overlays onto slide images using Sharp, resized per platform.
 * Returns base64-encoded images ready for ZIP packaging on the client.
 */
export async function compositeSlideImages(
  slides: CarouselSlide[],
  platforms: string[],
  filterConfig?: FilterConfig
): Promise<ActionResult<CompositeResult[]>> {
  try {
    const results: CompositeResult[] = [];

    for (const platform of platforms) {
      const specKey = PLATFORM_SPEC_MAP[platform];
      if (!specKey) continue;

      const spec = PLATFORM_IMAGE_SPECS[specKey];
      const format = spec.format === "PNG" ? "png" : "jpeg";

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (slide.status !== "ready") continue;

        try {
          // 1. Get the source image as a Buffer, or create a solid bg for text-only slides
          let pipeline: sharp.Sharp;

          if (slide.imageUrl) {
            let imageBuffer: Buffer;
            const parsed = parseDataUri(slide.imageUrl);
            if (parsed) {
              imageBuffer = Buffer.from(parsed.data, "base64");
            } else if (slide.imageUrl.startsWith("http")) {
              const resp = await fetch(slide.imageUrl);
              const arrayBuf = await resp.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuf);
            } else {
              continue; // Skip slides with no usable image source
            }

            // 2a. Apply crop if set, then resize to the platform dimensions
            let sourceSharp = sharp(imageBuffer);

            if (slide.cropArea) {
              const metadata = await sourceSharp.metadata();
              if (metadata.width && metadata.height) {
                const left = Math.round((slide.cropArea.x / 100) * metadata.width);
                const top = Math.round((slide.cropArea.y / 100) * metadata.height);
                const width = Math.round((slide.cropArea.width / 100) * metadata.width);
                const height = Math.round((slide.cropArea.height / 100) * metadata.height);
                // Re-initialize pipeline with extract to avoid double-decode
                const croppedBuf = await sourceSharp.extract({ left, top, width, height }).toBuffer();
                sourceSharp = sharp(croppedBuf);
              }
            }

            pipeline = sourceSharp.resize(spec.width, spec.height, {
              fit: "cover",
              position: "center",
            });
          } else {
            // 2b. Text-only slide: create a solid color background
            // Use overlay backgroundColor if available, else a neutral dark background
            const bgColor = slide.textOverlay?.styling?.backgroundColor || "rgba(30, 30, 30, 1)";
            // Parse rgba to Sharp-compatible object
            const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            const bg = rgbaMatch
              ? { r: parseInt(rgbaMatch[1]), g: parseInt(rgbaMatch[2]), b: parseInt(rgbaMatch[3]), alpha: 1 }
              : { r: 30, g: 30, b: 30, alpha: 1 };

            pipeline = sharp({
              create: {
                width: spec.width,
                height: spec.height,
                channels: 4,
                background: bg,
              },
            });
          }

          // 3. Apply camera filters (if configured and slide has an image)
          if (filterConfig && slide.imageUrl) {
            const resizedBuffer = await pipeline.png().toBuffer();
            const filteredBuffer = await applyCameraFilters(
              resizedBuffer,
              filterConfig,
              spec.width,
              spec.height
            );
            pipeline = sharp(filteredBuffer);
          }

          // 4. Composite the text overlay SVG if present
          if (slide.textOverlay) {
            const svgString = generateOverlaySVG(
              slide.textOverlay,
              spec.width,
              spec.height
            );
            if (svgString) {
              const svgBuffer = Buffer.from(svgString);
              pipeline = pipeline.composite([
                { input: svgBuffer, top: 0, left: 0 },
              ]);
            }
          }

          // 4. Encode to the platform's format
          let outputBuffer: Buffer;
          if (format === "png") {
            // PNG uses compressionLevel (0-9), not quality
            outputBuffer = await pipeline.png({ compressionLevel: 6 }).toBuffer();
          } else {
            outputBuffer = await pipeline.jpeg({ quality: spec.quality }).toBuffer();
          }

          results.push({
            platform,
            slideIndex: i,
            imageBase64: outputBuffer.toString("base64"),
            format,
          });
        } catch (err) {
          console.error(
            `[Export] Failed to composite slide ${i} for ${platform}:`,
            err
          );
          // Skip failed slides but continue with the rest
        }
      }
    }

    if (results.length === 0) {
      return {
        success: false,
        error: "No images could be composited. Check that slides have valid images.",
      };
    }

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: handleAPIError(error) };
  }
}

// -----------------------------------------------------------------------------
// Audio Transcription
// -----------------------------------------------------------------------------

/**
 * Validates and passes through a client-side transcription.
 *
 * Audio transcription is performed client-side using the Web Speech API
 * (SpeechRecognition). This server action receives the transcribed text
 * and optionally enriches it using Claude for carousel generation context.
 */
export async function transcribeAudio(
  rawTranscription: string
): Promise<ActionResult<string>> {
  try {
    if (!rawTranscription || rawTranscription.trim().length < 3) {
      return {
        success: false,
        error: "Transcription is too short or empty. Please try recording again.",
      };
    }

    // Use Claude to clean up and enrich the raw transcription
    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Clean up the following voice transcription from a user describing what they want in a social media carousel post. Fix grammar, remove filler words, but preserve their intent, themes, and key phrases.

Raw transcription: "${rawTranscription}"

Rules:
- Keep the cleaned text concise (1-3 sentences)
- Preserve the speaker's creative vision and key details
- Fix obvious speech-to-text errors
- Write ONLY the cleaned transcription, nothing else`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      return { success: true, data: textBlock.text.trim() };
    }

    // Fallback: return the raw transcription if Claude doesn't respond
    return { success: true, data: rawTranscription.trim() };
  } catch (error) {
    // If Claude fails, still return the raw transcription
    console.error("Failed to enrich transcription:", error);
    return { success: true, data: rawTranscription.trim() };
  }
}
