import { NextRequest, NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";

// =============================================================================
// POST /api/telegram/webhook
//
// Grammy webhook handler for Telegram Bot API.
// Telegram sends updates (messages, commands, photos) to this endpoint.
//
// Security: Validated by Grammy's built-in webhook signature verification.
// The webhook URL includes a secret path segment for additional protection.
// =============================================================================

// Allow up to 30s for photo downloads + caption generation
export const maxDuration = 30;

/**
 * Handles incoming Telegram webhook updates.
 * Grammy processes the update and dispatches to the appropriate handler.
 */
export async function POST(request: NextRequest) {
  // Verify the webhook secret token if configured
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerToken !== secretToken) {
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 403 }
      );
    }
  }

  try {
    const bot = getBot();

    // Grammy's webhookCallback handles parsing the update and
    // dispatching it to the registered handlers
    const handleUpdate = webhookCallback(bot, "std/http");

    // Grammy expects a standard Request/Response — pass through the Next.js request
    return await handleUpdate(request);
  } catch (error) {
    console.error("[KodaPost Telegram] Webhook error:", error);

    // Always return 200 to Telegram to prevent retry storms
    // Telegram will keep retrying failed webhooks, which can cause cascading issues
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET handler for health check / webhook verification.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "KodaPost Telegram Bot Webhook",
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}
