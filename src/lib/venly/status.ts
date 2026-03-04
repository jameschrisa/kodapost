/**
 * Venly Mint Status Checker
 *
 * Polls the mint operation endpoint and returns current status,
 * transaction hash, and token ID when available.
 */

import { venlyFetch } from "./client";

export interface MintStatusResult {
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  transactionHash?: string;
  tokenId?: string;
}

/**
 * Checks the current status of a mint operation.
 */
export async function checkMintStatus(mintId: string): Promise<MintStatusResult> {
  const res = await venlyFetch(`/api/v3/erc1155/tokens/mints/${mintId}`);

  if (!res.ok) {
    throw new Error(`Failed to check mint status (${res.status})`);
  }

  const data = await res.json();
  const result = data.result || data;

  return {
    status: result.status || "PENDING",
    transactionHash: result.transactionHash || result.txHash,
    tokenId: result.tokenId ? String(result.tokenId) : undefined,
  };
}
