import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { canAccessFeature, type PlanTier } from "@/lib/plans";
import { signProvenance } from "@/lib/provenance/signer";

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const MAX_IMAGE_HASHES = 20;
const MAX_CREATOR_NAME_LENGTH = 200;
const MAX_PLATFORM_LENGTH = 50;

async function getAuthUser(): Promise<{
  id: string;
  email: string;
  plan: PlanTier;
} | null> {
  if (!isClerkEnabled) {
    return { id: "dev", email: "dev@localhost", plan: "pro" };
  }
  const user = await currentUser();
  if (!user) return null;

  const metadata = user.publicMetadata as { plan?: string };
  const plan = (metadata.plan === "standard" || metadata.plan === "pro")
    ? metadata.plan
    : (metadata.plan === "registered" ? "standard" : "trial");

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    plan: plan as PlanTier,
  };
}

/**
 * POST /api/provenance/register
 *
 * Register cryptographically signed provenance for a carousel's image hashes.
 * Requires auth + creator_provenance feature access (standard/pro plan).
 * Signing is instant (Ed25519), no async polling needed.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessFeature(user.plan, "creator_provenance")) {
    return NextResponse.json(
      { error: "Creator provenance requires a Creator or Monster plan" },
      { status: 403 }
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Email address required for provenance registration" },
      { status: 400 }
    );
  }

  let body: {
    postId?: string;
    imageHashes: string[];
    perceptualHashes?: string[];
    creatorName: string;
    slideCount: number;
    platform?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { postId, imageHashes, perceptualHashes, creatorName, slideCount, platform } = body;

  if (!Array.isArray(imageHashes) || imageHashes.length === 0) {
    return NextResponse.json(
      { error: "imageHashes must be a non-empty array" },
      { status: 400 }
    );
  }

  if (imageHashes.length > MAX_IMAGE_HASHES) {
    return NextResponse.json(
      { error: `Too many image hashes (max ${MAX_IMAGE_HASHES})` },
      { status: 400 }
    );
  }

  // Validate hash format (SHA-256 hex)
  const hashPattern = /^[a-f0-9]{64}$/;
  for (const hash of imageHashes) {
    if (!hashPattern.test(hash)) {
      return NextResponse.json(
        { error: `Invalid SHA-256 hash format: ${hash.slice(0, 16)}...` },
        { status: 400 }
      );
    }
  }

  if (!creatorName || typeof creatorName !== "string" || creatorName.length > MAX_CREATOR_NAME_LENGTH) {
    return NextResponse.json(
      { error: "creatorName is required (max 200 chars)" },
      { status: 400 }
    );
  }

  if (!slideCount || typeof slideCount !== "number" || slideCount < 1) {
    return NextResponse.json(
      { error: "slideCount must be a positive number" },
      { status: 400 }
    );
  }

  if (platform && (typeof platform !== "string" || platform.length > MAX_PLATFORM_LENGTH)) {
    return NextResponse.json(
      { error: `Invalid platform (max ${MAX_PLATFORM_LENGTH} chars)` },
      { status: 400 }
    );
  }

  // Validate perceptual hash format (16-char hex dHash)
  const phashPattern = /^[a-f0-9]{16}$/;
  if (perceptualHashes) {
    if (!Array.isArray(perceptualHashes)) {
      return NextResponse.json(
        { error: "perceptualHashes must be an array" },
        { status: 400 }
      );
    }
    for (const phash of perceptualHashes) {
      if (!phashPattern.test(phash)) {
        return NextResponse.json(
          { error: `Invalid perceptual hash format: ${phash}` },
          { status: 400 }
        );
      }
    }
  }

  const now = new Date().toISOString();
  const id = `prov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const hashString = imageHashes.join(",");
  const phashString = perceptualHashes?.length ? perceptualHashes.join(",") : null;

  try {
    const db = getDb();

    // Deduplication: check if provenance already exists for these exact hashes
    const [existing] = await db
      .select({ id: provenanceRecords.id, status: provenanceRecords.status })
      .from(provenanceRecords)
      .where(
        and(
          eq(provenanceRecords.userId, user.id),
          eq(provenanceRecords.imageHashes, hashString)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { id: existing.id, status: existing.status, deduplicated: true },
        { status: 200 }
      );
    }

    // Sign the provenance claim (Ed25519, instant)
    const signature = signProvenance({
      imageHashes: hashString,
      creatorName,
      createdAt: now,
    });

    await db.insert(provenanceRecords).values({
      id,
      userId: user.id,
      postId: postId ?? null,
      imageHashes: hashString,
      perceptualHashes: phashString,
      creatorName,
      creatorEmail: user.email,
      slideCount,
      platform: platform ?? null,
      signature,
      status: "signed",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, status: "signed" }, { status: 201 });
  } catch (error) {
    console.error(
      "[Provenance] Failed to register:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to register provenance" },
      { status: 500 }
    );
  }
}
