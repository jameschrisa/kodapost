/**
 * Ed25519 Cryptographic Signing for Creator Provenance
 *
 * Signs provenance claims (imageHash + creator + timestamp) with the app's
 * Ed25519 private key. Anyone can verify signatures using the public key.
 *
 * No external services, no monthly cost, cryptographically tamper-proof.
 *
 * Setup:
 *   Generate keypair: node -e "const c=require('crypto');const k=c.generateKeyPairSync('ed25519');console.log(k.privateKey.export({type:'pkcs8',format:'pem'}).toString('base64'));console.log('---');console.log(k.publicKey.export({type:'spki',format:'pem'}).toString('base64'))"
 *   Set PROVENANCE_SIGNING_KEY to the base64-encoded private key PEM
 */

import { createPrivateKey, createPublicKey, sign, verify } from "crypto";

function getSigningKey() {
  const keyBase64 = process.env.PROVENANCE_SIGNING_KEY;
  if (!keyBase64) {
    throw new Error(
      "Missing PROVENANCE_SIGNING_KEY environment variable. " +
      "Generate with: node -e \"const c=require('crypto');const k=c.generateKeyPairSync('ed25519');console.log(k.privateKey.export({type:'pkcs8',format:'pem'}).toString('base64'))\""
    );
  }

  const pem = Buffer.from(keyBase64, "base64").toString("utf-8");
  return createPrivateKey(pem);
}

function getPublicKeyFromPrivate() {
  const privateKey = getSigningKey();
  return createPublicKey(privateKey);
}

/** The canonical message that gets signed */
export function buildSignaturePayload(params: {
  imageHashes: string;
  creatorName: string;
  createdAt: string;
}): string {
  return [
    "kodapost-provenance-v1",
    params.imageHashes,
    params.creatorName,
    params.createdAt,
  ].join("\n");
}

/** Sign a provenance claim. Returns hex-encoded Ed25519 signature. */
export function signProvenance(params: {
  imageHashes: string;
  creatorName: string;
  createdAt: string;
}): string {
  const payload = buildSignaturePayload(params);
  const privateKey = getSigningKey();
  const signature = sign(null, Buffer.from(payload), privateKey);
  return signature.toString("hex");
}

/** Verify a provenance signature. Returns true if valid. */
export function verifyProvenance(params: {
  imageHashes: string;
  creatorName: string;
  createdAt: string;
  signature: string;
}): boolean {
  try {
    const payload = buildSignaturePayload(params);
    const publicKey = getPublicKeyFromPrivate();
    const sigBuffer = Buffer.from(params.signature, "hex");
    return verify(null, Buffer.from(payload), publicKey, sigBuffer);
  } catch {
    return false;
  }
}

/** Returns the public key in PEM format (for external verifiers). */
export function getPublicKeyPem(): string {
  const publicKey = getPublicKeyFromPrivate();
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}
