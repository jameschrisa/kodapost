import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function getUserId(): Promise<string | null> {
  if (!isClerkEnabled) return "dev";
  const user = await currentUser();
  return user?.id ?? null;
}

/**
 * PATCH /api/posts/[id]
 *
 * Update a post record (e.g., change status, set publishedAt).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Allow updating these fields
    const allowedFields = [
      "title",
      "status",
      "platform",
      "platformPostId",
      "postUrl",
      "publishedAt",
      "scheduledAt",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    const db = getDb();

    const result = await db
      .update(posts)
      .set(updates)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Posts API] Failed to update post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 *
 * Delete a post record. Only drafts can be deleted.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDb();

    // Only allow deleting drafts
    const result = await db
      .delete(posts)
      .where(
        and(
          eq(posts.id, id),
          eq(posts.userId, userId),
          eq(posts.status, "draft")
        )
      );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Post not found or not a draft" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Posts API] Failed to delete post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
