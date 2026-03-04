"use client";

import { Copy, ExternalLink, Shield } from "lucide-react";
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
    chain: string;
    transactionHash: string | null;
    tokenId: string | null;
    contractAddress: string | null;
    polygonscanUrl?: string | null;
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

function DetailRow({ label, value, copyable, href }: {
  label: string;
  value: string;
  copyable?: boolean;
  href?: string;
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
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProvenanceDialog({ open, onOpenChange, record }: ProvenanceDialogProps) {
  if (!record) return null;

  const hashes = record.imageHashes.split(",");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Creator Provenance
          </DialogTitle>
          <DialogDescription>
            On-chain proof of creation on {record.chain === "polygon" ? "Polygon" : record.chain}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <ProvenanceBadge status={record.status} />
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
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {record.transactionHash && (
            <DetailRow
              label="Transaction"
              value={record.transactionHash}
              copyable
              href={record.polygonscanUrl ?? undefined}
            />
          )}

          {record.tokenId && (
            <DetailRow label="Token ID" value={record.tokenId} copyable />
          )}

          {record.contractAddress && (
            <DetailRow label="Contract" value={record.contractAddress} copyable />
          )}

          <DetailRow
            label="Registered"
            value={new Date(record.createdAt).toLocaleString()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
