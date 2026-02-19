import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// =============================================================================
// POST /api/telegram/setup
//
// One-time setup endpoint to register the webhook URL with Telegram.
// Protected by API_ADMIN_SECRET (same as API key management).
//
// Call this once after deployment to tell Telegram where to send updates:
//
//   curl -X POST https://your-app.vercel.app/api/telegram/setup \
//     -H "Authorization: Bearer YOUR_API_ADMIN_SECRET"
//
// This will:
//   1. Generate a webhook secret token
//   2. Call Telegram's setWebhook API
//   3. Return the registration result
//
// To remove the webhook (for local dev with polling):
//   curl -X DELETE https://your-app.vercel.app/api/telegram/setup \
//     -H "Authorization: Bearer YOUR_API_ADMIN_SECRET"
// =============================================================================

/**
 * POST — Register webhook with Telegram
 */
export async function POST(request: NextRequest) {
  // Authenticate with admin secret
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.API_ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "API_ADMIN_SECRET not configured" },
      { status: 500 }
    );
  }

  const token = authHeader?.replace("Bearer ", "");
  if (token !== adminSecret) {
    return NextResponse.json(
      { error: "Unauthorized. Provide API_ADMIN_SECRET as Bearer token." },
      { status: 401 }
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      {
        error: "TELEGRAM_BOT_TOKEN not configured",
        setup: {
          step1:
            "Open Telegram and message @BotFather",
          step2:
            'Send /newbot and follow the prompts to create your bot',
          step3:
            "Copy the bot token and add it to .env.local as TELEGRAM_BOT_TOKEN",
          step4: "Re-run this setup endpoint",
        },
      },
      { status: 400 }
    );
  }

  // Build webhook URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 }
    );
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  // Generate a secret token for webhook verification
  const webhookSecret =
    process.env.TELEGRAM_WEBHOOK_SECRET ||
    crypto.randomBytes(32).toString("hex");

  // Register with Telegram
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      // Only receive messages (photos and text) — skip other update types
      allowed_updates: ["message"],
      // Drop pending updates to avoid replaying old messages
      drop_pending_updates: true,
    }),
  });

  const result = await response.json();

  if (result.ok) {
    return NextResponse.json({
      status: "Webhook registered successfully!",
      webhookUrl,
      telegramResponse: result,
      next_steps: [
        `Add TELEGRAM_WEBHOOK_SECRET=${webhookSecret} to your .env.local`,
        "Message your bot on Telegram — send /start",
        "Send photos to test the carousel creation flow",
      ],
    });
  }

  return NextResponse.json(
    {
      error: "Failed to register webhook with Telegram",
      telegramResponse: result,
    },
    { status: 500 }
  );
}

/**
 * DELETE — Remove webhook (useful for switching to polling in dev)
 */
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.API_ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "API_ADMIN_SECRET not configured" },
      { status: 500 }
    );
  }

  const token = authHeader?.replace("Bearer ", "");
  if (token !== adminSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/deleteWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: true }),
    }
  );

  const result = await response.json();

  return NextResponse.json({
    status: "Webhook removed",
    telegramResponse: result,
  });
}

/**
 * GET — Check current webhook status
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.API_ADMIN_SECRET;

  if (!adminSecret || authHeader?.replace("Bearer ", "") !== adminSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({
      configured: false,
      setup_instructions: {
        step1: "Open Telegram and message @BotFather",
        step2: "Send /newbot and follow the prompts",
        step3: "Copy the bot token to .env.local as TELEGRAM_BOT_TOKEN",
        step4: "POST to this endpoint with Authorization: Bearer <API_ADMIN_SECRET>",
      },
    });
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getWebhookInfo`
  );
  const result = await response.json();

  return NextResponse.json({
    configured: true,
    webhookInfo: result.result,
  });
}
