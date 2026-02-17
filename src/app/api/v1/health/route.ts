import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// Force dynamic rendering — health checks must run at request time
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 *
 * Health check endpoint. No authentication required.
 * Returns API version and database connectivity status.
 */
export async function GET() {
  let dbStatus = "disconnected";

  try {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      const client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      await client.execute("SELECT 1");
      dbStatus = "connected";
    }
  } catch (e) {
    // If connection fails, report as disconnected but don't crash
    dbStatus = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }

  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
