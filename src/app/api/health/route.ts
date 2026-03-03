import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const test = url.searchParams.get("test") || "none";
  const checks: Record<string, unknown> = {};

  const key = process.env.NOSTALGIA_ANTHROPIC_KEY;
  checks.envVar = key ? "present" : "MISSING";
  checks.nodeVersion = process.version;
  checks.region = process.env.VERCEL_REGION || "unknown";

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
