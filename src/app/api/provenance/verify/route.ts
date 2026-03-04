import { NextRequest, NextResponse } from "next/server";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { getPolygonscanBaseUrl } from "@/lib/venly/client";
import type { ProvenanceVerification } from "@/lib/types";

/**
 * GET /api/provenance/verify?hash={sha256}
 *
 * Public endpoint (no auth) to verify if an image hash has been registered.
 * Returns creator info, chain data, and Polygonscan link if verified.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Missing hash query parameter" },
      { status: 400 }
    );
  }

  // Validate SHA-256 hex format
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json(
      { error: "Invalid SHA-256 hash format" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    // Find records where imageHashes contains this hash
    const records = await db
      .select()
      .from(provenanceRecords)
      .where(like(provenanceRecords.imageHashes, `%${hash}%`))
      .limit(1);

    if (records.length === 0) {
      const result: ProvenanceVerification = { verified: false };
      return NextResponse.json(result);
    }

    const record = records[0];

    // Only return verified if the mint succeeded
    if (record.status !== "succeeded") {
      const result: ProvenanceVerification = { verified: false };
      return NextResponse.json(result);
    }

    const polygonscanUrl = record.transactionHash
      ? `${getPolygonscanBaseUrl()}/tx/${record.transactionHash}`
      : undefined;

    const result: ProvenanceVerification = {
      verified: true,
      creatorName: record.creatorName,
      createdAt: record.createdAt,
      platform: record.platform ?? undefined,
      chain: record.chain,
      transactionHash: record.transactionHash ?? undefined,
      polygonscanUrl,
      tokenId: record.tokenId ?? undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[Provenance] Verification failed:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
