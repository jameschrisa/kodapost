import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// =============================================================================
// KodaPost API Database Schema (Turso / libSQL)
// =============================================================================

/**
 * API keys for authenticating external consumers (bots, chat agents, CLI tools).
 * Raw keys are never stored — only SHA-256 hashes.
 */
export const apiKeys = sqliteTable("api_keys", {
  /** Unique identifier (e.g., "key_abc123") */
  id: text("id").primaryKey(),
  /** Human-friendly label (e.g., "My Telegram Bot") */
  name: text("name").notNull(),
  /** SHA-256 hash of the raw API key */
  hashedKey: text("hashed_key").notNull().unique(),
  /** First 12 chars of the raw key for identification (e.g., "kp_live_xxxx") */
  prefix: text("prefix").notNull(),
  /** Max requests per minute (default: 60) */
  rateLimit: integer("rate_limit").notNull().default(60),
  /** Whether this key is active */
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  /** ISO timestamp of when the key was created */
  createdAt: text("created_at").notNull(),
  /** ISO timestamp of last API request using this key */
  lastUsedAt: text("last_used_at"),
});

/**
 * Generation jobs tracking. Each API call to /generate creates a job record
 * that tracks the pipeline progress and stores the final result.
 * Results expire after 1 hour (expiresAt).
 */
export const jobs = sqliteTable("jobs", {
  /** Unique identifier (e.g., "job_abc123") */
  id: text("id").primaryKey(),
  /** Foreign key to the API key that created this job */
  apiKeyId: text("api_key_id")
    .notNull()
    .references(() => apiKeys.id),
  /** Pipeline status */
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  /** The original API request config (JSON blob) */
  inputConfig: text("input_config", { mode: "json" }),
  /** The generation result: composited images + caption (JSON blob) */
  result: text("result", { mode: "json" }),
  /** Error message if status === "failed" */
  error: text("error"),
  /** Current pipeline step for progress reporting */
  currentStep: text("current_step"),
  /** Progress percentage (0-100) */
  progress: integer("progress").default(0),
  /** ISO timestamp: when the job was created */
  createdAt: text("created_at").notNull(),
  /** ISO timestamp: when processing started */
  startedAt: text("started_at"),
  /** ISO timestamp: when processing completed (success or failure) */
  completedAt: text("completed_at"),
  /** ISO timestamp: when the result can be cleaned up (default: 1 hour after creation) */
  expiresAt: text("expires_at").notNull(),
});

/**
 * Telegram bot conversation sessions.
 * Tracks each user's progress through the guided carousel creation flow.
 * Sessions are stored per Telegram chat ID and expire after 24 hours of inactivity.
 */
export const telegramSessions = sqliteTable("telegram_sessions", {
  /** Telegram chat ID (unique per user conversation) */
  chatId: text("chat_id").primaryKey(),
  /** Current flow stage */
  stage: text("stage", {
    enum: [
      "waiting_photos",
      "waiting_story",
      "waiting_vibes",
      "waiting_caption",
      "generating",
      "ready",
      "published",
    ],
  })
    .notNull()
    .default("waiting_photos"),
  /** User's story / theme text */
  story: text("story"),
  /** Comma-separated vibes (e.g., "relatable,inspirational") */
  vibes: text("vibes"),
  /** Generated or user-provided caption */
  caption: text("caption"),
  /** Number of slides requested (default: auto from image count) */
  slideCount: integer("slide_count"),
  /** JSON array of Telegram file_id strings for uploaded photos */
  photoFileIds: text("photo_file_ids", { mode: "json" }),
  /** The job ID from the generation pipeline (once triggered) */
  jobId: text("job_id"),
  /** ISO timestamp of last activity (for session expiry) */
  lastActivityAt: text("last_activity_at").notNull(),
  /** ISO timestamp when session was created */
  createdAt: text("created_at").notNull(),
});
