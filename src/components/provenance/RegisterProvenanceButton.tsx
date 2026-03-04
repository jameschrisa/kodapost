"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ProvenanceBadge from "./ProvenanceBadge";
import ProvenanceDialog from "./ProvenanceDialog";
import type { ProvenanceStatus } from "@/lib/types";

interface ProvenanceRecordResponse {
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
}

interface RegisterProvenanceButtonProps {
  imageHashes: string[];
  creatorName: string;
  slideCount: number;
  postId?: string;
  platform?: string;
}

const POLL_INTERVAL = 5000;
const TERMINAL_STATUSES: ProvenanceStatus[] = ["succeeded", "failed"];

export default function RegisterProvenanceButton({
  imageHashes,
  creatorName,
  slideCount,
  postId,
  platform,
}: RegisterProvenanceButtonProps) {
  const [record, setRecord] = useState<ProvenanceRecordResponse | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<ProvenanceStatus | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Clean up polling on unmount
  useEffect(() => stopPolling, [stopPolling]);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/provenance/status/${id}`);
      if (!res.ok) return;

      const data: ProvenanceRecordResponse = await res.json();
      setRecord(data);

      // Show toast on status transitions
      if (prevStatusRef.current !== data.status) {
        prevStatusRef.current = data.status;

        if (data.status === "succeeded") {
          toast.success("Provenance registered on-chain", {
            description: "Your creator proof is now on Polygon.",
          });
        } else if (data.status === "failed") {
          toast.error("Provenance registration failed", {
            description: data.error || "Please try again.",
          });
        }
      }

      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling();
      }
    } catch {
      // Silent failure for polling
    }
  }, [stopPolling]);

  async function handleRegister() {
    if (isRegistering || record) return;
    setIsRegistering(true);

    try {
      const res = await fetch("/api/provenance/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageHashes,
          creatorName,
          slideCount,
          postId,
          platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to register provenance", {
          description: data.error || "Please try again.",
        });
        return;
      }

      setRecord({
        id: data.id,
        status: data.status,
        creatorName,
        imageHashes: imageHashes.join(","),
        chain: "polygon",
        transactionHash: null,
        tokenId: null,
        contractAddress: null,
        createdAt: new Date().toISOString(),
        error: null,
      });
      prevStatusRef.current = data.status;

      toast.success("Provenance registration started", {
        description: "Minting your creator proof on Polygon...",
      });

      // Start polling
      pollRef.current = setInterval(() => pollStatus(data.id), POLL_INTERVAL);
    } catch {
      toast.error("Failed to register provenance");
    } finally {
      setIsRegistering(false);
    }
  }

  // If already registered, show badge
  if (record) {
    return (
      <>
        <ProvenanceBadge
          status={record.status}
          onClick={() => setDialogOpen(true)}
        />
        <ProvenanceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          record={record}
        />
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegister}
      disabled={isRegistering || imageHashes.length === 0}
      className="gap-2"
    >
      <Shield className="h-3.5 w-3.5" />
      {isRegistering ? "Registering..." : "Register Provenance"}
    </Button>
  );
}
