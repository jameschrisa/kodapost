import crypto from "crypto";
import { eq, and, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { apiKeys, jobs } from "@/lib/db/schema";

// =============================================================================
// API Key Authentication + Rate Limiting
//
// Called at the top of each /api/v1/ route handler. Not a Next.js middleware
// (Edge runtime can't use Node crypto or @libsql/client).
// =============================================================================

export interface AuthenticatedRequest {
  apiKeyId: string;
  apiKeyName: string;
}

export type AuthResult =
  | { success: true; data: AuthenticatedRequest }
  | { success: false; response: NextResponse };

/**
 * Validates a Bearer token from the Authorization header.
 * Returns authenticated key info or a pre-built error response (401/429).
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error:
            "Missing or invalid Authorization header. Use: Bearer <api-key>",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }

  const rawKey = authHeader.slice(7); // strip "Bearer "
  const hashedKey = crypto
    .createHash("sha256")
    .update(rawKey)
    .digest("hex");

  const db = getDb();
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.hashedKey, hashedKey), eq(apiKeys.enabled, true)))
    .limit(1);

  if (!key) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid API key", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  // Rate limiting: count jobs created by this key in the last minute
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const recentJobs = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.apiKeyId, key.id),
        gte(jobs.createdAt, oneMinuteAgo)
      )
    );

  if (recentJobs.length >= key.rateLimit) {
    const retryAfter = 60 - new Date().getSeconds();
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMITED",
          retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      ),
    };
  }

  // Update lastUsedAt (fire-and-forget — don't block the request)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, key.id))
    .run()
    .catch(() => {
      // Silently ignore — lastUsedAt is non-critical
    });

  return {
    success: true,
    data: { apiKeyId: key.id, apiKeyName: key.name },
  };
}
