import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

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
    const db = getDb();
    // Simple query to verify database connectivity
    await db.get(sql`SELECT 1 as ok`);
    dbStatus = "connected";
  } catch {
    // If getDb() fails (missing env var) or query fails, report as disconnected
    // but don't crash the health endpoint
    dbStatus = "disconnected";
  }

  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
