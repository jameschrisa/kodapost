import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// =============================================================================
// Turso / libSQL Database Client
//
// Lazy-initialized singleton — matches the getAnthropicClient() pattern in
// actions.ts so the build doesn't crash when env vars are missing.
//
// For local dev: TURSO_DATABASE_URL=file:local.db (SQLite file, no auth needed)
// For production: TURSO_DATABASE_URL=libsql://your-db.turso.io + TURSO_AUTH_TOKEN
// =============================================================================

function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing TURSO_DATABASE_URL environment variable. " +
        "For local development, add TURSO_DATABASE_URL=file:local.db to .env.local"
    );
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

let _db: ReturnType<typeof createDbClient> | null = null;

/**
 * Returns the database client singleton.
 * Creates the client on first call (lazy initialization).
 */
export function getDb() {
  if (!_db) {
    _db = createDbClient();
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
