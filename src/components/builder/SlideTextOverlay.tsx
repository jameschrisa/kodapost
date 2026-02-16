"use client";

import { cn, isLightColor } from "@/lib/utils";
import { MIN_OVERLAY_PADDING, DEFAULT_BG_PADDING, getFontFamilyWithFallback, resolveFontOption } from "@/lib/constants";
import type { TextOverlay } from "@/lib/types";

interface SlideTextOverlayProps {
  overlay: TextOverlay;
  /** Scale factor for preview cards (smaller than export) */
  scale?: number;
  /** Enable pointer events for drag-to-position in the edit panel */
  interactive?: boolean;
}

/**
 * Maps a font name to its CSS variable so next/font/google loaded fonts render correctly.
 */
function getFontStyle(fontName: string): string {
  const option = resolveFontOption(fontName);
  if (option) {
    return `var(${option.cssVariable}), ${getFontFamilyWithFallback(fontName)}`;
  }
  return getFontFamilyWithFallback(fontName);
}

/**
 * Renders a text overlay on top of a slide image.
 * Uses CSS absolute positioning to place text over the image container.
 * The parent element must have `position: relative`.
 *
 * Supports two rendering modes:
 * 1. **freePosition** (preferred): Uses percentage-based `left`/`top` with `translate(-50%, -100%)`
 *    anchoring. Text hangs above the position point (bottom-center anchor). WYSIWYG with drag.
 * 2. **padding+alignment** (legacy fallback): Uses CSS flex + padding. Used for old slides
 *    that don't have `freePosition` set.
 */
export function SlideTextOverlay({ overlay, scale = 0.3, interactive = false }: SlideTextOverlayProps) {
  const { content, styling, positioning } = overlay;

  // Only skip rendering if ALL text content is empty
  if (!content.primary && !content.secondary && !content.accent) return null;

  // Scale font sizes for the preview card (preview is ~200px wide vs 1080px export)
  const primarySize = Math.max(3, Math.round(styling.fontSize.primary * scale));
  const secondarySize = Math.max(2, Math.round(styling.fontSize.secondary * scale));

  const fontFamily = getFontStyle(styling.fontFamily);
  const fontOption = resolveFontOption(styling.fontFamily);
  const fontWeight = fontOption?.defaultWeight ?? (styling.fontWeight === "regular" ? 400 : styling.fontWeight === "semibold" ? 600 : 700);
  const fontStyle = styling.fontStyle ?? "normal";
  const textAlign = styling.textAlign ?? "center";

  // Only apply shadow when text is light-colored (readability aid on dark backgrounds).
  // Dark text on light backgrounds should be flat — no shadow.
  const shouldShowShadow = styling.textShadow && isLightColor(styling.textColor);

  // Background padding for text highlight (scaled for preview)
  const bgPad = styling.backgroundPadding ?? DEFAULT_BG_PADDING;
  const bgPadStyle = {
    paddingLeft: `${Math.max(1, Math.round(bgPad.x * scale))}px`,
    paddingRight: `${Math.max(1, Math.round(bgPad.x * scale))}px`,
    paddingTop: `${Math.max(0, Math.round(bgPad.y * scale))}px`,
    paddingBottom: `${Math.max(0, Math.round(bgPad.y * scale))}px`,
  };

  // Shared text rendering helper
  const renderTextContent = () => (
    <>
      {/* Primary text */}
      {content.primary && (
        <p
          style={{
            fontFamily,
            fontSize: `${primarySize}px`,
            fontWeight,
            fontStyle,
            color: styling.textColor,
            textShadow: shouldShowShadow
              ? "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)"
              : undefined,
            lineHeight: 1.2,
          }}
        >
          {styling.backgroundColor && (
            <span
              className="inline-block rounded-sm"
              style={{ ...bgPadStyle, backgroundColor: styling.backgroundColor }}
            >
              {content.primary}
            </span>
          )}
          {!styling.backgroundColor && content.primary}
        </p>
      )}

      {/* Secondary text */}
      {content.secondary && (
        <p
          className="mt-0.5"
          style={{
            fontFamily,
            fontSize: `${secondarySize}px`,
            fontWeight: 400,
            fontStyle,
            color: styling.textColor,
            opacity: 0.9,
            textShadow: shouldShowShadow
              ? "0 1px 2px rgba(0,0,0,0.8)"
              : undefined,
            lineHeight: 1.3,
          }}
        >
          {styling.backgroundColor && (
            <span
              className="inline-block rounded-sm"
              style={{ ...bgPadStyle, backgroundColor: styling.backgroundColor }}
            >
              {content.secondary}
            </span>
          )}
          {!styling.backgroundColor && content.secondary}
        </p>
      )}

      {/* Accent text */}
      {content.accent && (
        <p
          className="mt-0.5"
          style={{
            fontFamily,
            fontSize: `${secondarySize}px`,
            fontWeight: 600,
            fontStyle,
            color: styling.textColor,
            opacity: 0.85,
            textShadow: shouldShowShadow
              ? "0 1px 2px rgba(0,0,0,0.8)"
              : undefined,
            lineHeight: 1.3,
          }}
        >
          {content.accent}
        </p>
      )}
    </>
  );

  // ── freePosition rendering path (preferred) ──
  // Uses percentage-based positioning with bottom-center anchor.
  // The position point is where the bottom of the text sits.
  const freePos = positioning.freePosition;
  if (freePos) {
    const translateX = textAlign === "left" ? "0%" : textAlign === "right" ? "-100%" : "-50%";
    const textAlignClass = textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center";
    return (
      <div
        className={cn(
          "absolute z-[5]",
          interactive ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{
          left: `${freePos.x}%`,
          top: `${freePos.y}%`,
          transform: `translate(${translateX}, -100%)`,
          maxWidth: "80%",
        }}
      >
        <div className={textAlignClass}>
          {renderTextContent()}
        </div>
      </div>
    );
  }

  // ── Legacy padding+alignment fallback ──
  // Used for old slides that don't have freePosition set.

  // Map vertical alignment to CSS
  const verticalAlign = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
  }[positioning.alignment];

  // Map horizontal alignment to CSS
  const horizontalAlign = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[positioning.horizontalAlign];

  // Enforce minimum padding before scaling
  const enforcedPadding = {
    top: Math.max(MIN_OVERLAY_PADDING, positioning.padding.top),
    right: Math.max(MIN_OVERLAY_PADDING, positioning.padding.right),
    bottom: Math.max(MIN_OVERLAY_PADDING, positioning.padding.bottom),
    left: Math.max(MIN_OVERLAY_PADDING, positioning.padding.left),
  };

  // Scale padding
  const pad = {
    top: Math.round(enforcedPadding.top * scale),
    right: Math.round(enforcedPadding.right * scale),
    bottom: Math.round(enforcedPadding.bottom * scale),
    left: Math.round(enforcedPadding.left * scale),
  };

  return (
    <div
      className={cn("absolute inset-0 z-[5] flex flex-col", interactive ? "pointer-events-auto" : "pointer-events-none", verticalAlign)}
      style={{
        paddingTop: `${pad.top}px`,
        paddingRight: `${pad.right}px`,
        paddingBottom: `${pad.bottom}px`,
        paddingLeft: `${pad.left}px`,
      }}
    >
      <div className={cn("w-full", horizontalAlign)}>
        {renderTextContent()}
      </div>
    </div>
  );
}
