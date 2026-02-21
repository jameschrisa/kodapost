"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Instagram,
  Linkedin,
  Youtube,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OAuthConnection } from "@/lib/types";

// ---------------------------------------------------------------------------
// Platform icons
// ---------------------------------------------------------------------------

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.2 8.2 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Platform definitions
// ---------------------------------------------------------------------------

interface WizardPlatform {
  id: string;
  label: string;
  icon: React.ReactNode;
  formatNote: string;
  description: string;
}

const WIZARD_PLATFORMS: WizardPlatform[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    formatNote: "4:5 · Up to 20 carousel slides",
    description: "Native swipe carousels on the leading visual platform.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: <TikTokIcon />,
    formatNote: "9:16 · Up to 35 carousel slides",
    description: "Photo mode carousels for TikTok's massive audience.",
  },
  {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    icon: <Youtube className="h-5 w-5" />,
    formatNote: "9:16 · Vertical single image",
    description: "Vertical Shorts content to engage YouTube viewers.",
  },
  {
    id: "youtube",
    label: "YouTube Community",
    icon: <Youtube className="h-5 w-5" />,
    formatNote: "1:1 · Single community post",
    description: "Engage your subscribers with community posts.",
  },
  {
    id: "x",
    label: "X/Twitter",
    icon: <XIcon />,
    formatNote: "4:5 · Up to 4 images",
    description: "Multi-image posts optimised for X/Twitter.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    formatNote: "4:5 · PDF document carousel",
    description: "Professional document carousels for LinkedIn.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = "welcome" | "select" | "connect" | "complete";

export interface SocialAccountsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const stepVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------

export function SocialAccountsWizard({ open, onOpenChange }: SocialAccountsWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("welcome");
      setSelected(new Set());
      setStatuses({});
    }
  }, [open]);

  const fetchStatuses = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      const map: Record<string, boolean> = {};
      (data.connections || []).forEach((c: OAuthConnection) => {
        map[c.platform] = c.connected;
      });
      setStatuses(map);
    } catch {
      toast.error("Could not check connection status");
    } finally {
      setChecking(false);
    }
  }, []);

  // Fetch statuses when entering the connect step
  useEffect(() => {
    if (step === "connect") {
      fetchStatuses();
    }
  }, [step, fetchStatuses]);

  // Auto-refresh when user returns to this tab after completing OAuth in another tab
  useEffect(() => {
    if (step !== "connect") return;
    function onVisible() {
      if (document.visibilityState === "visible") fetchStatuses();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [step, fetchStatuses]);

  function togglePlatform(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConnect(platformId: string) {
    window.open(`/api/auth/${platformId}/authorize`, "_blank");
  }

  const selectedPlatforms = WIZARD_PLATFORMS.filter((p) => selected.has(p.id));
  const connectedCount = selectedPlatforms.filter((p) => statuses[p.id]).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step === "welcome" && (
              <WelcomeStep onStart={() => setStep("select")} />
            )}
            {step === "select" && (
              <SelectStep
                selected={selected}
                onToggle={togglePlatform}
                onBack={() => setStep("welcome")}
                onContinue={() => setStep("connect")}
              />
            )}
            {step === "connect" && (
              <ConnectStep
                platforms={selectedPlatforms}
                statuses={statuses}
                checking={checking}
                connectedCount={connectedCount}
                onConnect={handleConnect}
                onRefresh={fetchStatuses}
                onBack={() => setStep("select")}
                onComplete={() => setStep("complete")}
              />
            )}
            {step === "complete" && (
              <CompleteStep
                platforms={selectedPlatforms}
                statuses={statuses}
                onClose={() => onOpenChange(false)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6 py-2">
      <DialogHeader>
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wand2 className="h-7 w-7 text-primary" />
          </div>
        </div>
        <DialogTitle className="text-center text-xl">Connect Your Social Accounts</DialogTitle>
        <DialogDescription className="text-center">
          Link KudoPost to your platforms and publish carousels directly — no manual
          downloads required.
        </DialogDescription>
      </DialogHeader>

      {/* Platform logo grid */}
      <div className="flex justify-center gap-2.5 flex-wrap">
        {WIZARD_PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          >
            {p.icon}
          </div>
        ))}
      </div>

      <div className="space-y-1 text-sm text-muted-foreground text-center">
        <p>Takes about 2 minutes. Connect as many platforms as you like.</p>
        <p>You can always add or remove accounts later in Settings.</p>
      </div>

      <div className="flex justify-center">
        <Button onClick={onStart} className="gap-2 px-8">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SelectStep({
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Choose Your Platforms</DialogTitle>
        <DialogDescription>
          Select the platforms you want to connect. You can always add more later.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2">
        {WIZARD_PLATFORMS.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              >
                {p.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-primary" : ""
                  )}
                >
                  {p.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{p.formatNote}</p>
              </div>
              {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
          )}
          <Button onClick={onContinue} disabled={selected.size === 0} className="gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectStep({
  platforms,
  statuses,
  checking,
  connectedCount,
  onConnect,
  onRefresh,
  onBack,
  onComplete,
}: {
  platforms: WizardPlatform[];
  statuses: Record<string, boolean>;
  checking: boolean;
  connectedCount: number;
  onConnect: (id: string) => void;
  onRefresh: () => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Connect Your Accounts</DialogTitle>
        <DialogDescription>
          Click <strong>Connect</strong> — a new tab opens for login. Return here when done,
          then hit <strong>Refresh</strong> to confirm the connection.
        </DialogDescription>
      </DialogHeader>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-muted-foreground">
          {connectedCount} of {platforms.length} connected
        </span>
        {checking && <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto text-muted-foreground" />}
      </div>

      {/* Platform list */}
      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
        {platforms.map((p) => {
          const connected = statuses[p.id] ?? false;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                connected ? "border-green-500/30 bg-green-500/5" : "border-border"
              )}
            >
              <span className="shrink-0 text-muted-foreground">{p.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.formatNote}</p>
              </div>
              {connected ? (
                <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs shrink-0"
                  onClick={() => onConnect(p.id)}
                >
                  <ExternalLink className="h-3 w-3" />
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={checking}
            className="gap-1.5"
          >
            {checking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
          <Button onClick={onComplete} className="gap-2">
            {connectedCount === platforms.length ? "Finish" : "Continue anyway"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({
  platforms,
  statuses,
  onClose,
}: {
  platforms: WizardPlatform[];
  statuses: Record<string, boolean>;
  onClose: () => void;
}) {
  const connected = platforms.filter((p) => statuses[p.id]);
  const skipped = platforms.filter((p) => !statuses[p.id]);

  return (
    <div className="space-y-6 py-2">
      <DialogHeader>
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
          </div>
        </div>
        <DialogTitle className="text-center text-xl">
          {connected.length > 0 ? "You're ready to post!" : "Setup complete"}
        </DialogTitle>
        <DialogDescription className="text-center">
          {connected.length > 0
            ? `${connected.length} platform${connected.length > 1 ? "s" : ""} connected. Head to the builder to create your first carousel.`
            : "No platforms were connected. You can connect them any time from Settings."}
        </DialogDescription>
      </DialogHeader>

      {platforms.length > 0 && (
        <div className="space-y-2">
          {connected.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="shrink-0 text-muted-foreground">{p.icon}</span>
              <span className="font-medium">{p.label}</span>
              <span className="ml-auto text-xs text-green-600 font-medium">Connected</span>
            </div>
          ))}
          {skipped.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Circle className="h-4 w-4 shrink-0" />
              <span className="shrink-0">{p.icon}</span>
              <span>{p.label}</span>
              <span className="ml-auto text-xs">Skipped</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button onClick={onClose} className="px-8">
          {connected.length > 0 ? "Start Creating" : "Close"}
        </Button>
      </div>
    </div>
  );
}
