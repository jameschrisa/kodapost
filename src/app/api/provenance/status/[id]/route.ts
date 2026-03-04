import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { getPolygonscanBaseUrl } from "@/lib/venly/client";
import { checkMintStatus } from "@/lib/venly/status";

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
 * Auth required (owner only). Self-heals by polling Venly for non-terminal statuses.
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

    // Self-healing: if status is non-terminal and we have a mintId, poll Venly
    if (record.mintId && record.status !== "succeeded" && record.status !== "failed") {
      try {
        const mintResult = await checkMintStatus(record.mintId);

        if (mintResult.status === "SUCCEEDED" && mintResult.transactionHash) {
          await db.update(provenanceRecords)
            .set({
              status: "succeeded",
              transactionHash: mintResult.transactionHash,
              tokenId: mintResult.tokenId ?? null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(provenanceRecords.id, id));

          record.status = "succeeded";
          record.transactionHash = mintResult.transactionHash;
          record.tokenId = mintResult.tokenId ?? null;
        } else if (mintResult.status === "FAILED") {
          await db.update(provenanceRecords)
            .set({
              status: "failed",
              error: "Mint transaction failed on-chain",
              updatedAt: new Date().toISOString(),
            })
            .where(eq(provenanceRecords.id, id));

          record.status = "failed";
          record.error = "Mint transaction failed on-chain";
        }
      } catch {
        // Don't fail the status check if Venly polling fails
      }
    }

    const polygonscanUrl = record.transactionHash
      ? `${getPolygonscanBaseUrl()}/tx/${record.transactionHash}`
      : null;

    return NextResponse.json({
      ...record,
      polygonscanUrl,
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
