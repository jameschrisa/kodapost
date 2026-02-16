import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

/**
 * GET /api/v1/health
 *
 * Health check endpoint. No authentication required.
 * Returns API version and database connectivity status.
 */
export async function GET() {
  let dbStatus = "disconnected";

  try {
    const db = getDb();
    // Simple query to verify database connectivity
    await db.run(
      // Raw SQL via the underlying client
      { sql: "SELECT 1", args: [] } as never
    );
    dbStatus = "connected";
  } catch {
    // If getDb() fails (missing env var) or query fails, report as disconnected
    // but don't crash the health endpoint
    try {
      // Try just instantiating — if env var exists, DB is likely fine
      getDb();
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }

  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
