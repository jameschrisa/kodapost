"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  ChevronDown,
  Instagram,
  Linkedin,
  Save,
  Link as LinkIcon,
  Unlink,
  Loader2,
  CheckCircle2,
  Youtube,
  Wand2,
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
import { SocialAccountsWizard } from "@/components/shared/SocialAccountsWizard";
import { cn } from "@/lib/utils";
import type {
  SocialMediaAccount,
  OAuthConnection,
  Platform,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Platform groups
// ---------------------------------------------------------------------------

const PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube", "youtube_shorts", "x", "linkedin"];

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
  youtube_shorts: {
    label: "YouTube Shorts",
    icon: <Youtube className="h-4 w-4" />,
    placeholder: "channel name",
  },
  reddit: {
    label: "Reddit",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
      </svg>
    ),
    placeholder: "u/username",
  },
  x: {
    label: "X/Twitter",
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
// PlatformCard sub-component — collapsible
// ---------------------------------------------------------------------------

interface PlatformCardProps {
  account: SocialMediaAccount;
  connection: OAuthConnection | undefined;
  loadingConnections: boolean;
  disconnecting: string | null;
  testState: TestState;
  isOpen: boolean;
  onToggleOpen: () => void;
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
  isOpen,
  onToggleOpen,
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
      <div className="rounded-lg border overflow-hidden">
        {/* Always-visible header — left side toggles collapse */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
          onClick={onToggleOpen}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                !isOpen && "-rotate-90"
              )}
            />
            <span className="text-muted-foreground">{meta.icon}</span>
            <span className="text-sm font-medium">{meta.label}</span>
            {isConnected && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>

          {/* Stop click propagation so Switch doesn't also toggle collapse */}
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={account.active}
              onCheckedChange={onToggle}
              aria-label={`Toggle ${meta.label}`}
            />
          </div>
        </div>

        {/* Collapsible body */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3 border-t">
                {/* Username input */}
                <div className="pt-3 space-y-1.5">
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
                <div className="flex items-center justify-between">
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
          )}
        </AnimatePresence>
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
  // Track which platform cards are expanded
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);

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
          // Default: connected cards open, unconnected cards collapsed
          const initial: Record<string, boolean> = {};
          PLATFORMS.forEach((p) => {
            const conn = (data.connections || []).find(
              (c: OAuthConnection) => c.platform === p
            );
            initial[p] = conn?.connected ?? false;
          });
          setOpenCards(initial);
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

  // Refresh connection statuses after wizard closes
  useEffect(() => {
    if (!wizardOpen && open) {
      setLoadingConnections(true);
      fetch("/api/auth/status")
        .then((r) => r.json())
        .then((data) => {
          setConnections(data.connections || []);
          // Update open state — newly connected cards expand automatically
          setOpenCards((prev) => {
            const next = { ...prev };
            (data.connections || []).forEach((c: OAuthConnection) => {
              if (c.connected && !next[c.platform]) {
                next[c.platform] = true;
              }
            });
            return next;
          });
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
        .catch(() => {})
        .finally(() => setLoadingConnections(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardOpen]);

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

  function toggleCard(platform: string) {
    setOpenCards((prev) => ({ ...prev, [platform]: !prev[platform] }));
  }

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
        setTimeout(() => {
          setTestStates((prev) => ({ ...prev, [platform]: "idle" }));
        }, 2000);
      } else {
        setTestStates((prev) => ({ ...prev, [platform]: "error" }));
        toast.error(
          `${PLATFORM_META[platform as SocialMediaAccount["platform"]].label} verification failed`,
          { description: data.error || "Connection could not be verified" }
        );
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

  // Helper to render collapsible platform cards
  function renderPlatforms(platforms: Platform[]) {
    const filteredAccounts = accounts.filter((a) =>
      platforms.includes(a.platform)
    );

    return (
      <motion.div
        className="space-y-2"
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
            isOpen={openCards[account.platform] ?? false}
            onToggleOpen={() => toggleCard(account.platform)}
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
    <>
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
              <div className="space-y-3">
                {/* Wizard launch button */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Click a platform to expand and manage its connection.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs shrink-0"
                    onClick={() => setWizardOpen(true)}
                  >
                    <Wand2 className="h-3 w-3" />
                    Setup Wizard
                  </Button>
                </div>

                {/* Scrollable platform list */}
                <div className="max-h-[55vh] overflow-y-auto pr-0.5">
                  {renderPlatforms(PLATFORMS)}
                </div>
              </div>
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

      {/* Social Accounts Setup Wizard — renders on top of SettingsDialog */}
      <SocialAccountsWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
