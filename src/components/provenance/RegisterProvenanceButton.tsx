"use client";

import { useState } from "react";
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
  signature: string | null;
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

      // Signing is instant, so fetch the full record
      const statusRes = await fetch(`/api/provenance/status/${data.id}`);
      if (statusRes.ok) {
        const fullRecord: ProvenanceRecordResponse = await statusRes.json();
        setRecord(fullRecord);
      } else {
        // Fallback: use the register response
        setRecord({
          id: data.id,
          status: data.status,
          creatorName,
          imageHashes: imageHashes.join(","),
          signature: null,
          createdAt: new Date().toISOString(),
          error: null,
        });
      }

      toast.success("Provenance registered", {
        description: "Your creator proof has been cryptographically signed.",
      });
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
      {isRegistering ? "Signing..." : "Register Provenance"}
    </Button>
  );
}
