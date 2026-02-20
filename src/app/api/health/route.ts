import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check env var exists
  const key = process.env.NOSTALGIA_ANTHROPIC_KEY;
  checks.envVar = key ? `present (${key.length} chars, starts with ${key.substring(0, 8)}...)` : "MISSING";

  // 2. Try a minimal Anthropic API call
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

  // 3. Check Node.js runtime info
  checks.nodeVersion = process.version;
  checks.platform = process.platform;
  checks.region = process.env.VERCEL_REGION || "unknown";

  return NextResponse.json(checks);
}
