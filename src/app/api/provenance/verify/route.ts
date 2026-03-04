import { NextRequest, NextResponse } from "next/server";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { verifyProvenance, getPublicKeyPem } from "@/lib/provenance/signer";
import type { ProvenanceVerification } from "@/lib/types";

/**
 * GET /api/provenance/verify?hash={sha256}
 *
 * Public endpoint (no auth) to verify if an image hash has been registered.
 * Returns creator info and cryptographic verification status.
 *
 * Optional: ?publickey=true to also return the app's public key for
 * independent verification.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const includePublicKey = searchParams.get("publickey") === "true";

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

    const result: ProvenanceVerification & { publicKey?: string } = {
      verified: true,
      creatorName: record.creatorName,
      createdAt: record.createdAt,
      platform: record.platform ?? undefined,
      signature: record.signature,
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
