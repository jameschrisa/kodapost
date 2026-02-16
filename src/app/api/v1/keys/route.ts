import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { generateId, generateApiKey } from "@/lib/api/helpers";

/**
 * POST /api/v1/keys
 *
 * Creates a new API key. Protected by API_ADMIN_SECRET (not API key auth).
 * This is a bootstrapping endpoint — you need the admin secret to create
 * the first API key, then use API keys for all other endpoints.
 *
 * Request:
 *   Authorization: Bearer <API_ADMIN_SECRET>
 *   Body: { "name": "My Telegram Bot" }
 *
 * Response (201):
 *   { id, name, key, prefix, createdAt, note }
 *
 * The raw key is returned exactly once. Store it securely.
 */
export async function POST(request: NextRequest) {
  // Verify admin secret
  const adminSecret = process.env.API_ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      {
        error: "API key management is not configured. Set API_ADMIN_SECRET in .env.local",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { error: "Invalid admin secret", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Parse request body
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json(
      {
        error: 'A "name" field is required (e.g., "My Telegram Bot")',
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Generate the key
  const { rawKey, hashedKey, prefix } = generateApiKey();
  const id = generateId("key");
  const createdAt = new Date().toISOString();

  // Store in database
  const db = getDb();
  await db.insert(apiKeys).values({
    id,
    name: body.name.trim(),
    hashedKey,
    prefix,
    createdAt,
  });

  return NextResponse.json(
    {
      id,
      name: body.name.trim(),
      key: rawKey,
      prefix,
      createdAt,
      note: "Store this key securely. It will not be shown again.",
    },
    { status: 201 }
  );
}
