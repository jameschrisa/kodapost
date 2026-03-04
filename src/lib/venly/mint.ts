/**
 * Venly Minting Flow
 *
 * 1. Create a token type with provenance metadata
 * 2. Poll until token type creation succeeds
 * 3. Mint 1 token to user's email via NFT2Email
 *
 * Updates the provenance record in DB as the pipeline progresses.
 */

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { venlyFetch, getContractAddress } from "./client";
import { checkMintStatus } from "./status";

interface RegisterProvenanceParams {
  imageHashes: string[];
  creatorName: string;
  creatorEmail: string;
  slideCount: number;
  platform?: string;
  postId?: string;
}

/**
 * Creates a Venly token type with provenance metadata.
 * Returns the creation ID for polling.
 */
async function createTokenType(params: {
  imageHashes: string[];
  creatorName: string;
  createdAt: string;
  slideCount: number;
  platform?: string;
}): Promise<{ creationId: string }> {
  const contractAddress = getContractAddress();

  const res = await venlyFetch("/api/v3/erc1155/token-types/creations", {
    method: "POST",
    body: JSON.stringify({
      contractAddress,
      name: `KodaPost Provenance - ${params.creatorName}`,
      description: `Creator provenance certificate for ${params.slideCount}-slide carousel by ${params.creatorName}`,
      transferable: false,
      burnable: false,
      maxSupply: 1,
      attributes: [
        { name: "imageHash", value: params.imageHashes.join(",") },
        { name: "creatorName", value: params.creatorName },
        { name: "createdAt", value: params.createdAt },
        { name: "slideCount", value: String(params.slideCount) },
        { name: "platform", value: params.platform || "export" },
        { name: "app", value: "KodaPost" },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create token type (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { creationId: data.result?.id || data.id };
}

/**
 * Polls token type creation until SUCCEEDED or FAILED.
 * Returns the token type ID on success.
 */
async function pollTokenTypeCreation(creationId: string): Promise<string> {
  const maxAttempts = 30;
  const pollInterval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await venlyFetch(`/api/v3/erc1155/token-types/creations/${creationId}`);

    if (!res.ok) {
      throw new Error(`Failed to poll token type creation (${res.status})`);
    }

    const data = await res.json();
    const status = data.result?.status || data.status;

    if (status === "SUCCEEDED") {
      return data.result?.tokenTypeId || data.tokenTypeId;
    }
    if (status === "FAILED") {
      throw new Error(`Token type creation failed: ${data.result?.error || "unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Token type creation timed out after 60 seconds");
}

/**
 * Mints 1 token to user email via NFT2Email.
 * Returns the mint operation ID.
 */
async function mintToEmail(params: {
  tokenTypeId: string;
  email: string;
}): Promise<{ mintId: string }> {
  const contractAddress = getContractAddress();

  const res = await venlyFetch("/api/v3/erc1155/tokens/mints", {
    method: "POST",
    body: JSON.stringify({
      contractAddress,
      tokenTypeId: params.tokenTypeId,
      destinations: [
        {
          address: params.email,
          amount: 1,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to mint token (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { mintId: data.result?.id || data.id };
}

/**
 * Runs the full provenance registration pipeline asynchronously.
 * Updates the DB record at each stage. Designed to be fire-and-forget.
 */
export async function registerProvenanceAsync(
  recordId: string,
  params: RegisterProvenanceParams
): Promise<void> {
  const db = getDb();
  const now = () => new Date().toISOString();

  try {
    // Stage 1: Create token type
    await db.update(provenanceRecords)
      .set({ status: "creating_token_type", updatedAt: now() })
      .where(eq(provenanceRecords.id, recordId));

    const { creationId } = await createTokenType({
      imageHashes: params.imageHashes,
      creatorName: params.creatorName,
      createdAt: now(),
      slideCount: params.slideCount,
      platform: params.platform,
    });

    const tokenTypeId = await pollTokenTypeCreation(creationId);

    await db.update(provenanceRecords)
      .set({
        tokenTypeId,
        contractAddress: getContractAddress(),
        status: "minting",
        updatedAt: now(),
      })
      .where(eq(provenanceRecords.id, recordId));

    // Stage 2: Mint to email
    const { mintId } = await mintToEmail({
      tokenTypeId,
      email: params.creatorEmail,
    });

    await db.update(provenanceRecords)
      .set({ mintId, updatedAt: now() })
      .where(eq(provenanceRecords.id, recordId));

    // Stage 3: Poll mint status
    const mintResult = await pollMintCompletion(mintId);

    await db.update(provenanceRecords)
      .set({
        tokenId: mintResult.tokenId ?? null,
        transactionHash: mintResult.transactionHash ?? null,
        status: "succeeded",
        updatedAt: now(),
      })
      .where(eq(provenanceRecords.id, recordId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Provenance] Registration failed for ${recordId}:`, message);

    await db.update(provenanceRecords)
      .set({ status: "failed", error: message, updatedAt: now() })
      .where(eq(provenanceRecords.id, recordId));
  }
}

/**
 * Polls mint completion until SUCCEEDED or FAILED.
 */
async function pollMintCompletion(mintId: string): Promise<{
  transactionHash?: string;
  tokenId?: string;
}> {
  const maxAttempts = 60;
  const pollInterval = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkMintStatus(mintId);

    if (result.status === "SUCCEEDED") {
      return {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
      };
    }
    if (result.status === "FAILED") {
      throw new Error("Mint transaction failed on-chain");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Mint polling timed out after 3 minutes");
}
