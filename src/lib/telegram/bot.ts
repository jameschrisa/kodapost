import { Bot, Context } from "grammy";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { telegramSessions } from "@/lib/db/schema";
import { generateId } from "@/lib/api/helpers";
import { downloadTelegramPhoto } from "./helpers";

// =============================================================================
// KodaPost Telegram Bot
//
// Guided conversation flow for creating carousels via Telegram.
// Mirrors the Production Assistant flow: photos -> story -> vibes -> caption -> generate
// =============================================================================

/** Flow stages matching the DB enum */
type FlowStage =
  | "waiting_photos"
  | "waiting_story"
  | "waiting_vibes"
  | "waiting_caption"
  | "generating"
  | "ready"
  | "published";

interface SessionData {
  chatId: string;
  stage: FlowStage;
  story: string | null;
  vibes: string | null;
  caption: string | null;
  slideCount: number | null;
  photoFileIds: string[];
  jobId: string | null;
  lastActivityAt: string;
  createdAt: string;
}

// Session TTL: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Valid vibes for tone selection
const VALID_VIBES = [
  "relatable",
  "inspirational",
  "promotional",
  "controversial",
  "observational",
];

// -----------------------------------------------------------------------------
// Session Management
// -----------------------------------------------------------------------------

async function getSession(chatId: string): Promise<SessionData | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(telegramSessions)
    .where(eq(telegramSessions.chatId, chatId))
    .limit(1);

  if (!row) return null;

  // Check expiry
  const lastActivity = new Date(row.lastActivityAt).getTime();
  if (Date.now() - lastActivity > SESSION_TTL_MS) {
    await db
      .delete(telegramSessions)
      .where(eq(telegramSessions.chatId, chatId));
    return null;
  }

  return {
    chatId: row.chatId,
    stage: row.stage as FlowStage,
    story: row.story,
    vibes: row.vibes,
    caption: row.caption,
    slideCount: row.slideCount,
    photoFileIds: (row.photoFileIds as string[]) || [],
    jobId: row.jobId,
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
  };
}

async function upsertSession(data: SessionData): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  const values = {
    chatId: data.chatId,
    stage: data.stage,
    story: data.story,
    vibes: data.vibes,
    caption: data.caption,
    slideCount: data.slideCount,
    photoFileIds: data.photoFileIds as unknown as Record<string, unknown>,
    jobId: data.jobId,
    lastActivityAt: now,
    createdAt: data.createdAt || now,
  };

  // Upsert: insert or update on conflict
  const existing = await db
    .select({ chatId: telegramSessions.chatId })
    .from(telegramSessions)
    .where(eq(telegramSessions.chatId, data.chatId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(telegramSessions)
      .set({ ...values, createdAt: undefined })
      .where(eq(telegramSessions.chatId, data.chatId));
  } else {
    await db.insert(telegramSessions).values(values);
  }
}

function createNewSession(chatId: string): SessionData {
  const now = new Date().toISOString();
  return {
    chatId,
    stage: "waiting_photos",
    story: null,
    vibes: null,
    caption: null,
    slideCount: null,
    photoFileIds: [],
    jobId: null,
    lastActivityAt: now,
    createdAt: now,
  };
}

// -----------------------------------------------------------------------------
// Bot Creation
// -----------------------------------------------------------------------------

let _bot: Bot | null = null;

/**
 * Returns the singleton Grammy Bot instance.
 * Creates and configures it on first call.
 */
export function getBot(): Bot {
  if (_bot) return _bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "Missing TELEGRAM_BOT_TOKEN environment variable. " +
        "Create a bot via @BotFather on Telegram and add the token to .env.local"
    );
  }

  const bot = new Bot(token);

  // ---------------------------------------------------------------------------
  // /start command
  // ---------------------------------------------------------------------------
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const session = createNewSession(chatId);
    await upsertSession(session);

    await ctx.reply(
      "Hey! I'm KodaPost Bot \u{1f4f8}\n\n" +
        "Send me your photos and I'll create a beautiful carousel post for you.\n\n" +
        "Just drop your pics here to get started!",
      { parse_mode: "Markdown" }
    );
  });

  // ---------------------------------------------------------------------------
  // /help command
  // ---------------------------------------------------------------------------
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "\u{1f4d6} *KodaPost Bot — Help*\n\n" +
        "Here's how to create a carousel:\n\n" +
        "1\u20e3 *Send photos* — Drop 1-10 images\n" +
        "2\u20e3 *Tell your story* — What's the post about?\n" +
        "3\u20e3 *Pick vibes* — Set the tone\n" +
        "4\u20e3 *Review caption* — Edit or approve\n" +
        "5\u20e3 *Generate!* — I'll build your carousel\n\n" +
        "*Commands:*\n" +
        "/start — Start fresh\n" +
        "/status — Check progress\n" +
        "/reset — Clear and start over\n" +
        "/help — Show this guide",
      { parse_mode: "Markdown" }
    );
  });

  // ---------------------------------------------------------------------------
  // /status command
  // ---------------------------------------------------------------------------
  bot.command("status", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const session = await getSession(chatId);

    if (!session) {
      await ctx.reply("No active session. Send /start to begin!");
      return;
    }

    const check = (ok: boolean) => (ok ? "\u2705" : "\u2b1c");
    const photos = session.photoFileIds.length;
    const hasStory = !!session.story;
    const hasVibes = !!session.vibes;
    const hasCaption = !!session.caption;

    const lines = [
      `${check(photos > 0)} Photos \u2014 ${photos} uploaded`,
      `${check(hasStory)} Story \u2014 ${hasStory ? `"${session.story!.slice(0, 50)}${session.story!.length > 50 ? "..." : ""}"` : "not set"}`,
      `${check(hasVibes)} Vibes \u2014 ${hasVibes ? session.vibes : "none picked"}`,
      `${check(hasCaption)} Caption \u2014 ${hasCaption ? "written" : "not yet"}`,
    ];

    await ctx.reply(
      `\u{1f4cb} *Project Status*\n\n${lines.join("\n")}\n\nStage: _${session.stage}_`,
      { parse_mode: "Markdown" }
    );
  });

  // ---------------------------------------------------------------------------
  // /reset command
  // ---------------------------------------------------------------------------
  bot.command("reset", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const db = getDb();
    await db
      .delete(telegramSessions)
      .where(eq(telegramSessions.chatId, chatId));

    const session = createNewSession(chatId);
    await upsertSession(session);

    await ctx.reply(
      "\u{1f504} Session cleared! Send me your photos to start a new carousel."
    );
  });

  // ---------------------------------------------------------------------------
  // Photo handler
  // ---------------------------------------------------------------------------
  bot.on("message:photo", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const session = (await getSession(chatId)) || createNewSession(chatId);

    // Get the largest version of the photo
    const photos = ctx.message.photo;
    const largest = photos[photos.length - 1];
    const fileId = largest.file_id;

    // Add to session
    session.photoFileIds.push(fileId);

    if (session.photoFileIds.length > 10) {
      await ctx.reply(
        "\u{26a0}\u{fe0f} Maximum 10 photos per carousel. I'll use the first 10."
      );
      session.photoFileIds = session.photoFileIds.slice(0, 10);
    }

    // If this is the first photo and we're in waiting_photos stage
    if (session.stage === "waiting_photos") {
      session.stage = "waiting_story";
      await upsertSession(session);

      const count = session.photoFileIds.length;
      await ctx.reply(
        `\u{1f4f8} Nice ${count === 1 ? "pic" : "pics"}! Got ${count} photo${count > 1 ? "s" : ""} so far.\n\n` +
          `Send more, or tell me — *what's the story?*\n` +
          `Where were you? What were you doing?`,
        { parse_mode: "Markdown" }
      );
    } else if (session.stage === "waiting_story") {
      await upsertSession(session);
      const count = session.photoFileIds.length;
      await ctx.reply(
        `\u{1f4f8} Got it! ${count} photo${count > 1 ? "s" : ""} total. Send more, or tell me about your story.`
      );
    } else {
      // Photos added in later stages
      await upsertSession(session);
      const count = session.photoFileIds.length;
      await ctx.reply(
        `\u{1f4f8} Added! ${count} photo${count > 1 ? "s" : ""} total.`
      );
    }
  });

  // ---------------------------------------------------------------------------
  // Text message handler — guided flow
  // ---------------------------------------------------------------------------
  bot.on("message:text", async (ctx) => {
    // Skip if it's a command (already handled above)
    if (ctx.message.text.startsWith("/")) return;

    const chatId = ctx.chat.id.toString();
    const session = (await getSession(chatId)) || createNewSession(chatId);
    const text = ctx.message.text.trim();
    const lower = text.toLowerCase();

    switch (session.stage) {
      case "waiting_photos": {
        // User sent text before photos — nudge them
        await ctx.reply(
          "\u{1f4f7} Send me your photos first! Just drop them here and I'll get started."
        );
        break;
      }

      case "waiting_story": {
        // Treat the message as the story
        session.story = text.slice(0, 300);
        session.stage = "waiting_vibes";
        await upsertSession(session);

        await ctx.reply(
          `\u{1f4dd} Great story! Now let's set the *vibe*.\n\n` +
            `Pick one or more:\n` +
            `\u2022 *relatable* \u2014 casual, everyday\n` +
            `\u2022 *inspirational* \u2014 uplifting, motivating\n` +
            `\u2022 *promotional* \u2014 product/brand focused\n` +
            `\u2022 *controversial* \u2014 bold, thought-provoking\n` +
            `\u2022 *observational* \u2014 reflective, thoughtful\n\n` +
            `Type the vibe(s) you want, or say "skip" to use defaults.`,
          { parse_mode: "Markdown" }
        );
        break;
      }

      case "waiting_vibes": {
        if (lower === "skip" || lower === "next") {
          session.vibes = "relatable";
          session.stage = "waiting_caption";
          await upsertSession(session);

          await ctx.reply(
            "\u{1f3af} Using *relatable* vibes. Generating your caption...",
            { parse_mode: "Markdown" }
          );

          // Trigger caption generation
          await generateAndSendCaption(ctx, session);
        } else {
          // Extract vibes from message
          const matched = VALID_VIBES.filter((v) => lower.includes(v));
          if (matched.length > 0) {
            session.vibes = matched.join(",");
            session.stage = "waiting_caption";
            await upsertSession(session);

            const vibeLabels = matched
              .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
              .join(", ");

            await ctx.reply(
              `\u{1f3af} Vibes set to: *${vibeLabels}*\n\nGenerating your caption...`,
              { parse_mode: "Markdown" }
            );

            await generateAndSendCaption(ctx, session);
          } else {
            await ctx.reply(
              '\u{1f914} I didn\'t catch a vibe from that. Try typing one of: relatable, inspirational, promotional, controversial, observational\n\nOr say "skip" to use defaults.'
            );
          }
        }
        break;
      }

      case "waiting_caption": {
        if (
          lower === "ok" ||
          lower === "looks good" ||
          lower === "approve" ||
          lower === "yes" ||
          lower === "generate" ||
          lower === "go" ||
          lower === "let's go" ||
          lower.includes("generate") ||
          lower.includes("build") ||
          lower.includes("create")
        ) {
          // Approve caption and trigger generation
          session.stage = "generating";
          await upsertSession(session);

          await ctx.reply(
            "\u{1f680} Building your carousel! This may take a minute..."
          );

          await triggerCarouselGeneration(ctx, session);
        } else if (
          lower.includes("change") ||
          lower.includes("edit") ||
          lower.includes("rewrite") ||
          lower.includes("refine")
        ) {
          await ctx.reply(
            "\u{270f}\u{fe0f} Regenerating your caption with adjustments...",
          );
          await generateAndSendCaption(ctx, session);
        } else {
          // Treat as a custom caption
          session.caption = text;
          await upsertSession(session);

          await ctx.reply(
            "\u{270d}\u{fe0f} Caption updated!\n\n" +
              `"${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"\n\n` +
              'Say *"generate"* to build your carousel, or send a new caption to change it.',
            { parse_mode: "Markdown" }
          );
        }
        break;
      }

      case "generating": {
        await ctx.reply(
          "\u{23f3} Your carousel is being generated. Hang tight!"
        );
        break;
      }

      case "ready":
      case "published": {
        if (lower === "new" || lower.includes("start over") || lower === "reset") {
          const newSession = createNewSession(chatId);
          await upsertSession(newSession);
          await ctx.reply(
            "\u{1f504} Fresh start! Send me your photos to create a new carousel."
          );
        } else {
          await ctx.reply(
            "\u{2728} Your carousel is ready! Check the preview link above.\n\n" +
              'Say "new" to start a fresh carousel, or send /reset.'
          );
        }
        break;
      }
    }
  });

  _bot = bot;
  return bot;
}

// -----------------------------------------------------------------------------
// Caption Generation
// -----------------------------------------------------------------------------

async function generateAndSendCaption(
  ctx: Context,
  session: SessionData
): Promise<void> {
  try {
    // Dynamic import to avoid circular deps
    const { generateCaption } = await import("@/app/actions");

    const vibes = session.vibes?.split(",") || ["relatable"];
    const result = await generateCaption(
      session.story || "photo carousel",
      vibes,
      undefined // no voice transcription from Telegram
    );

    if (result.success) {
      session.caption = result.data;
      session.stage = "waiting_caption";
      await upsertSession(session);

      await ctx.reply(
        `\u{270d}\u{fe0f} *Here's your caption:*\n\n${result.data}\n\n` +
          "\u2014\u2014\u2014\n" +
          '\u2705 Say *"generate"* to build the carousel\n' +
          "\u{270f}\u{fe0f} Or type a new caption to replace it\n" +
          '\u{1f504} Say *"rewrite"* for a fresh take',
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "\u{26a0}\u{fe0f} Couldn't generate a caption right now. Try typing your own, or say \"rewrite\" to try again."
      );
    }
  } catch (error) {
    console.error("[KodaPost Telegram] Caption generation error:", error);
    await ctx.reply(
      "\u{26a0}\u{fe0f} Something went wrong generating the caption. Try typing your own!"
    );
  }
}

// -----------------------------------------------------------------------------
// Carousel Generation
// -----------------------------------------------------------------------------

async function triggerCarouselGeneration(
  ctx: Context,
  session: SessionData
): Promise<void> {
  try {
    const bot = getBot();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Download all photos from Telegram
    const uploadedImages = await Promise.all(
      session.photoFileIds.map(async (fileId, index) => {
        return downloadTelegramPhoto(bot, fileId, index);
      })
    );

    // Import generation functions
    const { generateId: genId } = await import("@/lib/api/helpers");
    const { getDb: getDatabase } = await import("@/lib/db/client");
    const { jobs } = await import("@/lib/db/schema");

    // Build config
    const vibes = session.vibes?.split(",") || [];
    const slideCount = session.slideCount || Math.min(Math.max(uploadedImages.length, 2), 10);

    const config = {
      theme: session.story || "photo carousel",
      platforms: ["instagram" as const],
      slideCount,
      keywords: vibes,
      captionStyle: "storyteller" as const,
    };

    // Create a job record for tracking
    const db = getDatabase();
    const jobId = genId("tg");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    // Find or create an API key for the Telegram bot
    const apiKeyId = await getOrCreateTelegramApiKey();

    await db.insert(jobs).values({
      id: jobId,
      apiKeyId,
      status: "pending",
      inputConfig: {
        theme: config.theme,
        platforms: config.platforms,
        slideCount: config.slideCount,
        keywords: config.keywords,
        source: "telegram",
        chatId: session.chatId,
      } as unknown as Record<string, unknown>,
      createdAt: now.toISOString(),
      expiresAt,
    });

    session.jobId = jobId;
    await upsertSession(session);

    // Run pipeline
    const { processGenerationJob } = await import(
      "@/lib/api/generate-pipeline"
    );
    await processGenerationJob(jobId, config, uploadedImages);

    // Check result
    const [completedJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (completedJob?.status === "completed") {
      session.stage = "ready";
      await upsertSession(session);

      const previewUrl = `${appUrl}/preview/${jobId}`;

      await ctx.reply(
        `\u{2728} *Your carousel is ready!*\n\n` +
          `\u{1f517} [View & Download Your Carousel](${previewUrl})\n\n` +
          `\u{1f4f8} ${slideCount} slides generated for Instagram\n` +
          (session.caption
            ? `\u{1f4dd} Caption included\n`
            : "") +
          `\n\u2014\u2014\u2014\n` +
          `Say "new" to create another carousel!`,
        {
          parse_mode: "Markdown",
          // Disable link preview so the URL is clickable
          link_preview_options: { is_disabled: true },
        }
      );
    } else {
      session.stage = "waiting_caption";
      await upsertSession(session);

      await ctx.reply(
        `\u{26a0}\u{fe0f} Generation failed: ${completedJob?.error || "Unknown error"}\n\n` +
          'Try again by saying "generate", or send /reset to start over.'
      );
    }
  } catch (error) {
    console.error("[KodaPost Telegram] Generation error:", error);

    session.stage = "waiting_caption";
    await upsertSession(session);

    await ctx.reply(
      "\u{26a0}\u{fe0f} Something went wrong during generation. Try again by saying \"generate\", or send /reset."
    );
  }
}

// -----------------------------------------------------------------------------
// Internal API Key for Telegram Bot
// -----------------------------------------------------------------------------

async function getOrCreateTelegramApiKey(): Promise<string> {
  const db = getDb();
  const { apiKeys } = await import("@/lib/db/schema");
  const { eq: eqOp } = await import("drizzle-orm");

  // Check if a Telegram bot key already exists
  const existing = await db
    .select()
    .from(apiKeys)
    .where(eqOp(apiKeys.name, "KodaPost Telegram Bot"))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create one (rawKey is returned once to the caller; we only store the hash)
  const { generateApiKey: genKey } = await import("@/lib/api/helpers");
  const { hashedKey, prefix } = genKey();
  const id = generateId("key");

  await db.insert(apiKeys).values({
    id,
    name: "KodaPost Telegram Bot",
    hashedKey,
    prefix,
    rateLimit: 120, // Higher rate limit for the bot
    enabled: true,
    createdAt: new Date().toISOString(),
  });

  console.log("[KodaPost Telegram] Created internal API key:", prefix);
  return id;
}
