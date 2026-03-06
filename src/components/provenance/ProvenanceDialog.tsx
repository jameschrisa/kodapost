"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProvenanceBadge from "./ProvenanceBadge";
import type { ProvenanceStatus } from "@/lib/types";

interface ProvenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: {
    id: string;
    status: ProvenanceStatus;
    creatorName: string;
    imageHashes: string;
    signature: string | null;
    createdAt: string;
    error: string | null;
  } | null;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Failed to copy")
  );
}

function DetailRow({ label, value, copyable }: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-muted px-2 py-1 rounded break-all flex-1">
          {value}
        </code>
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => copyToClipboard(value, label)}
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ProvenanceDialog({ open, onOpenChange, record }: ProvenanceDialogProps) {
  if (!record) return null;

  const hashes = record.imageHashes.split(",");
  const verifyCode = hashes[0]?.slice(0, 8) ?? "";
  const verifyUrl = `/v/${verifyCode}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg viewBox="0 0 10 10" className="h-4 w-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="5" cy="5" r="4" />
              <circle cx="5" cy="5" r="1.8" />
            </svg>
            Creator Provenance
          </DialogTitle>
          <DialogDescription>
            Cryptographically signed proof of creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <ProvenanceBadge
              status={record.status}
              code={verifyCode}
              variant="dark"
            />
          </div>

          {record.error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-400">{record.error}</p>
            </div>
          )}

          <DetailRow label="Creator" value={record.creatorName} />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Image Hashes ({hashes.length} slide{hashes.length !== 1 ? "s" : ""})
            </p>
            {hashes.map((hash, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded break-all flex-1">
                  {hash}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => copyToClipboard(hash, `Hash ${i + 1}`)}
                  aria-label={`Copy hash ${i + 1}`}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {record.signature && (
            <DetailRow label="Ed25519 Signature" value={record.signature} copyable />
          )}

          <DetailRow
            label="Registered"
            value={new Date(record.createdAt).toLocaleString()}
          />

          {record.status === "signed" && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
              >
                <ExternalLink className="h-3 w-3" />
                Public verification page
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 ml-auto"
                onClick={() => {
                  const fullUrl = `${window.location.origin}${verifyUrl}`;
                  copyToClipboard(fullUrl, "Verification URL");
                }}
                aria-label="Copy verification URL"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
