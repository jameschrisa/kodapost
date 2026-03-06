import { Metadata } from "next";
import { like, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { provenanceRecords } from "@/lib/db/schema";
import { verifyProvenance } from "@/lib/provenance/signer";

interface PageProps {
  params: { code: string };
}

async function findRecord(code: string) {
  const db = getDb();

  // Try exact prefix match on SHA-256 hashes first
  const records = await db
    .select()
    .from(provenanceRecords)
    .where(like(provenanceRecords.imageHashes, `${code}%`))
    .limit(1);

  if (records.length > 0) return records[0];

  // Try perceptual hash prefix match
  if (/^[a-f0-9]{8,16}$/.test(code)) {
    const candidates = await db
      .select()
      .from(provenanceRecords)
      .where(isNotNull(provenanceRecords.perceptualHashes))
      .limit(100);

    for (const candidate of candidates) {
      if (!candidate.perceptualHashes) continue;
      const hashes = candidate.perceptualHashes.split(",");
      for (const hash of hashes) {
        if (hash.startsWith(code)) return candidate;
      }
    }
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const record = await findRecord(params.code);

  if (!record) {
    return {
      title: "Not Found - KodaPost",
      description: "This verification code was not found.",
    };
  }

  return {
    title: `${record.creatorName}'s photo, verified real - KodaPost`,
    description: `This photo was created on ${new Date(record.createdAt).toLocaleDateString()} and cryptographically signed as authentic.`,
    openGraph: {
      title: `Verified Real - ${record.creatorName}`,
      description: `Authentic content by ${record.creatorName}, cryptographically signed via KodaPost.`,
      type: "website",
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export default async function VerifyPage({ params }: PageProps) {
  const record = await findRecord(params.code);

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)",
      }}
    >
      {/* Film sprocket holes - left */}
      <div className="hidden sm:flex fixed left-4 top-0 bottom-0 flex-col justify-center gap-3 opacity-10">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-1 h-2 rounded-sm bg-white" />
        ))}
      </div>
      {/* Film sprocket holes - right */}
      <div className="hidden sm:flex fixed right-4 top-0 bottom-0 flex-col justify-center gap-3 opacity-10">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-1 h-2 rounded-sm bg-white" />
        ))}
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5">
        {/* Logo */}
        <div className="flex justify-center opacity-40">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </div>

        {record ? (
          <VerifiedContent record={record} />
        ) : (
          <NotFoundContent code={params.code} />
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-white/20 font-mono tracking-wider pt-2 border-t border-white/5">
          Every pixel, proven real.{" "}
          <a href="/" className="underline hover:text-white/40 transition-colors">
            kodapost.com
          </a>
        </p>
      </div>
    </div>
  );
}

function VerifiedContent({
  record,
}: {
  record: NonNullable<Awaited<ReturnType<typeof findRecord>>>;
}) {
  const isSignatureValid =
    record.status === "signed" &&
    record.signature &&
    verifyProvenance({
      imageHashes: record.imageHashes,
      creatorName: record.creatorName,
      createdAt: record.createdAt,
      signature: record.signature,
    });

  const hashes = record.imageHashes.split(",");

  return (
    <>
      {/* Status heading */}
      <div className="text-center">
        <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-white/80">
          {isSignatureValid ? "Verified Real" : "Signature Invalid"}
        </h1>
        {isSignatureValid && (
          <div className="mt-1 mx-auto h-px w-12 bg-green-400/40" />
        )}
      </div>

      {/* Creator */}
      <div className="space-y-3">
        <DetailRow label="Creator">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 10 10" className="h-3 w-3 text-white/40 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="5" cy="5" r="4" />
              <circle cx="5" cy="5" r="1.8" />
            </svg>
            <span className="text-sm text-white/90 font-medium">{record.creatorName}</span>
          </div>
        </DetailRow>

        <DetailRow label="Created">
          <span className="font-mono text-xs text-white/60">{formatDate(record.createdAt)}</span>
        </DetailRow>

        {record.platform && (
          <DetailRow label="Published to">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/60 capitalize">
              {record.platform}
            </span>
          </DetailRow>
        )}

        <DetailRow label={`Image ${hashes.length === 1 ? "Hash" : "Hashes"} (${hashes.length} slide${hashes.length !== 1 ? "s" : ""})`}>
          <div className="space-y-1">
            {hashes.map((hash, i) => (
              <code key={i} className="block text-[10px] text-white/40 font-mono break-all">
                {hash}
              </code>
            ))}
          </div>
        </DetailRow>

        {record.signature && (
          <DetailRow label="Ed25519 Signature">
            <code className="block text-[10px] text-white/30 font-mono break-all">
              {record.signature.slice(0, 64)}...
            </code>
          </DetailRow>
        )}
      </div>
    </>
  );
}

function NotFoundContent({ code }: { code: string }) {
  return (
    <div className="text-center space-y-3">
      <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-white/60">
        Not Found
      </h1>
      <p className="text-xs text-white/30 leading-relaxed font-mono">
        This verification code was not found. The content may not have been
        created with KodaPost, or the code may be incorrect.
      </p>
      <p className="text-xs text-white/20 font-mono">
        Code: {code}
      </p>
      <a
        href="/"
        className="inline-block text-xs text-white/40 underline hover:text-white/60 transition-colors"
      >
        Learn about Proof of Real
      </a>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">{label}</p>
      {children}
    </div>
  );
}
