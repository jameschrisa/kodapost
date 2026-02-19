import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Resolves the current user ID from Clerk auth or falls back to "dev" in dev mode.
 */
async function getUserId(): Promise<string | null> {
  if (!isClerkEnabled) return "dev";
  const user = await currentUser();
  return user?.id ?? null;
}

/**
 * GET /api/posts
 *
 * List posts for the current user.
 * Optional query params:
 *   - status: filter by status (draft, scheduled, published, failed)
 *   - from: ISO date string for range start
 *   - to: ISO date string for range end
 */
export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const db = getDb();

    // Build conditions
    const conditions = [eq(posts.userId, userId)];

    if (status) {
      conditions.push(eq(posts.status, status as "draft" | "scheduled" | "published" | "failed"));
    }

    if (from) {
      conditions.push(gte(posts.createdAt, from));
    }

    if (to) {
      conditions.push(lte(posts.createdAt, to));
    }

    const results = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(200);

    return NextResponse.json({ posts: results });
  } catch (error) {
    console.error("[Posts API] Failed to list posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 *
 * Create a new post record.
 * Body: { title, postType, status, platform?, slideCount, scheduledAt? }
 */
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      postType,
      status,
      platform,
      platformPostId,
      postUrl,
      slideCount = 1,
      scheduledAt,
      publishedAt,
    } = body;

    if (!title || !postType || !status) {
      return NextResponse.json(
        { error: "Missing required fields: title, postType, status" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const db = getDb();

    await db.insert(posts).values({
      id,
      userId,
      title,
      postType,
      status,
      platform: platform ?? null,
      platformPostId: platformPostId ?? null,
      postUrl: postUrl ?? null,
      slideCount,
      publishedAt: publishedAt ?? null,
      scheduledAt: scheduledAt ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (error) {
    console.error("[Posts API] Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
