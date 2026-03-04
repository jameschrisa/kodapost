import { describe, it, expect, beforeAll } from "vitest";
import { generateKeyPairSync } from "crypto";
import { buildSignaturePayload, signProvenance, verifyProvenance, getPublicKeyPem } from "@/lib/provenance/signer";

// Generate a test keypair and set the env var before tests run
beforeAll(() => {
  const { privateKey } = generateKeyPairSync("ed25519");
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.PROVENANCE_SIGNING_KEY = Buffer.from(pem).toString("base64");
});

describe("buildSignaturePayload", () => {
  it("creates a deterministic newline-separated payload", () => {
    const payload = buildSignaturePayload({
      imageHashes: "abc123",
      creatorName: "TestCreator",
      createdAt: "2024-06-15T10:30:00Z",
    });
    expect(payload).toBe(
      "kodapost-provenance-v1\nabc123\nTestCreator\n2024-06-15T10:30:00Z"
    );
  });

  it("starts with version prefix", () => {
    const payload = buildSignaturePayload({
      imageHashes: "x",
      creatorName: "y",
      createdAt: "z",
    });
    expect(payload.startsWith("kodapost-provenance-v1")).toBe(true);
  });
});

describe("signProvenance", () => {
  it("returns a hex-encoded signature", () => {
    const sig = signProvenance({
      imageHashes: "hash1,hash2",
      creatorName: "Creator",
      createdAt: "2024-01-01",
    });
    expect(sig).toMatch(/^[a-f0-9]+$/);
    // Ed25519 signatures are 64 bytes = 128 hex chars
    expect(sig).toHaveLength(128);
  });

  it("is deterministic for same inputs", () => {
    const params = {
      imageHashes: "hash123",
      creatorName: "TestUser",
      createdAt: "2024-06-15",
    };
    expect(signProvenance(params)).toBe(signProvenance(params));
  });

  it("produces different signatures for different inputs", () => {
    const sig1 = signProvenance({
      imageHashes: "hash1",
      creatorName: "A",
      createdAt: "2024-01-01",
    });
    const sig2 = signProvenance({
      imageHashes: "hash2",
      creatorName: "A",
      createdAt: "2024-01-01",
    });
    expect(sig1).not.toBe(sig2);
  });
});

describe("verifyProvenance", () => {
  it("verifies a valid signature", () => {
    const params = {
      imageHashes: "hash123",
      creatorName: "TestCreator",
      createdAt: "2024-06-15T10:30:00Z",
    };
    const signature = signProvenance(params);
    expect(verifyProvenance({ ...params, signature })).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const params = {
      imageHashes: "hash123",
      creatorName: "TestCreator",
      createdAt: "2024-06-15T10:30:00Z",
    };
    const signature = signProvenance(params);
    // Tamper with the signature
    const tampered = signature.replace(/^.{4}/, "0000");
    expect(verifyProvenance({ ...params, signature: tampered })).toBe(false);
  });

  it("rejects when payload is modified", () => {
    const params = {
      imageHashes: "hash123",
      creatorName: "TestCreator",
      createdAt: "2024-06-15T10:30:00Z",
    };
    const signature = signProvenance(params);
    expect(
      verifyProvenance({
        ...params,
        creatorName: "TamperedCreator",
        signature,
      })
    ).toBe(false);
  });

  it("returns false for invalid hex signature", () => {
    expect(
      verifyProvenance({
        imageHashes: "x",
        creatorName: "y",
        createdAt: "z",
        signature: "not-valid-hex",
      })
    ).toBe(false);
  });
});

describe("getPublicKeyPem", () => {
  it("returns a PEM-formatted public key", () => {
    const pem = getPublicKeyPem();
    expect(pem).toContain("-----BEGIN PUBLIC KEY-----");
    expect(pem).toContain("-----END PUBLIC KEY-----");
  });
});
