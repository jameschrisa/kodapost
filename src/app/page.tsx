"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Onborda, OnbordaProvider, useOnborda } from "onborda";
import { TourCard } from "@/components/tour/TourCard";
import { appTourSteps } from "@/components/tour/tourSteps";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, FolderOpen, Send } from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { AnimatePresence, motion } from "framer-motion";
import { SaveProjectButton } from "@/components/shared/SaveProjectButton";
import { HeaderMenu } from "@/components/shared/HeaderMenu";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { Footer } from "@/components/shared/Footer";
import { AssistantBanner } from "@/components/shared/AssistantBanner";
import { TrialBanner } from "@/components/shared/TrialBanner";
import { AdminViewBanner } from "@/components/shared/AdminViewBanner";
import { StepIndicator } from "@/components/builder/StepIndicator";
import { ImageUploader } from "@/components/builder/ImageUploader";

// Lazy-load heavy builder components (only rendered one at a time per step)
const ConfigurationPanel = dynamic(() => import("@/components/builder/ConfigurationPanel").then(m => ({ default: m.ConfigurationPanel })), { ssr: false });
const CarouselPreview = dynamic(() => import("@/components/builder/CarouselPreview").then(m => ({ default: m.CarouselPreview })), { ssr: false });
const StoryboardPreview = dynamic(() => import("@/components/builder/StoryboardPreview").then(m => ({ default: m.StoryboardPreview })), { ssr: false });
const TextEditPanel = dynamic(() => import("@/components/builder/TextEditPanel").then(m => ({ default: m.TextEditPanel })), { ssr: false });
const PublishPanel = dynamic(() => import("@/components/builder/PublishPanel").then(m => ({ default: m.PublishPanel })), { ssr: false });

// Lazy-load dialogs and panels (opened on demand)
const SettingsDialog = dynamic(() => import("@/components/shared/SettingsDialog").then(m => ({ default: m.SettingsDialog })), { ssr: false });
const HelpDialog = dynamic(() => import("@/components/shared/HelpDialog").then(m => ({ default: m.HelpDialog })), { ssr: false });
const ProfileDialog = dynamic(() => import("@/components/shared/ProfileDialog").then(m => ({ default: m.ProfileDialog })), { ssr: false });
const ContentBotPanel = dynamic(() => import("@/components/shared/ContentBotPanel").then(m => ({ default: m.ContentBotPanel })), { ssr: false });
const AdvancedSettingsDialog = dynamic(() => import("@/components/shared/AdvancedSettingsDialog").then(m => ({ default: m.AdvancedSettingsDialog })), { ssr: false });
import { generateCarousel } from "@/app/actions";
import { toast } from "sonner";
import {
  createEmptyProject,
  saveProject,
  loadProject,
  loadProjectName,
  saveProjectName,
  clearProject,
  clearAllStorage,
  saveStep,
  loadStep,
  saveImagesToIDB,
  loadImagesFromIDB,
  clearImagesFromIDB,
  migrateLegacyProject,
  isMigrationComplete,
} from "@/lib/storage";
import {
  stepTransitionVariants,
  staggerContainerVariants,
  staggerItemVariants,
  buttonTapScale,
  breathingVariants,
} from "@/lib/motion";
import { cn, computeConfigHash } from "@/lib/utils";
import { SquarePenIcon } from "@/components/icons/animated/square-pen";
import { CalendarDaysIcon } from "@/components/icons/animated/calendar-days";
import { SavedDraftCard } from "@/components/shared/SavedDraftCard";
import { DraftListPanel } from "@/components/shared/DraftListPanel";

// Lazy-load secondary views (only shown when user navigates to them)
const ContentSchedule = dynamic(() => import("@/components/history/ContentSchedule").then(m => ({ default: m.ContentSchedule })), { ssr: false });
const ProjectsView = dynamic(() => import("@/components/projects/ProjectsView").then(m => ({ default: m.ProjectsView })), { ssr: false });
const AudioPanel = dynamic(() => import("@/components/audio").then(m => ({ default: m.AudioPanel })), { ssr: false });
import { EmptyStateGuide, hasSeenGuide, markGuideSeen } from "@/components/shared/EmptyStateGuide";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useLanguage } from "@/i18n/context";
import { logActivity } from "@/lib/activity-log";
import {
  listDraftMetadata,
  saveDraft,
  saveDraftImages,
  saveDraftAudio,
  deleteDraft,
  pruneExpiredDrafts,
  loadDraftImages,
  loadDraftAudio,
  loadDraft,
} from "@/lib/draft-storage";
import { createNewDraft, switchDraft } from "@/lib/draft-manager";
import { DEFAULT_GLOBAL_OVERLAY_STYLE } from "@/lib/constants";
import type { AudioClip, CarouselProject, CarouselSlide, DraftMetadata, PostMode, UploadedImage, VideoSettings } from "@/lib/types";
import { TourContext } from "@/components/tour/TourContext";

type Step = "upload" | "configure" | "edit" | "review" | "publish";
type AppMode = "create" | "projects" | "schedule";

const STEP_ORDER: Step[] = ["upload", "configure", "edit", "review", "publish"];

/** Tour step → app workflow screen mapping */
const TOUR_STEP_TO_APP_STEP: Record<number, Step> = {
  0: "upload",
  1: "upload",
  2: "upload",
  3: "configure",
  4: "configure",
  5: "edit",
  6: "review",
  7: "publish",
};

/** Demo photos used to pre-populate the tour project */
const DEMO_FILENAMES = ["testreal1.jpg", "testreal3.jpg", "testreal4.jpg", "testreal5.jpg"];
const DEMO_SLIDE_TYPES = ["hook", "story", "story", "closer"] as const;

/** Creates a minimal project from public test photos — no API calls, no base64 conversion. */
function createDemoProject(): CarouselProject {
  const uploadedImages: UploadedImage[] = DEMO_FILENAMES.map((filename, i) => ({
    id: `demo-img-${i}`,
    url: `/test-photos/${filename}`,
    filename,
    uploadedAt: new Date().toISOString(),
    usedInSlides: [i],
  }));
  const slides: CarouselSlide[] = DEMO_FILENAMES.map((filename, i) => ({
    id: `demo-slide-${i}`,
    position: i,
    slideType: DEMO_SLIDE_TYPES[i],
    status: "ready" as const,
    imageUrl: `/test-photos/${filename}`,
    metadata: { source: "user_upload" as const, originalFilename: filename },
  }));
  return {
    ...createEmptyProject(),
    theme: "Demo — explore the workflow",
    uploadedImages,
    slides,
    slideCount: DEMO_FILENAMES.length,
  };
}

/** Starts the Onborda tour when `pending` becomes true. Resets app state when tour closes. */
function TourStarter({
  pending,
  onStarted,
  onClose,
}: {
  pending: boolean;
  onStarted: () => void;
  onClose: () => void;
}) {
  const { startOnborda, isOnbordaVisible } = useOnborda();
  const wasVisible = useRef(false);

  useEffect(() => {
    if (pending) {
      startOnborda("app-tour");
      onStarted();
    }
  }, [pending, startOnborda, onStarted]);

  // Detect when the tour closes (Done / Skip / ✕) and reset the demo project
  useEffect(() => {
    if (isOnbordaVisible) {
      wasVisible.current = true;
    } else if (wasVisible.current) {
      wasVisible.current = false;
      onClose();
    }
  }, [isOnbordaVisible, onClose]);

  return null;
}

function OAuthRedirectHandler({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    // Guard against React strict mode double-fire
    if (processedRef.current) return;

    const success = searchParams.get("oauth_success");
    const error = searchParams.get("oauth_error");
    const platform = searchParams.get("platform") || "Platform";

    if (!success && !error) return;

    processedRef.current = true;

    const displayName =
      platform.charAt(0).toUpperCase() + platform.slice(1);

    if (success) {
      toast.success(`${displayName} connected!`, {
        description: `Your ${displayName} account has been linked successfully.`,
      });
      onOpenSettings();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "You declined the authorization request.",
        invalid_state: "The authorization session expired. Please try again.",
        token_exchange_failed: "Could not complete the connection. Please try again.",
        server_error: "An internal error occurred. Please try again.",
      };
      const description = errorMessages[error] ?? "An unexpected error occurred. Please try again.";
      toast.error(`${displayName} connection failed`, { description });
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, [searchParams, onOpenSettings]);

  return null;
}

/** Redirects unauthenticated users to sign-in (belt-and-suspenders guard). */
function AuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push("/sign-in");
  }, [router]);
  return null;
}

export default function Home() {
  const { isSignedIn, isLoaded: authLoaded, isClerkEnabled } = useClerkAuth();
  const router = useRouter();
  const [project, setProject] = useState<CarouselProject>(createEmptyProject);
  const [step, setStep] = useState<Step>("upload");
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarPickerMode, setAvatarPickerMode] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [splashForced, setSplashForced] = useState(false);
  const [contentBotOpen, setContentBotOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("create");
  const [reviewView, setReviewView] = useState<"grid" | "timeline">("grid");
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [tourPending, setTourPending] = useState(false);
  const [tourMode, setTourMode] = useState(false);

  // Multi-draft state
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftList, setDraftList] = useState<DraftMetadata[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Plan-aware limits
  const userPlan = useUserPlan();

  // Sync i18n language preference into project for AI generation
  const { language: i18nLanguage } = useLanguage();

  // Prefetch key routes so navigation feels instant
  useEffect(() => {
    router.prefetch("/introduction");
    router.prefetch("/sign-in");
    router.prefetch("/sign-up");
  }, [router]);

  // Hydrate from localStorage + IndexedDB after mount
  // Includes legacy migration to multi-draft system
  useEffect(() => {
    async function hydrate() {
      try {
        // Step 1: Run legacy migration if needed
        if (!isMigrationComplete()) {
          const migratedId = await migrateLegacyProject(userPlan.tier);
          if (migratedId) {
            setActiveDraftId(migratedId);
          }
        }

        // Step 2: Prune expired drafts
        const pruned = await pruneExpiredDrafts();
        if (pruned.length > 0) {
          toast.info(`${pruned.length} expired draft${pruned.length > 1 ? "s" : ""} removed`);
        }

        // Step 3: List all drafts
        const drafts = await listDraftMetadata();
        setDraftList(drafts);

        // Step 3b: Check for ?draft= query param (e.g., from Telegram import)
        const urlParams = new URLSearchParams(window.location.search);
        const requestedDraftId = urlParams.get("draft");
        if (requestedDraftId) {
          // Clear the query param from the URL
          window.history.replaceState({}, "", window.location.pathname);
        }

        // Step 4: Determine onboarding state
        if (drafts.length === 0 && !hasSeenGuide()) {
          setShowOnboarding(true);
        }

        // Step 5: Load most recent draft (or requested draft) or fall back to legacy localStorage
        if (drafts.length > 0) {
          // Prefer the requested draft if it exists, otherwise most recent
          const targetDraft = requestedDraftId
            ? drafts.find((d) => d.id === requestedDraftId) || drafts[0]
            : drafts[0];
          const mostRecent = targetDraft; // sorted by updatedAt desc
          const loaded = await loadDraft(mostRecent.id);
          if (loaded) {
            // Restore images from per-draft IDB
            const imageMap = await loadDraftImages(mostRecent.id);
            if (imageMap.size > 0) {
              loaded.project.uploadedImages = loaded.project.uploadedImages.map((img) => ({
                ...img,
                url: imageMap.get(img.id) || img.url,
                thumbnailUrl: imageMap.get(`${img.id}:thumb`) || img.thumbnailUrl,
              }));
              loaded.project.slides = loaded.project.slides.map((slide) => {
                // Restore slide image from per-draft storage (direct slide ID or referenced upload)
                const directRestore = imageMap.get(slide.id);
                if (directRestore && (!slide.imageUrl || slide.imageUrl === "")) {
                  return { ...slide, imageUrl: directRestore };
                }
                if (slide.metadata?.source === "user_upload" && slide.metadata.referenceImage) {
                  const restored = loaded.project.uploadedImages.find(
                    (img) => img.id === slide.metadata!.referenceImage
                  );
                  if (restored?.url) {
                    return { ...slide, imageUrl: restored.url, thumbnailUrl: restored.thumbnailUrl };
                  }
                }
                return slide;
              });
            }

            // Restore audio from per-draft IDB
            if (loaded.project.audioClip && !loaded.project.audioClip.objectUrl) {
              const audioData = await loadDraftAudio(mostRecent.id);
              if (audioData) {
                loaded.project.audioClip = {
                  ...loaded.project.audioClip,
                  objectUrl: audioData.objectUrl,
                };
              }
            }

            setProject(loaded.project);
            setActiveDraftId(mostRecent.id);

            const hasImages = loaded.project.uploadedImages.some((img) => img.url.length > 0);
            const stepToUse = (hasImages || loaded.project.slides.length > 0)
              ? loaded.step as Step
              : "upload";
            setStep(stepToUse);

            // Skip splash for returning users (only when auth is not required;
            // when Clerk is enabled, the auth effect below handles dismissal).
            if (loaded.name && stepToUse !== "upload" && !isClerkEnabled) {
              setSplashDismissed(true);
            }
          }
        } else {
          // Fall back to legacy localStorage hydration
          const saved = loadProject();
          const savedStep = loadStep();
          const savedName = loadProjectName();

          if (saved) {
            const imageMap = await loadImagesFromIDB();
            if (imageMap.size > 0) {
              saved.uploadedImages = saved.uploadedImages.map((img) => {
                const stored = imageMap.get(img.id);
                if (!stored) return img;
                if (typeof stored === "string") {
                  return { ...img, url: stored };
                }
                return { ...img, url: stored.url, thumbnailUrl: stored.thumbnailUrl || img.thumbnailUrl };
              });
              saved.slides = saved.slides.map((slide) => {
                if (slide.metadata?.source === "user_upload" && slide.metadata.referenceImage) {
                  const restored = saved.uploadedImages.find(
                    (img) => img.id === slide.metadata!.referenceImage
                  );
                  if (restored?.url) {
                    return { ...slide, imageUrl: restored.url };
                  }
                }
                return slide;
              });
            }

            setProject(saved);

            const hasImages = saved.uploadedImages.some((img) => img.url.length > 0);
            if (!hasImages && savedStep !== "upload") {
              setStep("upload");
            } else {
              setStep(savedStep);
            }

            if (savedName && savedStep !== "upload" && !isClerkEnabled) {
              setSplashDismissed(true);
            }
          } else {
            setStep(loadStep());
          }
        }
      } catch (err) {
        console.error("[hydrate] failed:", err);
        toast.error("Failed to restore your project. Starting fresh.");
      }

      setHydrated(true);
    }

    hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss splash for signed-in users returning from auth (initial load only).
  // Uses a ref to ensure this only fires once and doesn't interfere with
  // user-triggered splash (brand click, Start Fresh).
  const initialAuthCheckDone = useRef(false);
  useEffect(() => {
    if (!hydrated || !authLoaded || initialAuthCheckDone.current) return;
    initialAuthCheckDone.current = true;
    if (isSignedIn) {
      // Track login count for progressive feature disclosure (e.g. AssistantBanner)
      try {
        const key = "kodapost:login-count";
        const count = parseInt(localStorage.getItem(key) ?? "0", 10);
        localStorage.setItem(key, String(count + 1));
      } catch { /* localStorage unavailable */ }

      if (!splashDismissed) {
        setSplashDismissed(true);
      }
    }
  }, [hydrated, authLoaded, isSignedIn, splashDismissed]);

  // Auto-save project and step on changes (legacy + multi-draft)
  const [lastSavedAt, setLastSavedAt] = useState<number>(0);
  const prevImageCountRef = useRef(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;

    // Legacy localStorage save (fast, synchronous)
    try {
      saveProject(project);
      saveStep(step);
    } catch (e) {
      // QuotaExceededError — silently skip rather than clearing project state
      console.warn("[auto-save] localStorage save failed, skipping:", e);
    }
    setLastSavedAt(Date.now());

    // Persist images to IndexedDB when they change (async, non-blocking)
    const currentImageCount = project.uploadedImages.filter(img => img.url.length > 0).length;
    if (currentImageCount !== prevImageCountRef.current) {
      prevImageCountRef.current = currentImageCount;
      const imagesToSave = project.uploadedImages
        .filter(img => img.url && img.url.startsWith("data:"))
        .map(img => ({ id: img.id, url: img.url, thumbnailUrl: img.thumbnailUrl }));
      if (imagesToSave.length > 0) {
        saveImagesToIDB(imagesToSave).catch(() => {});
      }
    }

    // Multi-draft auto-save (debounced 500ms for IndexedDB writes)
    if (activeDraftId) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const name = project.projectName || loadProjectName() || "Untitled Project";
        saveDraft(activeDraftId, project, step, name).catch(() => {
          toast.warning("Auto-save failed. Your work is safe in memory but may not persist if you close the tab.");
        });

        // Save images to per-draft storage
        const imgs = project.uploadedImages
          .filter(img => img.url && img.url.startsWith("data:"))
          .map(img => ({ id: img.id, url: img.url, thumbnailUrl: img.thumbnailUrl }));
        if (imgs.length > 0) {
          saveDraftImages(activeDraftId, imgs).catch(() => {});
        }

        // Save audio blob to per-draft storage
        if (project.audioClip?.objectUrl) {
          fetch(project.audioClip.objectUrl)
            .then(res => res.blob())
            .then(blob => saveDraftAudio(activeDraftId, blob, project.audioClip!.mimeType))
            .catch(() => {});
        }
      }, 500);
    }
  }, [project, step, hydrated, activeDraftId]);

  // Warn before closing with unsaved generation in progress
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // Warn if the user has slides (i.e. has done meaningful work)
      const hasWork = project.slides.length > 0 && project.slides.some(s => s.status === "ready");
      if (hasWork) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [project.slides]);

  // -- Direction-aware step navigation --

  const navigateToStep = useCallback(
    (newStep: Step) => {
      const currentIdx = STEP_ORDER.indexOf(step);
      const newIdx = STEP_ORDER.indexOf(newStep);
      setDirection(newIdx >= currentIdx ? 1 : -1);
      setStep(newStep);
    },
    [step]
  );

  // -- Step handlers --

  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);

  const handleUploadComplete = useCallback(
    async (images: UploadedImage[]) => {
      const isSingle = images.length === 1;
      setProject((prev) => ({
        ...prev,
        uploadedImages: images,
        postMode: isSingle ? "single" : prev.postMode,
        slideCount: isSingle ? 1 : Math.max(2, Math.min(12, images.length)),
      }));

      // Auto-create a draft if none exists so the project persists in the draft list
      if (!activeDraftId) {
        const result = await createNewDraft(userPlan.tier);
        if (result.success && result.draftId) {
          setActiveDraftId(result.draftId);
          const drafts = await listDraftMetadata();
          setDraftList(drafts);
        }
      }

      // Mark onboarding as seen after first upload
      if (showOnboarding) {
        markGuideSeen();
        setShowOnboarding(false);
      }

      navigateToStep("configure");
      logActivity("images_uploaded", `Uploaded ${images.length} image${images.length !== 1 ? "s" : ""}`, activeDraftId ?? undefined);
      toast.success(
        isSingle ? "Photo uploaded" : "Photos uploaded",
        {
          description: isSingle
            ? "1 image ready. Post type set to Single Post."
            : `${images.length} images ready for your carousel.`,
        }
      );
    },
    [navigateToStep, activeDraftId, showOnboarding, userPlan.tier]
  );

  const handleProjectUpdate = useCallback((updated: CarouselProject) => {
    setProject(updated);
  }, []);

  const handlePostModeChange = useCallback((mode: PostMode) => {
    setProject((prev) => ({
      ...prev,
      postMode: mode,
      slideCount: mode === "single" ? 1 : (prev.slideCount < 2 ? 5 : prev.slideCount),
    }));
  }, []);

  const handleHeadlineModeChange = useCallback((mode: "all" | "first_only" | "none") => {
    setProject((prev) => {
      const gos = prev.globalOverlayStyle ?? { ...DEFAULT_GLOBAL_OVERLAY_STYLE };
      return {
        ...prev,
        globalOverlayStyle: { ...gos, headlineMode: mode, showHeadline: mode !== "none" },
      };
    });
  }, []);

  const handleSlideCountChange = useCallback((count: number) => {
    setProject((prev) => ({ ...prev, slideCount: count }));
  }, []);

  const handleAudioChange = useCallback((clip: AudioClip | undefined) => {
    setProject((prev) => ({ ...prev, audioClip: clip }));
  }, []);

  const handleVideoSettingsChange = useCallback((vs: VideoSettings) => {
    setProject((prev) => ({ ...prev, videoSettings: vs }));
  }, []);

  const handleSlideDurationChange = useCallback((slideId: string, duration: number | undefined) => {
    setProject((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === slideId ? { ...s, durationOverride: duration } : s
      ),
    }));
  }, []);

  // Auto-switch to timeline view when audio is added in Finalize step
  useEffect(() => {
    if (project.audioClip?.objectUrl) {
      setReviewView("timeline");
    }
  }, [project.audioClip?.objectUrl]);

  // Generation ID to discard stale results when user cancels
  const generationIdRef = useRef(0);

  const cancelGeneration = useCallback(() => {
    generationIdRef.current++;
  }, []);

  const handleGenerate = useCallback(async () => {
    // Increment generation ID so any previous in-flight generation is discarded
    const thisGenId = ++generationIdRef.current;

    // Strip base64 image data before sending to server action to avoid
    // exceeding Vercel's request/response size limits. The server only
    // needs image metadata (id, filename, dimensions), not the pixels.
    const lightProject: CarouselProject = {
      ...project,
      language: project.language || i18nLanguage,
      uploadedImages: project.uploadedImages.map(img => ({
        ...img,
        url: "", // Strip base64, restored client-side after response
      })),
    };

    let result: Awaited<ReturnType<typeof generateCarousel>>;
    try {
      result = await generateCarousel(lightProject);
    } catch (err) {
      if (generationIdRef.current !== thisGenId) return; // cancelled
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
      return;
    }

    // Discard result if user cancelled while we were waiting
    if (generationIdRef.current !== thisGenId) return;

    if (!result || !result.success) {
      toast.error("Generation failed", {
        description: result?.error ?? "Server returned an empty response. Check your API key and try again.",
      });
      return;
    }

    const data = result.data;

    // Restore original uploadedImages (server strips base64 data to stay
    // within Vercel's response size limit, client already has them).
    data.uploadedImages = project.uploadedImages;

    // Restore image URLs on slides that reference uploaded images
    for (const slide of data.slides) {
      if (slide.metadata?.source === "user_upload" && slide.metadata.referenceImage) {
        const uploaded = project.uploadedImages.find(
          (img) => img.id === slide.metadata!.referenceImage
        );
        if (uploaded) {
          slide.imageUrl = uploaded.url;
          slide.thumbnailUrl = uploaded.thumbnailUrl;
        }
      }
    }

    const errorSlides = data.slides.filter((s) => s.status === "error").length;
    const readySlides = data.slides.filter((s) => s.status === "ready").length;

    const hash = computeConfigHash(project);
    setProject({ ...data, lastGeneratedConfigHash: hash });
    navigateToStep("edit");
    logActivity("carousel_generated", `Generated ${readySlides} slides`, activeDraftId ?? undefined);

    if (errorSlides > 0) {
      toast.warning("Partially generated", {
        description: `${readySlides} slides ready, ${errorSlides} failed. You can retry failed slides later.`,
      });
    } else {
      const isSingleMode = (project.postMode ?? "carousel") === "single";
      toast.success(isSingleMode ? "Post generated" : "Carousel generated", {
        description: isSingleMode
          ? "Your post has been created successfully."
          : `${readySlides} slides created successfully.`,
      });
    }
  }, [project, navigateToStep, activeDraftId, i18nLanguage]);

  const handleEditComplete = useCallback(() => {
    // Auto-save before entering Review
    const name = project.projectName || loadProjectName() || "Untitled Project";
    saveProject({ ...project, projectName: name });
    saveProjectName(name);
    toast.info("Project saved", {
      description: "Your work has been saved automatically.",
      duration: 3000,
    });
    navigateToStep("review");
  }, [navigateToStep, project]);

  const handleContinueToEdit = useCallback(() => {
    navigateToStep("edit");
  }, [navigateToStep]);

  const handlePublish = useCallback(() => {
    navigateToStep("publish");
  }, [navigateToStep]);

  const handleBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      navigateToStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step, navigateToStep]);

  const handleStepClick = useCallback(
    (clickedStep: Step) => {
      const currentIndex = STEP_ORDER.indexOf(step);
      const clickedIndex = STEP_ORDER.indexOf(clickedStep);
      // Only allow navigating to completed steps (earlier than current)
      if (clickedIndex < currentIndex) {
        navigateToStep(clickedStep);
      }
    },
    [step, navigateToStep]
  );

  const handleComplete = useCallback(() => {
    clearProject();
    clearImagesFromIDB().catch(() => {});
    logActivity("project_reset", "Started new project", activeDraftId ?? undefined);
    setProject(createEmptyProject());
    setActiveDraftId(null);
    setDirection(-1);
    setStep("upload");
    // Refresh draft list
    listDraftMetadata().then(setDraftList).catch(() => {});
    toast.success("New project started", {
      description: "Your previous carousel has been cleared.",
    });
  }, [activeDraftId]);

  /** Resume a saved draft — project is already hydrated, just navigate to the right step */
  const handleResumeDraft = useCallback(() => {
    const savedStep = loadStep();
    const hasImages = project.uploadedImages.some((img) => img.url.length > 0);
    const hasSlides = project.slides.some((s) => s.status === "ready");

    let targetStep = savedStep;

    if (hasImages || hasSlides) {
      if (savedStep === "upload") {
        if (hasSlides) {
          targetStep = "edit";
        } else if (hasImages) {
          targetStep = "configure";
        }
      }
      navigateToStep(targetStep);
      logActivity("draft_resumed", `Resumed at ${targetStep}`, activeDraftId ?? undefined);
      toast.success("Project restored", {
        description: `Resuming at ${targetStep === "configure" ? "Craft" : targetStep === "edit" ? "Editorial" : targetStep === "review" ? "Finalize" : targetStep === "publish" ? "Publish" : "Upload"}.`,
        duration: 3000,
      });
    } else if (!hasImages && savedStep !== "upload") {
      toast.info("Project settings restored", {
        description: "Re-upload your photos to continue where you left off.",
        duration: 5000,
      });
    } else {
      toast.info("Project restored", {
        description: "Upload your photos to get started.",
        duration: 3000,
      });
    }
  }, [navigateToStep, project.uploadedImages, project.slides, activeDraftId]);

  const handleDiscardDraft = useCallback(() => {
    clearProject();
    clearImagesFromIDB().catch(() => {});
    logActivity("draft_discarded", "Discarded draft", activeDraftId ?? undefined);
    // Also delete from multi-draft storage
    if (activeDraftId) {
      deleteDraft(activeDraftId).catch(() => {});
    }
    setProject(createEmptyProject());
    setActiveDraftId(null);
    setStep("upload");
    // Refresh draft list
    listDraftMetadata().then(setDraftList).catch(() => {});
    toast.info("Draft discarded");
  }, [activeDraftId]);

  const handleBrandClick = useCallback(() => {
    setSplashForced(true);
    setSplashDismissed(false);
  }, []);

  const handleOpenTour = useCallback(() => {
    setSplashDismissed(true);
    setSplashForced(false);
    setTourMode(true);
    // Pre-populate a demo project so every workflow screen renders meaningful UI
    setProject(createDemoProject());
    setStep("upload");
    setTourPending(true);
  }, []);

  /** Called when the tour closes — discard demo project, return to splash for unauthenticated users */
  const handleTourClose = useCallback(() => {
    setTourMode(false);
    setProject(createEmptyProject());
    setStep("upload");
    // If the user isn't signed in, return them to the splash/landing page
    if (!isSignedIn) {
      setSplashDismissed(false);
      setSplashForced(true);
    }
  }, [isSignedIn]);

  /** Navigate the app to the screen required by a given tour step, then pause for animation */
  const navigateForTourStep = useCallback(
    async (tourStepIdx: number) => {
      const appStep = TOUR_STEP_TO_APP_STEP[tourStepIdx];
      if (!appStep) return;
      if (STEP_ORDER.indexOf(appStep) !== STEP_ORDER.indexOf(step)) {
        navigateToStep(appStep);
        await new Promise((r) => setTimeout(r, 600));
      }
      // Scroll to top instantly before Onborda's own smooth scroll fires
      window.scrollTo({ top: 0 });
    },
    [step, navigateToStep]
  );

  const handleGetStarted = useCallback(
    (dismiss: () => void) => {
      if (!authLoaded) return;
      if (isSignedIn) {
        dismiss(); // Trigger splash exit animation → builder
      } else {
        router.push("/sign-in");
      }
    },
    [authLoaded, isSignedIn, router]
  );

  const handleResetApp = useCallback(() => {
    logActivity("project_reset", "Full app reset — all data cleared");
    clearAllStorage();
    setProject(createEmptyProject());
    setActiveDraftId(null);
    setDraftList([]);
    setDirection(-1);
    setStep("upload");
    setSplashForced(true);
    setSplashDismissed(false);
    toast.success("App reset", {
      description: "All data cleared. Starting fresh as a new user.",
    });
  }, []);

  // -- Multi-draft handlers --

  const handleNewDraft = useCallback(async () => {
    // Save current draft BEFORE creating new one to prevent data loss
    if (activeDraftId) {
      const name = project.projectName || loadProjectName() || "Untitled Project";
      await saveDraft(activeDraftId, project, step, name).catch(() => {});
    }

    const result = await createNewDraft(userPlan.tier);
    if (!result.success) {
      if (result.error === "limit_reached") {
        toast.error("Draft limit reached", {
          description: `Your ${userPlan.config.displayName} plan allows ${userPlan.draftLimit} draft${userPlan.draftLimit !== 1 ? "s" : ""}. Delete an existing draft or upgrade.`,
        });
      } else {
        toast.error("Failed to create draft");
      }
      return;
    }

    const newProject = createEmptyProject();
    setProject(newProject);
    setActiveDraftId(result.draftId!);
    setStep("upload");
    setDirection(-1);
    logActivity("draft_created", "Created new draft", result.draftId);

    // Refresh draft list
    const drafts = await listDraftMetadata();
    setDraftList(drafts);

    toast.success("New draft created", {
      description: "Start uploading photos for your new project.",
    });
  }, [userPlan.tier, userPlan.config.displayName, userPlan.draftLimit, activeDraftId, project, step]);

  const handleSwitchDraft = useCallback(async (targetDraftId: string) => {
    if (targetDraftId === activeDraftId) return;

    const name = project.projectName || loadProjectName() || "Untitled Project";
    const result = await switchDraft(
      activeDraftId,
      project,
      step,
      name,
      targetDraftId
    );

    if (!result.success) {
      toast.error("Failed to load draft");
      return;
    }

    setProject(result.project!);
    setActiveDraftId(targetDraftId);
    const targetStep = result.step as Step;
    setStep(targetStep);
    logActivity("draft_switched", `Switched to "${result.name}"`, targetDraftId, result.name);

    // Refresh draft list
    const drafts = await listDraftMetadata();
    setDraftList(drafts);

    toast.success("Draft loaded", {
      description: `Switched to "${result.name}".`,
      duration: 3000,
    });
  }, [activeDraftId, project, step]);

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    const draftMeta = draftList.find((d) => d.id === draftId);
    await deleteDraft(draftId);
    logActivity("draft_discarded", `Deleted "${draftMeta?.name || "Untitled"}"`, draftId, draftMeta?.name);

    const drafts = await listDraftMetadata();
    setDraftList(drafts);

    if (draftId === activeDraftId) {
      // Deleted the active draft — load next available or start fresh
      const remaining = drafts.filter((d) => d.id !== draftId);
      if (remaining.length > 0) {
        const next = remaining[0];
        const loaded = await loadDraft(next.id);
        if (loaded) {
          setProject(loaded.project);
          setActiveDraftId(next.id);
          setStep(loaded.step as Step);
          toast.info("Draft deleted", {
            description: `Switched to "${next.name || "Untitled"}".`,
          });
          return;
        }
      }
      setActiveDraftId(null);
      setProject(createEmptyProject());
      setStep("upload");
    }

    toast.info("Draft deleted", {
      description: `"${draftMeta?.name || "Untitled"}" has been removed.`,
    });
  }, [activeDraftId, draftList]);

  const handleRenameDraft = useCallback(async (draftId: string, newName: string) => {
    // Update local state immediately
    setDraftList((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, name: newName } : d))
    );

    if (draftId === activeDraftId) {
      // Use in-memory state for active draft to avoid stale IDB data
      saveProjectName(newName);
      const updated = { ...project, projectName: newName };
      setProject(updated);
      await saveDraft(draftId, updated, step, newName);
    } else {
      // Load from IDB for inactive drafts
      const loaded = await loadDraft(draftId);
      if (loaded) {
        await saveDraft(draftId, loaded.project, loaded.step, newName);
      }
    }
  }, [activeDraftId, project, step]);

  const handleContinueProject = useCallback(async (draftId: string) => {
    if (draftId === activeDraftId) {
      setAppMode("create");
      return;
    }
    await handleSwitchDraft(draftId);
    setAppMode("create");
  }, [activeDraftId, handleSwitchDraft]);

  // -- Keyboard shortcuts --
  const handleSaveShortcut = useCallback(async () => {
    if (step === "configure" || step === "edit") {
      const name = project.projectName || loadProjectName() || "Untitled Project";
      saveProject({ ...project, projectName: name });
      saveProjectName(name);

      // Also save to draft system for persistence in draft list
      if (activeDraftId) {
        await saveDraft(activeDraftId, project, step, name).catch(() => {});
        const imgs = project.uploadedImages
          .filter(img => img.url && img.url.startsWith("data:"))
          .map(img => ({ id: img.id, url: img.url, thumbnailUrl: img.thumbnailUrl }));
        if (imgs.length > 0) {
          saveDraftImages(activeDraftId, imgs).catch(() => {});
        }
        const drafts = await listDraftMetadata();
        setDraftList(drafts);
      }

      toast.success("Project saved", { duration: 2000 });
    }
  }, [step, project, activeDraftId]);

  useKeyboardShortcuts({
    onSave: handleSaveShortcut,
    onEscape: step !== "upload" ? handleBack : undefined,
  });

  // Show splash/landing page immediately while hydrating project data.
  // Only gate the app UI behind hydration — the marketing site needs no project data.
  if (!hydrated) {
    if (!splashDismissed) {
      return (
        <SplashScreen
          forceShow={splashForced}
          onComplete={() => {
            setSplashDismissed(true);
            setSplashForced(false);
          }}
          onGetStarted={handleGetStarted}
          onOpenTour={handleOpenTour}
        />
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          variants={breathingVariants}
          animate="animate"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <KodaPostIcon className="h-6 w-6" />
        </motion.div>
      </div>
    );
  }

  return (
    <TourContext.Provider value={{ navigateForTourStep }}>
    <OnbordaProvider>
      <Onborda
        steps={appTourSteps}
        cardComponent={TourCard}
        shadowRgb="0,0,0"
        shadowOpacity="0.85"
      >
        <TourStarter pending={tourPending} onStarted={() => setTourPending(false)} onClose={handleTourClose} />
        {/* Hidden full-screen target for modal-style tour steps */}
        <div data-tour="tour-modal" className="fixed inset-0 pointer-events-none z-[-1]" />
    <>
      {/* Splash Screen — uses normal document flow for native mobile scroll */}
      {!splashDismissed && (
        <SplashScreen
          forceShow={splashForced}
          onComplete={() => {
            setSplashDismissed(true);
            setSplashForced(false);
          }}
          onGetStarted={handleGetStarted}
          onOpenTour={handleOpenTour}
        />
      )}

    <div className={`flex min-h-screen flex-col bg-background${!splashDismissed ? " hidden" : ""}`}>
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-4 px-4 py-3 sm:py-4 sm:px-6">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-2 sm:gap-3 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show start screen"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KodaPostIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-left">
              <h1 className="text-base sm:text-lg font-bold leading-tight">KodaPost</h1>
              <p className="hidden sm:block text-xs text-muted-foreground">
                Transform photos into stunning carousels
              </p>
            </div>
          </button>
          <div className="flex-1" />
          {/* Save — only on Configure and Editorial steps */}
          {(step === "configure" || step === "edit") && (
            <div className="flex items-center gap-2">
              {lastSavedAt > 0 && (
                <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                  Auto-saved
                </span>
              )}
              <motion.div whileTap={buttonTapScale}>
                <SaveProjectButton project={project} />
              </motion.div>
            </div>
          )}
          {/* Consolidated menu: theme toggle + help/profile/settings */}
          <HeaderMenu
            onOpenHelp={() => setHelpOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAdvancedSettings={() => setAdvancedSettingsOpen(true)}
            onOpenContentBot={() => setContentBotOpen(true)}
            onResetApp={handleResetApp}
            onOpenTour={handleOpenTour}
            onOpenAvatarPicker={() => {
              setAvatarPickerMode(true);
              setSettingsOpen(true);
            }}
          />
        </div>
      </header>

      {/* OAuth redirect handler */}
      <Suspense>
        <OAuthRedirectHandler
          onOpenSettings={handleOpenSettings}
        />
      </Suspense>

      {/* Dialogs */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={(v) => {
          setSettingsOpen(v);
          if (!v) setAvatarPickerMode(false);
        }}
        initialAvatarOpen={avatarPickerMode}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} onOpenTour={handleOpenTour} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ContentBotPanel open={contentBotOpen} onOpenChange={setContentBotOpen} />
      <AdvancedSettingsDialog open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen} />

      {/* Assistant banner — shown when preference not yet set */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4">
        <AssistantBanner />
      </div>

      {/* App mode tabs — Create Post / Content Calendar */}
      <div className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setAppMode("create")}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              appMode === "create"
                ? "text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SquarePenIcon size={16} />
            Create Post
            {appMode === "create" && (
              <motion.div
                layoutId="app-mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setAppMode("projects")}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              appMode === "projects"
                ? "text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderOpen size={16} />
            Projects
            {appMode === "projects" && (
              <motion.div
                layoutId="app-mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setAppMode("schedule")}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              appMode === "schedule"
                ? "text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDaysIcon size={16} />
            Content Calendar
            {appMode === "schedule" && (
              <motion.div
                layoutId="app-mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Auth guard — redirect unauthenticated users who bypassed splash (skip during tour) */}
      {splashDismissed && authLoaded && !isSignedIn && isClerkEnabled && !tourMode && (
        <AuthRedirect />
      )}

      {/* === CONTENT SCHEDULE VIEW === */}
      {appMode === "schedule" && (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 sm:px-6">
          <ContentSchedule />
        </main>
      )}

      {/* === PROJECTS VIEW === */}
      {appMode === "projects" && (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-8 sm:px-6">
          <ProjectsView
            drafts={draftList}
            activeDraftId={activeDraftId}
            draftLimit={userPlan.draftLimit}
            planName={userPlan.config.displayName}
            onContinue={handleContinueProject}
            onDelete={handleDeleteDraft}
            onNewProject={handleNewDraft}
            onRename={handleRenameDraft}
          />
        </main>
      )}

      {/* === CREATE VIEW === */}
      {appMode === "create" && (
        <>
      {/* Step indicator */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <StepIndicator currentStep={step} onStepClick={handleStepClick} />
      </div>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 sm:px-6">
        {/* Trial status banner */}
        <TrialBanner />

        {/* Admin viewing as standard user indicator */}
        <AdminViewBanner />

        <AnimatePresence mode="wait" custom={direction}>
          {step === "upload" && (
            <motion.div
              key="upload"
              custom={direction}
              variants={stepTransitionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                className="mx-auto max-w-4xl"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-6" variants={staggerItemVariants}>
                  <h2 className="text-xl font-semibold">Upload Your Photos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by uploading the photos you want to transform into a
                    nostalgic carousel. The more photos you provide, the more
                    authentic your carousel will feel.
                  </p>
                </motion.div>
                {/* Onboarding guide for first-time users */}
                {showOnboarding && draftList.length === 0 && (
                  <motion.div variants={staggerItemVariants}>
                    <EmptyStateGuide onDismiss={() => setShowOnboarding(false)} />
                  </motion.div>
                )}

                {/* Multi-draft list (when user has drafts) */}
                {draftList.length > 0 && (
                  <motion.div variants={staggerItemVariants}>
                    <DraftListPanel
                      drafts={draftList}
                      activeDraftId={activeDraftId}
                      draftLimit={userPlan.draftLimit}
                      planName={userPlan.config.displayName}
                      onResume={handleSwitchDraft}
                      onDelete={handleDeleteDraft}
                      onNewDraft={handleNewDraft}
                      onRename={handleRenameDraft}
                    />
                  </motion.div>
                )}

                {/* Legacy single-draft card (fallback for un-migrated state) */}
                {draftList.length === 0 && !showOnboarding && (
                  <motion.div variants={staggerItemVariants}>
                    <SavedDraftCard
                      onResume={handleResumeDraft}
                      onDiscard={handleDiscardDraft}
                    />
                  </motion.div>
                )}
                <motion.div variants={staggerItemVariants}>
                  <ImageUploader
                    onComplete={handleUploadComplete}
                    postMode={project.postMode ?? "carousel"}
                    onPostModeChange={handlePostModeChange}
                    existingImages={project.uploadedImages.length > 0 ? project.uploadedImages : undefined}
                    headlineMode={
                      project.globalOverlayStyle?.headlineMode ??
                      (project.globalOverlayStyle?.showHeadline === false ? "none" : "all")
                    }
                    onHeadlineModeChange={handleHeadlineModeChange}
                    slideCount={project.slideCount}
                    onSlideCountChange={handleSlideCountChange}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === "configure" && (
            <motion.div
              key="configure"
              custom={direction}
              variants={stepTransitionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                className="mx-auto max-w-4xl"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-6" variants={staggerItemVariants}>
                  <h2 className="text-xl font-semibold">
                    {(project.postMode ?? "carousel") === "single" ? "Craft Your Post" : "Craft Your Carousel"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set your theme, choose a vintage camera style, and customize
                    your {(project.postMode ?? "carousel") === "single" ? "post" : "carousel"} settings.
                  </p>
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <ConfigurationPanel
                    project={project}
                    onUpdate={handleProjectUpdate}
                    onGenerate={handleGenerate}
                    onCancelGenerate={cancelGeneration}
                    onContinue={handleContinueToEdit}
                    onBack={handleBack}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === "edit" && (
            <motion.div
              key="edit"
              custom={direction}
              variants={stepTransitionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <TextEditPanel
                project={project}
                onEdit={handleProjectUpdate}
                onNext={handleEditComplete}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              custom={direction}
              variants={stepTransitionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-6" variants={staggerItemVariants}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Finalize Your Post</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add audio, preview your slides, and prepare for publishing.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={handlePublish}
                        className="gap-2"
                        disabled={!project.slides.some(s => s.status === "ready")}
                      >
                        <Send className="h-4 w-4" />
                        Publish
                      </Button>
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <AudioPanel
                    audioClip={project.audioClip}
                    onAudioChange={handleAudioChange}
                    slideCount={project.slides.filter(s => s.status === "ready").length}
                  />
                </motion.div>

                {/* View toggle: Grid / Timeline */}
                <motion.div variants={staggerItemVariants} className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex gap-0 rounded-full border border-muted-foreground/20 bg-transparent p-0.5">
                      <button
                        type="button"
                        onClick={() => setReviewView("grid")}
                        className={cn(
                          "rounded-full px-5 py-2 text-sm font-medium transition-all",
                          reviewView === "grid"
                            ? "bg-purple-500 text-white"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewView("timeline")}
                        className={cn(
                          "rounded-full px-5 py-2 text-sm font-medium transition-all",
                          reviewView === "timeline"
                            ? "bg-purple-500 text-white"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Timeline
                      </button>
                    </div>
                  </div>

                  {reviewView === "grid" ? (
                    <CarouselPreview
                      project={project}
                      onEdit={handleProjectUpdate}
                      onBack={handleBack}
                    />
                  ) : (
                    <StoryboardPreview
                      project={project}
                      onVideoSettingsChange={handleVideoSettingsChange}
                      onClearAudio={() => handleAudioChange(undefined)}
                      onSlideDurationChange={handleSlideDurationChange}
                    />
                  )}

                  {/* Navigation buttons for timeline view */}
                  {reviewView === "timeline" && (
                    <div className="flex justify-between mt-4">
                      <Button variant="ghost" size="sm" onClick={handleBack}>
                        &larr; Back
                      </Button>
                      <Button
                        onClick={handlePublish}
                        className="gap-2"
                      >
                        Continue to Publish
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === "publish" && (
            <motion.div
              key="publish"
              custom={direction}
              variants={stepTransitionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="mx-auto max-w-4xl">
                <PublishPanel project={project} onComplete={handleComplete} onBack={handleBack} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
        </>
      )}

      {/* Footer */}
      <Footer
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
    </div>
    </>
      </Onborda>
    </OnbordaProvider>
    </TourContext.Provider>
  );
}
