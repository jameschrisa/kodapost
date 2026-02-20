"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Instagram,
  Linkedin,
  Save,
  Link as LinkIcon,
  Unlink,
  Loader2,
  CheckCircle2,
  Youtube,
  Zap,
  X as XClose,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { loadSettings, saveSettings } from "@/lib/storage";
import {
  staggerContainerVariants,
  staggerItemVariants,
  buttonTapScale,
  iconSwapVariants,
} from "@/lib/motion";
import {
  isAssistantEnabled,
  setAssistantPreference,
} from "@/components/shared/AssistantBanner";
import type {
  SocialMediaAccount,
  OAuthConnection,
  Platform,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Platform groups
// ---------------------------------------------------------------------------

const PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube", "x", "linkedin"];

// ---------------------------------------------------------------------------
// Platform metadata
// ---------------------------------------------------------------------------

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_META: Record<
  SocialMediaAccount["platform"],
  { label: string; icon: React.ReactNode; placeholder: string }
> = {
  instagram: {
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    placeholder: "@yourhandle",
  },
  tiktok: {
    label: "TikTok",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.2 8.2 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z" />
      </svg>
    ),
    placeholder: "@yourhandle",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    placeholder: "your-profile-name",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="h-4 w-4" />,
    placeholder: "channel name",
  },
  reddit: {
    label: "Reddit",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    placeholder: "u/username",
  },
  lemon8: {
    label: "Lemon8",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
    placeholder: "@yourhandle",
  },
  x: {
    label: "X",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
    placeholder: "@yourhandle",
  },
};

// ---------------------------------------------------------------------------
// Test Connection types
// ---------------------------------------------------------------------------

type TestState = "idle" | "testing" | "success" | "error";

// ---------------------------------------------------------------------------
// PlatformCard sub-component
// ---------------------------------------------------------------------------

interface PlatformCardProps {
  account: SocialMediaAccount;
  connection: OAuthConnection | undefined;
  loadingConnections: boolean;
  disconnecting: string | null;
  testState: TestState;
  onToggle: (active: boolean) => void;
  onUsernameChange: (username: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
}

function PlatformCard({
  account,
  connection,
  loadingConnections,
  disconnecting,
  testState,
  onToggle,
  onUsernameChange,
  onConnect,
  onDisconnect,
  onTest,
}: PlatformCardProps) {
  const meta = PLATFORM_META[account.platform];
  const isConnected = connection?.connected ?? false;

  return (
    <motion.div variants={staggerItemVariants}>
      <div className="rounded-lg border p-3 space-y-3">
        {/* Header row: icon, label, active toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{meta.icon}</span>
            <span className="text-sm font-medium">{meta.label}</span>
            {isConnected && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>
          <Switch
            checked={account.active}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${meta.label}`}
          />
        </div>

        {/* Username input */}
        <div className="space-y-1.5">
          <Label
            htmlFor={`settings-${account.platform}`}
            className="text-xs text-muted-foreground"
          >
            Username / Handle
          </Label>
          <Input
            id={`settings-${account.platform}`}
            value={account.username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder={meta.placeholder}
            className="h-8 text-sm"
            readOnly={isConnected}
          />
        </div>

        {/* OAuth connection section */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-muted-foreground">
            {loadingConnections ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking...
              </span>
            ) : isConnected ? (
              <span className="text-green-600">
                Connected
                {connection?.platformUsername &&
                  ` as @${connection.platformUsername}`}
              </span>
            ) : (
              "Not connected — connect to post directly"
            )}
          </p>

          {!loadingConnections && (
            <div className="flex items-center gap-1">
              {isConnected ? (
                <>
                  {/* Test Connection button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={onTest}
                    disabled={testState === "testing"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {testState === "testing" ? (
                        <motion.span
                          key="testing"
                          variants={iconSwapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </motion.span>
                      ) : testState === "success" ? (
                        <motion.span
                          key="success"
                          variants={iconSwapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="text-green-500"
                        >
                          <Check className="h-3 w-3" />
                        </motion.span>
                      ) : testState === "error" ? (
                        <motion.span
                          key="error"
                          variants={iconSwapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="text-destructive"
                        >
                          <XClose className="h-3 w-3" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          variants={iconSwapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Zap className="h-3 w-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    Test
                  </Button>

                  {/* Disconnect button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={onDisconnect}
                    disabled={disconnecting === account.platform}
                  >
                    {disconnecting === account.platform ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Unlink className="h-3 w-3" />
                    )}
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={onConnect}
                >
                  <LinkIcon className="h-3 w-3" />
                  Connect
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main SettingsDialog
// ---------------------------------------------------------------------------

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [testStates, setTestStates] = useState<Record<string, TestState>>({});
  const [contentBotEnabled, setContentBotEnabled] = useState(false);

  // Load settings and OAuth status when dialog opens
  useEffect(() => {
    if (open) {
      const settings = loadSettings();
      setAccounts(settings.socialAccounts);
      setTestStates({});
      setContentBotEnabled(isAssistantEnabled());

      // Fetch OAuth connection status from server
      setLoadingConnections(true);
      fetch("/api/auth/status")
        .then((r) => r.json())
        .then((data) => {
          setConnections(data.connections || []);
          // Auto-fill usernames from OAuth profile data
          if (data.connections) {
            setAccounts((prev) =>
              prev.map((acc) => {
                const conn = data.connections.find(
                  (c: OAuthConnection) =>
                    c.platform === acc.platform && c.connected && c.platformUsername
                );
                if (conn) {
                  return { ...acc, username: conn.platformUsername || acc.username };
                }
                return acc;
              })
            );
          }
        })
        .catch(() => setConnections([]))
        .finally(() => setLoadingConnections(false));
    }
  }, [open]);

  const getConnection = useCallback(
    (platform: SocialMediaAccount["platform"]) =>
      connections.find((c) => c.platform === platform),
    [connections]
  );

  const updateAccount = useCallback(
    (
      platform: SocialMediaAccount["platform"],
      field: "username" | "active",
      value: string | boolean
    ) => {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.platform === platform ? { ...acc, [field]: value } : acc
        )
      );
    },
    []
  );

  function handleConnect(platform: string) {
    window.location.href = `/api/auth/${platform}/authorize`;
  }

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/auth/${platform}/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        setConnections((prev) =>
          prev.map((c) =>
            c.platform === platform ? { ...c, connected: false } : c
          )
        );
        toast.success(
          `${PLATFORM_META[platform as SocialMediaAccount["platform"]].label} disconnected`
        );
      }
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleTest(platform: string) {
    setTestStates((prev) => ({ ...prev, [platform]: "testing" }));

    try {
      const res = await fetch(`/api/auth/${platform}/verify`);
      const data = await res.json();

      if (data.ok) {
        setTestStates((prev) => ({ ...prev, [platform]: "success" }));
        toast.success(
          `${PLATFORM_META[platform as SocialMediaAccount["platform"]].label} verified`,
          { description: `Connected as ${data.username}` }
        );
        // Reset to idle after 2s
        setTimeout(() => {
          setTestStates((prev) => ({ ...prev, [platform]: "idle" }));
        }, 2000);
      } else {
        setTestStates((prev) => ({ ...prev, [platform]: "error" }));
        toast.error(
          `${PLATFORM_META[platform as SocialMediaAccount["platform"]].label} verification failed`,
          { description: data.error || "Connection could not be verified" }
        );
        // Reset to idle after 3s
        setTimeout(() => {
          setTestStates((prev) => ({ ...prev, [platform]: "idle" }));
        }, 3000);
      }
    } catch {
      setTestStates((prev) => ({ ...prev, [platform]: "error" }));
      toast.error("Connection test failed", {
        description: "Could not reach verification server",
      });
      setTimeout(() => {
        setTestStates((prev) => ({ ...prev, [platform]: "idle" }));
      }, 3000);
    }
  }

  function handleSave() {
    const activePlatforms = accounts
      .filter((a) => a.active)
      .map((a) => a.platform);

    saveSettings({
      socialAccounts: accounts,
      defaultPlatforms: activePlatforms,
      oauthConnections: connections,
    });

    toast.success("Settings saved", {
      description: activePlatforms.length
        ? `Active platforms: ${activePlatforms.map((p) => PLATFORM_META[p].label).join(", ")}`
        : "No platforms are currently active.",
    });

    onOpenChange(false);
  }

  // Helper to render a list of platform cards
  function renderPlatforms(platforms: Platform[]) {
    const filteredAccounts = accounts.filter((a) =>
      platforms.includes(a.platform)
    );

    return (
      <motion.div
        className="space-y-3"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        key={platforms.join("-")}
      >
        {filteredAccounts.map((account) => (
          <PlatformCard
            key={account.platform}
            account={account}
            connection={getConnection(account.platform)}
            loadingConnections={loadingConnections}
            disconnecting={disconnecting}
            testState={testStates[account.platform] || "idle"}
            onToggle={(checked) =>
              updateAccount(account.platform, "active", checked)
            }
            onUsernameChange={(val) =>
              updateAccount(account.platform, "username", val)
            }
            onConnect={() => handleConnect(account.platform)}
            onDisconnect={() => handleDisconnect(account.platform)}
            onTest={() => handleTest(account.platform)}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Social Media Settings</DialogTitle>
          <DialogDescription>
            Connect your accounts to post carousels directly, or configure
            platforms for export.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex-1">
              Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">
                      Production Assistant
                    </span>
                  </div>
                  <Switch
                    checked={contentBotEnabled}
                    onCheckedChange={(checked) => {
                      setContentBotEnabled(checked);
                      setAssistantPreference(checked);
                    }}
                    aria-label="Toggle Production Assistant"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enable the Telegram Content Bot (
                  <a
                    href="https://t.me/kodacontentbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-400 hover:underline"
                  >
                    @kodacontentbot
                  </a>
                  ) for creating carousels through conversation. Send your photos
                  and the bot will guide you through the rest.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            {renderPlatforms(PLATFORMS)}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <motion.div whileTap={buttonTapScale}>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
