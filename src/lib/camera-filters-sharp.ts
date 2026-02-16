import sharp from "sharp";
import type { FilterConfig, PredefinedFilterName } from "./types";
import { PREDEFINED_FILTERS } from "./filter-presets";

// =============================================================================
// Sharp Camera Filter Processing (Server-Side Export)
// =============================================================================
// Applies camera filter effects using Sharp for exported images.
// Mirrors the CSS preview as closely as possible.

/**
 * Applies the full camera filter pipeline to an image buffer.
 * Processes named filter effects + custom parameter adjustments.
 *
 * @param imageBuffer - Source image as a Buffer
 * @param config - Filter configuration (predefined + custom params)
 * @param width - Target width for the output
 * @param height - Target height for the output
 * @returns Processed image as a Buffer
 */
export async function applyCameraFilters(
  imageBuffer: Buffer,
  config: FilterConfig,
  width: number,
  height: number
): Promise<Buffer> {
  // Skip processing if no filter is applied
  if (
    config.predefinedFilter === "none" &&
    config.customParams.grain_amount === 0 &&
    config.customParams.bloom_diffusion === 0 &&
    config.customParams.shadow_fade === 0 &&
    config.customParams.color_bias === 0 &&
    config.customParams.vignette_depth === 0
  ) {
    return imageBuffer;
  }

  let pipeline = sharp(imageBuffer).ensureAlpha();

  // --- 1. Apply named filter base effects ---
  pipeline = applyNamedFilter(pipeline, config.predefinedFilter);

  // --- 2. Apply custom parameter adjustments ---
  const params = config.customParams;

  // Shadow fade: lift black point by applying a linear adjustment
  if (params.shadow_fade > 0) {
    const offset = params.shadow_fade * 0.4; // 0-40 brightness offset
    const contrast = 1 - params.shadow_fade * 0.003;
    pipeline = pipeline.linear(contrast, offset);
  }

  // Color bias: warm (sepia-like tint) or cool (blue tint)
  if (params.color_bias > 0) {
    // Warm: shift toward amber/gold
    pipeline = pipeline.modulate({ hue: params.color_bias * 0.3 });
  } else if (params.color_bias < 0) {
    // Cool: shift toward blue
    pipeline = pipeline.modulate({ hue: params.color_bias * 0.5 });
  }

  // Bloom diffusion: brighten and apply a subtle softening
  if (params.bloom_diffusion > 0) {
    const brightnessFactor = 1 + params.bloom_diffusion * 0.002;
    pipeline = pipeline.modulate({ brightness: brightnessFactor });
  }

  // Convert to buffer for compositing operations
  let resultBuffer = await pipeline.toBuffer();

  // --- 3. Composite overlays ---
  const composites: sharp.OverlayOptions[] = [];

  // Named filter gradient overlay
  const preset = PREDEFINED_FILTERS[config.predefinedFilter];
  if (preset.overlayGradient) {
    const gradientSVG = buildGradientSVG(
      preset.overlayGradient,
      width,
      height
    );
    const gradientBuffer = Buffer.from(gradientSVG);
    composites.push({
      input: gradientBuffer,
      top: 0,
      left: 0,
      blend: mapBlendMode(preset.overlayBlendMode),
    });
  }

  // Vignette
  if (params.vignette_depth > 0) {
    const vignetteBuffer = await generateVignetteBuffer(
      width,
      height,
      params.vignette_depth
    );
    composites.push({
      input: vignetteBuffer,
      top: 0,
      left: 0,
      blend: "multiply",
    });
  }

  // Grain noise
  if (params.grain_amount > 0) {
    const grainBuffer = await generateGrainBuffer(
      width,
      height,
      params.grain_amount
    );
    composites.push({
      input: grainBuffer,
      top: 0,
      left: 0,
      blend: "overlay",
    });
  }

  if (composites.length > 0) {
    resultBuffer = await sharp(resultBuffer)
      .composite(composites)
      .toBuffer();
  }

  return resultBuffer;
}

// =============================================================================
// Named Filter Implementations
// =============================================================================

function applyNamedFilter(
  pipeline: sharp.Sharp,
  filterName: PredefinedFilterName
): sharp.Sharp {
  switch (filterName) {
    case "1977":
      // contrast(1.1) brightness(1.1) saturate(1.3)
      return pipeline
        .linear(1.1, -(128 * 0.1))
        .modulate({ brightness: 1.1, saturation: 1.3 });

    case "earlybird":
      // contrast(0.9) sepia(0.2)
      return pipeline
        .linear(0.9, 128 * 0.1)
        .recomb(sepiaMatrix(0.2));

    case "lofi":
      // saturate(1.1) contrast(1.5)
      return pipeline
        .modulate({ saturation: 1.1 })
        .linear(1.5, -(128 * 0.5));

    case "nashville":
      // sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)
      return pipeline
        .recomb(sepiaMatrix(0.2))
        .linear(1.2, -(128 * 0.2))
        .modulate({ brightness: 1.05, saturation: 1.2 });

    case "toaster":
      // contrast(1.5) brightness(0.9)
      return pipeline
        .linear(1.5, -(128 * 0.5))
        .modulate({ brightness: 0.9 });

    case "kelvin":
      // sepia(0.15) saturate(1.4) brightness(1.2)
      return pipeline
        .recomb(sepiaMatrix(0.15))
        .modulate({ saturation: 1.4, brightness: 1.2 });

    case "xpro2":
      // sepia(0.3)
      return pipeline.recomb(sepiaMatrix(0.3));

    case "inkwell":
      // sepia(0.3) contrast(1.1) brightness(1.1) grayscale(1)
      return pipeline
        .recomb(sepiaMatrix(0.3))
        .linear(1.1, -(128 * 0.1))
        .modulate({ brightness: 1.1 })
        .greyscale();

    case "none":
    default:
      return pipeline;
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Creates a sepia color matrix for Sharp's recomb() method.
 * Blends between identity and full sepia based on amount (0-1).
 */
function sepiaMatrix(amount: number): [
  [number, number, number],
  [number, number, number],
  [number, number, number]
] {
  const s = amount;
  const i = 1 - amount;
  return [
    [i + s * 0.393, s * 0.769, s * 0.189],
    [s * 0.349, i + s * 0.686, s * 0.168],
    [s * 0.272, s * 0.534, i + s * 0.131],
  ];
}

/**
 * Maps CSS blend mode names to Sharp composite blend modes.
 */
function mapBlendMode(
  mode?: string
): "over" | "multiply" | "screen" | "overlay" {
  switch (mode) {
    case "multiply":
      return "multiply";
    case "screen":
      return "screen";
    case "overlay":
      return "overlay";
    default:
      return "over";
  }
}

/**
 * Builds an SVG string for a CSS gradient overlay.
 * Parses common linear-gradient and radial-gradient patterns.
 */
function buildGradientSVG(
  cssGradient: string,
  width: number,
  height: number
): string {
  // Simple SVG rect with semi-transparent fill as approximation
  // For complex gradients, we parse the color stops
  const isRadial = cssGradient.includes("radial-gradient");

  if (isRadial) {
    // Extract colors from radial-gradient
    const colors = extractRgbaColors(cssGradient);
    const innerColor = colors[0] || "rgba(0,0,0,0)";
    const outerColor = colors[1] || "rgba(0,0,0,0.2)";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${innerColor}" />
          <stop offset="100%" stop-color="${outerColor}" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
    </svg>`;
  }

  // Linear gradient
  const colors = extractRgbaColors(cssGradient);
  const startColor = colors[0] || "rgba(0,0,0,0)";
  const endColor = colors[1] || "rgba(0,0,0,0)";

  // Detect direction
  const isToBottom = cssGradient.includes("to bottom");
  const isToRight = cssGradient.includes("to right");

  const x1 = "0%";
  const y1 = "0%";
  const x2 = isToRight ? "100%" : "0%";
  const y2 = isToBottom || !isToRight ? "100%" : "0%";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" stop-color="${startColor}" />
        <stop offset="100%" stop-color="${endColor}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)" />
  </svg>`;
}

/**
 * Extracts rgba() color values from a CSS gradient string.
 */
function extractRgbaColors(gradient: string): string[] {
  const rgbaPattern = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/g;
  const colors: string[] = [];
  let match;
  while ((match = rgbaPattern.exec(gradient)) !== null) {
    const [, r, g, b, a] = match;
    colors.push(`rgba(${r},${g},${b},${a || "1"})`);
  }
  return colors;
}

/**
 * Generates a vignette overlay as a buffer.
 */
async function generateVignetteBuffer(
  width: number,
  height: number,
  depth: number
): Promise<Buffer> {
  const opacity = depth * 0.008;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="v" cx="50%" cy="50%" r="50%">
        <stop offset="40%" stop-color="rgba(255,255,255,1)" stop-opacity="1" />
        <stop offset="100%" stop-color="rgba(0,0,0,${opacity})" stop-opacity="1" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#v)" />
  </svg>`;
  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

/**
 * Generates a grain noise overlay as a buffer.
 * Uses random pixel data for authentic film grain.
 */
async function generateGrainBuffer(
  width: number,
  height: number,
  amount: number
): Promise<Buffer> {
  // Downscale for performance, then upscale (grain should be larger than 1px)
  const grainScale = 4;
  const gw = Math.ceil(width / grainScale);
  const gh = Math.ceil(height / grainScale);
  const pixelCount = gw * gh;

  // Generate random grayscale noise with alpha based on amount
  const alpha = Math.round((amount / 100) * 80); // max 80/255 opacity
  const rawData = Buffer.alloc(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    const v = Math.floor(Math.random() * 256);
    const offset = i * 4;
    rawData[offset] = v;     // R
    rawData[offset + 1] = v; // G
    rawData[offset + 2] = v; // B
    rawData[offset + 3] = alpha; // A
  }

  return sharp(rawData, { raw: { width: gw, height: gh, channels: 4 } })
    .resize(width, height, { kernel: "nearest" })
    .png()
    .toBuffer();
}
