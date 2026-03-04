import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function getUserId(): Promise<string | null> {
  if (!isClerkEnabled) return "dev";
  const user = await currentUser();
  return user?.id ?? null;
}

/**
 * GET /api/provenance/status/[id]
 *
 * Check the status of a provenance registration.
 * Auth required (owner only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id || typeof id !== "string" || id.length > 100) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  }

  try {
    const db = getDb();
    const [record] = await db
      .select()
      .from(provenanceRecords)
      .where(eq(provenanceRecords.id, id))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (record.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return client-safe fields (exclude creatorEmail)
    return NextResponse.json({
      id: record.id,
      userId: record.userId,
      postId: record.postId,
      imageHashes: record.imageHashes,
      creatorName: record.creatorName,
      slideCount: record.slideCount,
      platform: record.platform,
      signature: record.signature,
      status: record.status,
      error: record.error,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error(
      "[Provenance] Failed to get status:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to get provenance status" },
      { status: 500 }
    );
  }
}
