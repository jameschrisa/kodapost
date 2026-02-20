"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORMS } from "@/components/builder/PublishPanel";
import { compositeSlideImages } from "@/app/actions";
import { useLoadingStore } from "@/lib/stores/loading-store";
import type { CarouselProject, OAuthConnection, Platform } from "@/lib/types";

interface PublishDialogProps {
  project: CarouselProject;
  onProjectUpdate: (project: CarouselProject) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishDialog({
  project,
  onProjectUpdate,
  open,
  onOpenChange,
}: PublishDialogProps) {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    () => new Set(project.targetPlatforms)
  );
  const [caption, setCaption] = useState(project.caption ?? "");
  const [isPosting, setIsPosting] = useState(false);
  const [postingPlatform, setPostingPlatform] = useState<Platform | null>(null);

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const postingRef = useRef(false);
  const { startLoading: startGlobalLoading, stopLoading: stopGlobalLoading } = useLoadingStore();

  // Fetch OAuth connection status when dialog opens
  useEffect(() => {
    if (!open) return;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/auth/status");
        if (res.ok) {
          const data = await res.json();
          setConnections(data.connections || []);
        }
      } catch {
        // Silently fail — platforms show as not connected
      }
    }
    fetchStatus();
  }, [open]);

  // Sync caption from project when dialog opens
  useEffect(() => {
    if (open) {
      setCaption(project.caption ?? "");
    }
  }, [open, project.caption]);

  const readySlides = project.slides.filter((s) => s.status === "ready");

  function getConnectionStatus(platform: Platform): OAuthConnection | undefined {
    return connections.find((c) => c.platform === platform);
  }

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  // Post to a single platform
  async function handlePost(platform: Platform) {
    if (isPosting || postingRef.current) return;
    postingRef.current = true;
    setIsPosting(true);
    setPostingPlatform(platform);
    const platformLabel = PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
    startGlobalLoading(`publish-${platform}`, `Publishing to ${platformLabel}…`);

    try {
      // 1. Composite images for this platform
      const result = await compositeSlideImages(readySlides, [platform], project.filterConfig);

      if (!result.success) {
        toast.error("Post failed", { description: result.error });
        return;
      }

      // 2. Extract base64 images
      const slideImages = result.data
        .filter((item) => item.platform === platform)
        .map((item) => item.imageBase64);

      if (slideImages.length === 0) {
        toast.error("Post failed", { description: "No images to post" });
        return;
      }

      // 3. Send to publish API
      const publishRes = await fetch(`/api/publish/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideImages, caption }),
      });

      const publishData = await publishRes.json();

      if (publishData.success) {
        const displayName = PLATFORMS.find((p) => p.key === platform)?.label || platform;
        toast.success(`Posted to ${displayName}!`, {
          description: publishData.postUrl
            ? "Your carousel is live."
            : "Your carousel has been published.",
        });
      } else {
        toast.error("Post failed", {
          description: publishData.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Publishing failed. Please try again.";
      toast.error("Post failed", { description: message });
    } finally {
      setIsPosting(false);
      setPostingPlatform(null);
      stopGlobalLoading(`publish-${platform}`);
      postingRef.current = false;
    }
  }

  // Post to all selected connected platforms sequentially
  async function handlePostAll() {
    const connectedSelected = Array.from(selectedPlatforms).filter((p) => {
      const conn = getConnectionStatus(p);
      return conn?.connected;
    });

    if (connectedSelected.length === 0) {
      toast.error("No connected platforms selected");
      return;
    }

    for (const platform of connectedSelected) {
      await handlePost(platform);
    }
  }

  // Schedule for later
  function handleSchedule() {
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select both date and time");
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const platforms = Array.from(selectedPlatforms);

    onProjectUpdate({
      ...project,
      scheduledPublishAt: scheduledAt,
      scheduledPlatforms: platforms,
      caption: caption || undefined,
    });

    toast.success("Publishing scheduled!", {
      description: `Your carousel will be published on ${new Date(scheduledAt).toLocaleString()}.`,
    });
    onOpenChange(false);
  }

  const connectedSelected = Array.from(selectedPlatforms).filter((p) => {
    const conn = getConnectionStatus(p);
    return conn?.connected;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Carousel</DialogTitle>
          <DialogDescription>
            Post your {readySlides.length}-slide carousel to social media.
          </DialogDescription>
        </DialogHeader>

        {/* Platform selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Platforms</Label>
          <div className="grid gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.has(platform.key);
              const conn = getConnectionStatus(platform.key);
              const isConnected = conn?.connected ?? false;

              return (
                <Card
                  key={platform.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePlatform(platform.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePlatform(platform.key);
                    }
                  }}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected
                      ? "ring-2 ring-primary shadow-sm"
                      : "hover:ring-1 hover:ring-muted-foreground/30"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {platform.icon}
                        </span>
                        <div>
                          <span className="text-sm font-medium">{platform.label}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {isConnected
                              ? `Connected${conn?.platformUsername ? ` @${conn.platformUsername}` : ""}`
                              : "Not connected"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isConnected && (
                          <span className="text-[10px] text-amber-500">Setup needed</span>
                        )}
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="publish-caption" className="text-sm font-medium">
            Caption
          </Label>
          <Textarea
            id="publish-caption"
            placeholder="Write a caption for your post..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
            rows={3}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {caption.length} / 2200 characters
          </p>
        </div>

        {/* Post Now */}
        <Button
          className="w-full gap-2"
          disabled={
            connectedSelected.length === 0 ||
            isPosting ||
            readySlides.length === 0
          }
          onClick={handlePostAll}
        >
          {isPosting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting to {PLATFORMS.find((p) => p.key === postingPlatform)?.label ?? "..."}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post Now
              {connectedSelected.length > 0 && (
                <span className="opacity-70">
                  ({connectedSelected.length} platform{connectedSelected.length !== 1 ? "s" : ""})
                </span>
              )}
            </>
          )}
        </Button>

        {connectedSelected.length === 0 && selectedPlatforms.size > 0 && (
          <p className="text-xs text-center text-amber-500">
            Selected platforms are not connected. Connect them in Settings to post directly.
          </p>
        )}

        {/* Schedule for Later */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowSchedule((s) => !s)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <CalendarClock className="h-4 w-4" />
            Schedule for Later
            {showSchedule ? (
              <ChevronUp className="h-3.5 w-3.5 ml-auto" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-auto" />
            )}
          </button>

          {showSchedule && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-date" className="text-xs">
                    Date
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-time" className="text-xs">
                    Time
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={
                  selectedPlatforms.size === 0 ||
                  !scheduleDate ||
                  !scheduleTime
                }
                onClick={handleSchedule}
              >
                <CalendarClock className="h-4 w-4" />
                Schedule Publish
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
