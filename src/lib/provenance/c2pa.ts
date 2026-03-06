/**
 * C2PA (Content Provenance and Authenticity) manifest embedding.
 *
 * Embeds industry-standard C2PA manifests into exported images, making them
 * verifiable by any C2PA-compliant tool (Adobe, Google, Microsoft, etc.).
 *
 * Uses the test signer for development/MVP. For production, set
 * C2PA_CERTIFICATE and C2PA_PRIVATE_KEY environment variables with
 * PEM-encoded certificate chain and private key.
 */

// Dynamic import to avoid sharp version conflicts with c2pa-node's bundled sharp.
// Promise-based caching prevents race conditions on concurrent requests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let c2paModulePromise: Promise<any> | null = null;

function getC2paModule() {
  if (!c2paModulePromise) {
    c2paModulePromise = import("c2pa-node");
  }
  return c2paModulePromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let signerPromise: Promise<any> | null = null;

/**
 * Gets or creates the C2PA signer.
 * Uses env vars C2PA_CERTIFICATE and C2PA_PRIVATE_KEY if available,
 * falls back to the built-in test signer (with TSA disabled to avoid
 * outbound HTTP calls in serverless environments).
 */
function getSigner() {
  if (!signerPromise) {
    signerPromise = (async () => {
      const { createTestSigner, SigningAlgorithm } = await getC2paModule();

      const certBase64 = process.env.C2PA_CERTIFICATE;
      const keyBase64 = process.env.C2PA_PRIVATE_KEY;

      if (certBase64 && keyBase64) {
        return {
          type: "local" as const,
          certificate: Buffer.from(certBase64, "base64"),
          privateKey: Buffer.from(keyBase64, "base64"),
          algorithm: SigningAlgorithm.ES256,
        };
      }

      // Use test signer but override tsaUrl to avoid outbound HTTP calls
      const testSigner = await createTestSigner();
      testSigner.tsaUrl = undefined;
      return testSigner;
    })();
  }
  return signerPromise;
}

/**
 * Embeds a C2PA manifest into an image buffer.
 *
 * @param imageBuffer - The final composited image (JPEG or PNG)
 * @param mimeType - The image MIME type
 * @param metadata - Creator and provenance metadata
 * @returns The image buffer with embedded C2PA manifest
 */
export async function embedC2PAManifest(
  imageBuffer: Buffer,
  mimeType: "image/jpeg" | "image/png",
  metadata: {
    creatorName: string;
    imageHash: string;
    perceptualHash?: string;
    platform?: string;
  }
): Promise<Buffer> {
  const { createC2pa, ManifestBuilder } = await getC2paModule();

  const signer = await getSigner();
  const c2pa = createC2pa({ signer });

  const assertions: Array<{ label: string; data: Record<string, unknown> }> = [
    {
      label: "c2pa.actions",
      data: {
        actions: [
          {
            action: "c2pa.created",
            softwareAgent: "KodaPost/1.0",
          },
        ],
      },
    },
    {
      label: "stds.schema-org.CreativeWork",
      data: {
        "@type": "CreativeWork",
        author: [
          {
            "@type": "Person",
            name: metadata.creatorName,
          },
        ],
      },
    },
  ];

  // Add custom KodaPost assertion with hash data
  const kodapostData: Record<string, unknown> = {
    sha256: metadata.imageHash,
  };
  if (metadata.perceptualHash) {
    kodapostData.perceptualHash = metadata.perceptualHash;
  }
  if (metadata.platform) {
    kodapostData.platform = metadata.platform;
  }

  assertions.push({
    label: "com.kodapost.provenance",
    data: kodapostData,
  });

  const manifest = new ManifestBuilder({
    claim_generator: "KodaPost/1.0",
    format: mimeType,
    assertions,
  });

  const { signedAsset } = await c2pa.sign({
    asset: { buffer: imageBuffer, mimeType },
    manifest,
    thumbnail: false,
  });

  return signedAsset.buffer;
}

/**
 * Reads C2PA manifest data from an image buffer.
 * Returns null if no C2PA data is present.
 */
export async function readC2PAManifest(
  imageBuffer: Buffer,
  mimeType: "image/jpeg" | "image/png"
) {
  const { createC2pa } = await getC2paModule();
  const c2pa = createC2pa();
  return c2pa.read({ buffer: imageBuffer, mimeType });
}
