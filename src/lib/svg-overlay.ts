import type { TextOverlay } from "./types";
import { MIN_OVERLAY_PADDING, DEFAULT_BG_PADDING, getFontFamilyWithFallback, resolveFontOption } from "./constants";
import { isLightColor } from "./utils";

/**
 * Generates an SVG string that renders the text overlay for Sharp compositing.
 * The SVG matches the full image dimensions so Sharp can composite it directly.
 */
export function generateOverlaySVG(
  overlay: TextOverlay,
  width: number,
  height: number
): string {
  const { content, styling, positioning } = overlay;

  if (!content.primary && !content.secondary && !content.accent) return "";

  const primarySize = styling.fontSize.primary;
  const secondarySize = styling.fontSize.secondary;
  const fontOption = resolveFontOption(styling.fontFamily);
  const fontWeight = fontOption?.defaultWeight ??
    (styling.fontWeight === "regular" ? 400 : styling.fontWeight === "semibold" ? 600 : 700);

  // Get font family with correct fallback (serif vs sans-serif)
  const fontFamily = getFontFamilyWithFallback(styling.fontFamily);
  const fontStyleAttr = styling.fontStyle === "italic" ? ' font-style="italic"' : "";

  // Build SVG text elements
  const textElements: string[] = [];

  // Text shadow filter — only applied when text is light-colored.
  // Dark text on light backgrounds should be flat (no shadow).
  const shouldShowShadow = styling.textShadow && isLightColor(styling.textColor);
  const filterId = "text-shadow";
  const filterDef = shouldShowShadow
    ? `<defs>
        <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.8" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>`
    : "";

  const filterAttr = shouldShowShadow ? `filter="url(#${filterId})"` : "";

  // Background rect helper — used by both freePosition and legacy paths
  function addBackgroundText(
    text: string,
    x: number,
    y: number,
    size: number,
    weight: number,
    anchor: string,
    opacity: number = 1
  ) {
    if (styling.backgroundColor) {
      // Estimate text width (approximate: 0.6 * fontSize * text.length)
      const estimatedWidth = size * 0.6 * text.length;
      const bgPad = styling.backgroundPadding ?? DEFAULT_BG_PADDING;
      const padX = bgPad.x;
      const padY = bgPad.y;
      const rectX =
        anchor === "start"
          ? x - padX
          : anchor === "end"
            ? x - estimatedWidth - padX
            : x - estimatedWidth / 2 - padX;
      const rectY = y - size * 0.85 - padY;
      const rectW = estimatedWidth + padX * 2;
      const rectH = size * 1.2 + padY * 2;

      // Convert rgba() to fill + fill-opacity for librsvg compatibility
      const bgFill = rgbaToSvgFill(styling.backgroundColor);
      textElements.push(
        `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="4" ${bgFill} />`
      );
    }

    const strokeAttr =
      styling.strokeWidth && styling.strokeColor
        ? `stroke="${styling.strokeColor}" stroke-width="${styling.strokeWidth}" paint-order="stroke fill"`
        : "";

    textElements.push(
      `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fontFamily}" font-size="${size}" font-weight="${weight}"${fontStyleAttr} fill="${styling.textColor}" opacity="${opacity}" ${filterAttr} ${strokeAttr}>${escapeXML(text)}</text>`
    );
  }

  // ── freePosition export path (preferred) ──
  // Uses percentage-based coordinates matching CSS translate anchor
  const freePos = positioning.freePosition;
  if (freePos) {
    const textAlign = styling.textAlign ?? "center";
    const svgTextAnchor = textAlign === "left" ? "start" : textAlign === "right" ? "end" : "middle";
    const svgX = (freePos.x / 100) * width;
    const svgBaseY = (freePos.y / 100) * height;

    // Calculate total text height to offset upward (matching CSS translate(X, -100%))
    const totalTextHeight =
      (content.primary ? primarySize * 1.2 : 0) +
      (content.secondary ? secondarySize * 1.3 + 8 : 0) +
      (content.accent ? secondarySize * 1.3 + 4 : 0);

    // Start Y: offset upward from the base position by the total text block height
    // Use the first text element's font size for the initial baseline
    const firstTextSize = content.primary ? primarySize : content.secondary ? secondarySize : secondarySize;
    let currentY = svgBaseY - totalTextHeight + firstTextSize;

    if (content.primary) {
      addBackgroundText(content.primary, svgX, currentY, primarySize, fontWeight, svgTextAnchor);
      currentY += primarySize * 0.4 + secondarySize + 8;
    }

    if (content.secondary) {
      if (!content.primary) {
        currentY = svgBaseY - totalTextHeight + secondarySize;
      }
      addBackgroundText(content.secondary, svgX, currentY, secondarySize, 400, svgTextAnchor, 0.9);
      currentY += secondarySize * 1.3 + 4;
    }

    if (content.accent) {
      if (!content.primary && !content.secondary) {
        currentY = svgBaseY - totalTextHeight + secondarySize;
      }
      addBackgroundText(content.accent, svgX, currentY, secondarySize, 600, svgTextAnchor, 0.85);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${filterDef}
  ${textElements.join("\n  ")}
</svg>`;
  }

  // ── Legacy padding+alignment fallback ──

  // Enforce minimum padding on all sides
  const padding = {
    top: Math.max(MIN_OVERLAY_PADDING, positioning.padding.top),
    right: Math.max(MIN_OVERLAY_PADDING, positioning.padding.right),
    bottom: Math.max(MIN_OVERLAY_PADDING, positioning.padding.bottom),
    left: Math.max(MIN_OVERLAY_PADDING, positioning.padding.left),
  };

  // Calculate text anchor based on horizontal alignment
  const textAnchor =
    positioning.horizontalAlign === "left"
      ? "start"
      : positioning.horizontalAlign === "right"
        ? "end"
        : "middle";

  // Calculate X position based on horizontal alignment
  const xPos =
    positioning.horizontalAlign === "left"
      ? padding.left
      : positioning.horizontalAlign === "right"
        ? width - padding.right
        : width / 2;

  // Calculate Y position based on vertical alignment
  let yPos: number;
  const totalTextHeight =
    (content.primary ? primarySize * 1.2 : 0) +
    (content.secondary ? secondarySize * 1.3 + 8 : 0) +
    (content.accent ? secondarySize * 1.3 + 4 : 0);

  if (positioning.alignment === "top") {
    yPos = padding.top + primarySize;
  } else if (positioning.alignment === "bottom") {
    yPos = height - padding.bottom - totalTextHeight + primarySize;
  } else {
    // center
    yPos = (height - totalTextHeight) / 2 + primarySize;
  }

  // Primary text
  let currentY = yPos;
  if (content.primary) {
    addBackgroundText(content.primary, xPos, currentY, primarySize, fontWeight, textAnchor);
    currentY = yPos + primarySize * 0.4 + secondarySize + 8;
  }

  // Secondary text
  if (content.secondary) {
    const secY = content.primary ? currentY : yPos;
    addBackgroundText(content.secondary, xPos, secY, secondarySize, 400, textAnchor, 0.9);
    currentY = secY + secondarySize * 1.3 + 4;
  }

  // Accent text
  if (content.accent) {
    addBackgroundText(content.accent, xPos, currentY, secondarySize, 600, textAnchor, 0.85);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${filterDef}
  ${textElements.join("\n  ")}
</svg>`;
}

/** Escapes special XML characters in text content */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Converts rgba() CSS color to SVG-compatible fill + fill-opacity attributes.
 * librsvg has spotty support for rgba() in fill attributes.
 * Falls back to just fill="color" for non-rgba values.
 */
function rgbaToSvgFill(color: string): string {
  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return `fill="${hex}" fill-opacity="${a}"`;
  }
  return `fill="${color}"`;
}
