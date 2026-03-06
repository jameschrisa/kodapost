import { NextRequest, NextResponse } from "next/server";
import { like, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { verifyProvenance, getPublicKeyPem } from "@/lib/provenance/signer";
import { hammingDistance } from "@/lib/provenance";
import type { ProvenanceVerification } from "@/lib/types";

/** Maximum Hamming distance to consider a perceptual hash match */
const PHASH_MAX_DISTANCE = 10;

/**
 * GET /api/provenance/verify?hash={sha256}&phash={dHash}
 *
 * Public endpoint (no auth) to verify if an image hash has been registered.
 * Returns creator info and cryptographic verification status.
 *
 * Supports two lookup modes:
 *   1. Exact match via SHA-256 hash (hash param, 64-char hex)
 *   2. Fuzzy match via perceptual dHash (phash param, 16-char hex)
 *      Falls back to phash when exact hash has no match.
 *
 * Optional: ?publickey=true to also return the app's public key for
 * independent verification.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const phash = searchParams.get("phash");
  const includePublicKey = searchParams.get("publickey") === "true";

  if (!hash && !phash) {
    return NextResponse.json(
      { error: "Missing hash or phash query parameter" },
      { status: 400 }
    );
  }

  // Validate formats
  if (hash && !/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json(
      { error: "Invalid SHA-256 hash format" },
      { status: 400 }
    );
  }

  if (phash && !/^[a-f0-9]{16}$/.test(phash)) {
    return NextResponse.json(
      { error: "Invalid perceptual hash format (expected 16-char hex)" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    type MatchConfidence = "exact" | "visual_match";
    let record: typeof provenanceRecords.$inferSelect | undefined;
    let confidence: MatchConfidence | undefined;
    let matchDistance: number | undefined;

    // 1. Try exact SHA-256 match first
    if (hash) {
      const records = await db
        .select()
        .from(provenanceRecords)
        .where(like(provenanceRecords.imageHashes, `%${hash}%`))
        .limit(1);

      if (records.length > 0) {
        record = records[0];
        confidence = "exact";
      }
    }

    // 2. Fall back to perceptual hash fuzzy match
    if (!record && phash) {
      const candidates = await db
        .select()
        .from(provenanceRecords)
        .where(isNotNull(provenanceRecords.perceptualHashes))
        .limit(100);

      let bestMatch: typeof provenanceRecords.$inferSelect | undefined;
      let bestDistance = Infinity;

      for (const candidate of candidates) {
        if (!candidate.perceptualHashes) continue;
        const storedHashes = candidate.perceptualHashes.split(",");
        for (const storedHash of storedHashes) {
          const distance = hammingDistance(phash, storedHash);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = candidate;
          }
        }
      }

      if (bestMatch && bestDistance <= PHASH_MAX_DISTANCE) {
        record = bestMatch;
        confidence = "visual_match";
        matchDistance = bestDistance;
      }
    }

    if (!record) {
      const result: ProvenanceVerification = { verified: false };
      return NextResponse.json(result);
    }

    // Only return verified if signed
    if (record.status !== "signed" || !record.signature) {
      const result: ProvenanceVerification = { verified: false };
      return NextResponse.json(result);
    }

    // Cryptographically verify the signature is valid
    const signatureValid = verifyProvenance({
      imageHashes: record.imageHashes,
      creatorName: record.creatorName,
      createdAt: record.createdAt,
      signature: record.signature,
    });

    if (!signatureValid) {
      const result: ProvenanceVerification = { verified: false };
      return NextResponse.json(result);
    }

    const result: ProvenanceVerification = {
      verified: true,
      creatorName: record.creatorName,
      createdAt: record.createdAt,
      platform: record.platform ?? undefined,
      signature: record.signature,
      confidence,
      matchDistance,
    };

    if (includePublicKey) {
      result.publicKey = getPublicKeyPem();
    }

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
