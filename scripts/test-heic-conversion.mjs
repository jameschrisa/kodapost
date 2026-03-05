#!/usr/bin/env node

/**
 * HEIC Conversion Debug Test Script
 *
 * Tests the /api/convert-image endpoint with real HEIC files.
 * Run with: node scripts/test-heic-conversion.mjs [baseUrl]
 *
 * Examples:
 *   node scripts/test-heic-conversion.mjs                    # default: http://localhost:3000
 *   node scripts/test-heic-conversion.mjs https://kodapost.vercel.app
 *
 * Requires test files in local/test/*.HEIC
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || "http://localhost:3000";
const TEST_DIR = path.resolve(__dirname, "../local/test");

function memMB() {
  const { rss, heapUsed } = process.memoryUsage();
  return `rss=${(rss / 1024 / 1024).toFixed(0)}MB heap=${(heapUsed / 1024 / 1024).toFixed(0)}MB`;
}

async function testFile(filePath) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const fileSizeKB = (fileBuffer.length / 1024).toFixed(0);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${fileName} (${fileSizeKB} KB)`);
  console.log(`${"=".repeat(60)}`);

  // Build FormData (Node 18+ has native FormData)
  const blob = new Blob([fileBuffer], { type: "image/heic" });
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Sending POST ${BASE_URL}/api/convert-image`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const response = await fetch(`${BASE_URL}/api/convert-image`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const elapsed = Date.now() - startTime;
    console.log(`[${elapsed}ms] Response: HTTP ${response.status} ${response.statusText}`);
    console.log(`  Content-Length: ${response.headers.get("content-length") || "unknown"}`);

    const result = await response.json();

    if (result.success) {
      const dataUriSizeKB = (result.dataUri.length / 1024).toFixed(0);
      console.log(`  SUCCESS`);
      console.log(`    Original: ${(result.originalSize / 1024).toFixed(0)} KB`);
      console.log(`    Converted: ${(result.convertedSize / 1024).toFixed(0)} KB`);
      console.log(`    Data URI size: ${dataUriSizeKB} KB`);
      if (result.debug) {
        console.log(`    Server debug:`, result.debug);
      }
    } else {
      console.log(`  FAILED: ${result.error}`);
      if (result.debug) {
        console.log(`    Server debug:`, result.debug);
      }
    }
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.log(`  FETCH ERROR after ${elapsed}ms:`);
    console.log(`    Type: ${err.constructor?.name || typeof err}`);
    console.log(`    Message: ${err.message}`);
    if (err.cause) console.log(`    Cause: ${err.cause}`);
  }

  console.log(`  Local memory: ${memMB()}`);
}

// --- Local pipeline test (no server needed) ---
async function testLocalPipeline(filePath) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  console.log(`\nLocal pipeline test: ${fileName}`);

  // Test 1: Sharp direct
  try {
    const sharp = (await import("sharp")).default;
    const start = Date.now();
    await sharp(fileBuffer)
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    console.log(`  Sharp direct: SUCCESS in ${Date.now() - start}ms`);
  } catch (e) {
    console.log(`  Sharp direct: FAILED — ${e.message.split("\n")[0]}`);
  }

  // Test 2: heic-convert + Sharp
  try {
    const heicConvert = (await import("heic-convert")).default;
    const sharp = (await import("sharp")).default;

    const start = Date.now();
    const jpegResult = await heicConvert({
      buffer: fileBuffer,
      format: "JPEG",
      quality: 0.92,
    });
    const convertMs = Date.now() - start;

    const resized = await sharp(Buffer.from(jpegResult))
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const totalMs = Date.now() - start;

    console.log(
      `  heic-convert+sharp: SUCCESS in ${totalMs}ms (convert=${convertMs}ms) → ${(resized.length / 1024).toFixed(0)}KB`
    );
    console.log(`  Memory: ${memMB()}`);
  } catch (e) {
    console.log(`  heic-convert+sharp: FAILED — ${e.message}`);
  }
}

// --- Main ---
async function main() {
  console.log("HEIC Conversion Debug Test");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test dir: ${TEST_DIR}`);
  console.log(`Node: ${process.version}`);
  console.log(`Memory: ${memMB()}`);

  if (!fs.existsSync(TEST_DIR)) {
    console.error(`\nERROR: Test directory not found: ${TEST_DIR}`);
    console.error("Place HEIC test files in local/test/");
    process.exit(1);
  }

  const heicFiles = fs
    .readdirSync(TEST_DIR)
    .filter((f) => f.toLowerCase().endsWith(".heic"))
    .sort()
    .map((f) => path.join(TEST_DIR, f));

  if (heicFiles.length === 0) {
    console.error("\nERROR: No .HEIC files found in", TEST_DIR);
    process.exit(1);
  }

  console.log(`\nFound ${heicFiles.length} HEIC files:`);
  heicFiles.forEach((f) =>
    console.log(`  ${path.basename(f)} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`)
  );

  // Run local pipeline tests
  console.log("\n" + "=".repeat(60));
  console.log("LOCAL PIPELINE TESTS (no server)");
  console.log("=".repeat(60));
  for (const f of heicFiles) {
    await testLocalPipeline(f);
  }

  // Run server API tests
  console.log("\n" + "=".repeat(60));
  console.log("SERVER API TESTS");
  console.log("=".repeat(60));

  // Test sequentially (matches how ImageUploader sends them)
  for (const f of heicFiles) {
    await testFile(f);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DONE — Check server logs for [convert-image] entries");
  console.log("=".repeat(60));
}

main().catch(console.error);
