#!/usr/bin/env node
/**
 * Generate PWA assets: maskable icon + Apple startup images.
 *
 * Usage: node scripts/generate-pwa-assets.mjs
 *
 * Requires: sharp (already a project dependency)
 */

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const sourceIcon = path.join(iconsDir, "icon-512x512.png");

// Purple brand colour (matches theme_color in manifest)
const PURPLE = { r: 124, g: 58, b: 237, alpha: 1 }; // #7c3aed
const DARK = { r: 10, g: 10, b: 10, alpha: 1 }; // #0a0a0a

// Apple startup image sizes: [width, height]
const STARTUP_SIZES = [
  [1290, 2796], // iPhone 15 Pro Max / 14 Pro Max
  [1179, 2556], // iPhone 15 / 14 Pro
  [1170, 2532], // iPhone 14 / 13
  [750, 1334], // iPhone SE / 8
];

async function generateMaskableIcon() {
  console.log("Generating maskable icon...");
  const size = 512;
  // Logo occupies ~55% of canvas (inside the 80% safe zone)
  const logoSize = Math.round(size * 0.55); // 282

  const logo = await sharp(sourceIcon)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: PURPLE,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512x512.png"));

  console.log("  -> icon-maskable-512x512.png");
}

async function generateStartupImages() {
  console.log("Generating Apple startup images...");

  for (const [w, h] of STARTUP_SIZES) {
    // Logo at ~20% of the shorter dimension
    const logoSize = Math.round(Math.min(w, h) * 0.2);

    const logo = await sharp(sourceIcon)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const filename = `apple-startup-${w}x${h}.png`;
    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: DARK,
      },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toFile(path.join(iconsDir, filename));

    console.log(`  -> ${filename}`);
  }
}

async function main() {
  await generateMaskableIcon();
  await generateStartupImages();
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
