import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const test = url.searchParams.get("test") || "basic";
  const checks: Record<string, unknown> = {};

  const key = process.env.NOSTALGIA_ANTHROPIC_KEY;
  checks.envVar = key ? `present (${key.length} chars, starts with ${key.substring(0, 8)}...)` : "MISSING";
  checks.nodeVersion = process.version;
  checks.region = process.env.VERCEL_REGION || "unknown";

  if (test === "basic") {
    // Quick API connectivity test
    if (key) {
      try {
        const client = new Anthropic({ apiKey: key });
        const msg = await client.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 10,
          messages: [{ role: "user", content: "Say hi" }],
        });
        const text = msg.content.find((b) => b.type === "text");
        checks.anthropicApi = `OK — response: "${text?.type === "text" ? text.text : "no text"}"`;
      } catch (err) {
        checks.anthropicApi = `FAILED — ${err instanceof Error ? err.message : String(err)}`;
      }
    }
  }

  if (test === "generate") {
    // Simulate what generateCarousel does — call generateTextOverlay for 3 slides
    if (key) {
      const client = new Anthropic({ apiKey: key });
      const slideResults: { slideIndex: number; status: string; timeMs: number; error?: string }[] = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        try {
          await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 300,
            messages: [{
              role: "user",
              content: `Generate a short headline and subtitle for slide ${i + 1} of 3 in a carousel about "Korean shopping in the winter". Return JSON: {"primary":"headline","secondary":"subtitle"}`,
            }],
          });
          slideResults.push({ slideIndex: i, status: "ok", timeMs: Date.now() - start });
        } catch (err) {
          slideResults.push({
            slideIndex: i,
            status: "error",
            timeMs: Date.now() - start,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      checks.slideResults = slideResults;
      checks.totalTimeMs = slideResults.reduce((sum, s) => sum + s.timeMs, 0);
    }
  }

  if (test === "serveraction") {
    // Test if server actions work at all by simulating the RSC serialization
    try {
      const bigPayload = {
        success: true,
        data: {
          slides: Array.from({ length: 3 }, (_, i) => ({
            id: `slide-${i}`,
            position: i,
            status: "ready",
            textOverlay: { content: { primary: `Headline ${i}`, secondary: `Subtitle ${i}` } },
          })),
          // Simulate stripped images
          uploadedImages: Array.from({ length: 3 }, (_, i) => ({
            id: `img-${i}`,
            url: "",
            filename: `photo-${i}.jpg`,
          })),
        },
      };
      const serialized = JSON.stringify(bigPayload);
      checks.payloadSizeBytes = serialized.length;
      checks.payloadSizeKB = Math.round(serialized.length / 1024);
      checks.serializationTest = "OK";
    } catch (err) {
      checks.serializationTest = `FAILED — ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json(checks);
}
