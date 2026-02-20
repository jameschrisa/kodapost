"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KodaPostIcon } from "@/components/icons";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { AnimatePresence, motion } from "framer-motion";
import { SaveProjectButton } from "@/components/shared/SaveProjectButton";
import { HeaderMenu } from "@/components/shared/HeaderMenu";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { SettingsDialog } from "@/components/shared/SettingsDialog";
import { HelpDialog } from "@/components/shared/HelpDialog";
import { ProfileDialog } from "@/components/shared/ProfileDialog";
import { Footer } from "@/components/shared/Footer";
import { AssistantBanner } from "@/components/shared/AssistantBanner";
import { ContentBotPanel } from "@/components/shared/ContentBotPanel";
import { TrialBanner } from "@/components/shared/TrialBanner";
import { AdminViewBanner } from "@/components/shared/AdminViewBanner";
import { StepIndicator } from "@/components/builder/StepIndicator";
import { ImageUploader } from "@/components/builder/ImageUploader";
import { ConfigurationPanel } from "@/components/builder/ConfigurationPanel";
import { CarouselPreview } from "@/components/builder/CarouselPreview";
import { TextEditPanel } from "@/components/builder/TextEditPanel";
import { PublishPanel } from "@/components/builder/PublishPanel";
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
import { ContentSchedule } from "@/components/history/ContentSchedule";
import { AudioPanel } from "@/components/audio";
import { SavedDraftCard } from "@/components/shared/SavedDraftCard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AudioClip, CarouselProject, UploadedImage } from "@/lib/types";

type Step = "upload" | "configure" | "edit" | "review" | "publish";
type AppMode = "create" | "schedule";

const STEP_ORDER: Step[] = ["upload", "configure", "edit", "review", "publish"];

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
      toast.error(`${displayName} connection failed`, {
        description:
          error === "access_denied"
            ? "You declined the authorization request."
            : `Error: ${error}`,
      });
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [splashForced, setSplashForced] = useState(false);
  const [contentBotOpen, setContentBotOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("create");

  // Prefetch key routes so navigation feels instant
  useEffect(() => {
    router.prefetch("/introduction");
    router.prefetch("/sign-in");
    router.prefetch("/sign-up");
  }, [router]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const saved = loadProject();
    const savedStep = loadStep();
    const savedName = loadProjectName();
    if (saved) {
      setProject(saved);
      // If the saved step requires images but they were stripped from storage,
      // reset to upload step so the user re-uploads.
      // The SavedDraftCard on the upload step lets them resume from there.
      const hasImages = saved.uploadedImages.some((img) => img.url.length > 0);
      if (!hasImages && savedStep !== "upload") {
        setStep("upload");
      } else {
        setStep(savedStep);
      }

      // Skip splash for returning users with a named project
      if (savedName && savedStep !== "upload") {
        setSplashDismissed(true);
      }
    } else {
      setStep(savedStep);
    }

    setHydrated(true);
  }, []);

  // Auto-dismiss splash for signed-in users returning from auth (initial load only).
  // Uses a ref to ensure this only fires once and doesn't interfere with
  // user-triggered splash (brand click, Start Fresh).
  const initialAuthCheckDone = useRef(false);
  useEffect(() => {
    if (!hydrated || !authLoaded || initialAuthCheckDone.current) return;
    initialAuthCheckDone.current = true;
    if (isSignedIn && !splashDismissed) {
      setSplashDismissed(true);
    }
  }, [hydrated, authLoaded, isSignedIn, splashDismissed]);

  // Auto-save project and step on changes
  const [lastSavedAt, setLastSavedAt] = useState<number>(0);
  useEffect(() => {
    if (!hydrated) return;
    saveProject(project);
    saveStep(step);
    setLastSavedAt(Date.now());
  }, [project, step, hydrated]);

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
    (images: UploadedImage[]) => {
      const isSingle = images.length === 1;
      setProject((prev) => ({
        ...prev,
        uploadedImages: images,
        // Auto-set post mode based on image count
        postMode: isSingle ? "single" : prev.postMode,
        // Default slide count to number of uploaded images (clamped 2-12), user can override
        slideCount: isSingle ? 1 : Math.max(2, Math.min(12, images.length)),
      }));
      navigateToStep("configure");
      toast.success(
        isSingle ? "Photo uploaded" : "Photos uploaded",
        {
          description: isSingle
            ? "1 image ready. Post type set to Single Post."
            : `${images.length} images ready for your carousel.`,
        }
      );
    },
    [navigateToStep]
  );

  const handleProjectUpdate = useCallback((updated: CarouselProject) => {
    setProject(updated);
  }, []);

  const handleAudioChange = useCallback((clip: AudioClip | undefined) => {
    setProject((prev) => ({ ...prev, audioClip: clip }));
  }, []);

  const handleGenerate = useCallback(async () => {
    let result: Awaited<ReturnType<typeof generateCarousel>>;
    try {
      result = await generateCarousel(project);
    } catch (err) {
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
      return;
    }

    if (!result || !result.success) {
      toast.error("Generation failed", {
        description: result?.error ?? "Server returned an empty response. Check your API key and try again.",
      });
      return;
    }

    const data = result.data;

    // Restore original uploadedImages (server strips base64 data to stay
    // within Vercel's response size limit — client already has them).
    data.uploadedImages = project.uploadedImages;

    // Restore image URLs on slides that reference uploaded images
    for (const slide of data.slides) {
      if (slide.metadata?.source === "user_upload" && slide.metadata.referenceImage) {
        const uploaded = project.uploadedImages.find(
          (img) => img.id === slide.metadata!.referenceImage
        );
        if (uploaded) {
          slide.imageUrl = uploaded.url;
        }
      }
    }

    const errorSlides = data.slides.filter((s) => s.status === "error").length;
    const readySlides = data.slides.filter((s) => s.status === "ready").length;

    const hash = computeConfigHash(project);
    setProject({ ...data, lastGeneratedConfigHash: hash });
    navigateToStep("edit");

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
  }, [project, navigateToStep]);

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
    setProject(createEmptyProject());
    setDirection(-1);
    setStep("upload");
    toast.success("New project started", {
      description: "Your previous carousel has been cleared.",
    });
  }, []);

  /** Resume a saved draft — project is already hydrated, just navigate to the right step */
  const handleResumeDraft = useCallback(() => {
    const savedStep = loadStep();
    const hasImages = project.uploadedImages.some((img) => img.url.length > 0);

    if (!hasImages && savedStep !== "upload") {
      // Images were stripped from storage — stay on upload but confirm settings are kept
      toast.info("Project settings restored", {
        description: "Re-upload your photos to continue where you left off.",
        duration: 5000,
      });
    } else if (savedStep === "upload" && !hasImages) {
      // Was on upload with no images — just confirm
      toast.info("Project restored", {
        description: "Upload your photos to get started.",
        duration: 3000,
      });
    } else {
      // Has images — navigate to saved step
      navigateToStep(savedStep);
    }
  }, [navigateToStep, project.uploadedImages]);

  const handleDiscardDraft = useCallback(() => {
    setProject(createEmptyProject());
    toast.info("Draft discarded");
  }, []);

  const handleBrandClick = useCallback(() => {
    setSplashForced(true);
    setSplashDismissed(false);
  }, []);

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
    clearAllStorage();
    setProject(createEmptyProject());
    setDirection(-1);
    setStep("upload");
    setSplashForced(true);
    setSplashDismissed(false);
    toast.success("App reset", {
      description: "All data cleared. Starting fresh as a new user.",
    });
  }, []);

  // -- Keyboard shortcuts --
  const handleSaveShortcut = useCallback(() => {
    if (step === "configure" || step === "edit") {
      const name = project.projectName || loadProjectName() || "Untitled Project";
      saveProject({ ...project, projectName: name });
      saveProjectName(name);
      toast.success("Project saved", { duration: 2000 });
    }
  }, [step, project]);

  useKeyboardShortcuts({
    onSave: handleSaveShortcut,
    onEscape: step !== "upload" ? handleBack : undefined,
  });

  // Don't render until hydrated to avoid mismatch
  if (!hydrated) {
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Splash Screen */}
      {!splashDismissed && (
        <SplashScreen
          forceShow={splashForced}
          onComplete={() => {
            setSplashDismissed(true);
            setSplashForced(false);
          }}
          onGetStarted={handleGetStarted}
        />
      )}

      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show start screen"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KodaPostIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold leading-tight">KodaPost</h1>
              <p className="text-xs text-muted-foreground">
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
            onOpenContentBot={() => setContentBotOpen(true)}
            onResetApp={handleResetApp}
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
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ContentBotPanel open={contentBotOpen} onOpenChange={setContentBotOpen} />

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

      {/* Auth guard — redirect unauthenticated users who bypassed splash */}
      {splashDismissed && authLoaded && !isSignedIn && isClerkEnabled && (
        <AuthRedirect />
      )}

      {/* === CONTENT SCHEDULE VIEW === */}
      {appMode === "schedule" && (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 sm:px-6">
          <ContentSchedule />
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
        {/* Assistant banner — shown when preference not yet set */}
        <AssistantBanner />

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
                className="mx-auto max-w-2xl"
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
                <motion.div variants={staggerItemVariants}>
                  <SavedDraftCard
                    onResume={handleResumeDraft}
                    onDiscard={handleDiscardDraft}
                  />
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <ImageUploader onComplete={handleUploadComplete} />
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
                className="mx-auto max-w-2xl"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-6" variants={staggerItemVariants}>
                  <h2 className="text-xl font-semibold">
                    {(project.postMode ?? "carousel") === "single" ? "Setup Your Post" : "Setup Your Carousel"}
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
                  <h2 className="text-xl font-semibold">Finalize Your Post</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add audio, preview your slides, and prepare for publishing.
                  </p>
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <AudioPanel
                    audioClip={project.audioClip}
                    onAudioChange={handleAudioChange}
                  />
                </motion.div>
                <motion.div variants={staggerItemVariants} className="mt-4">
                  <CarouselPreview
                    project={project}
                    onEdit={handleProjectUpdate}
                    onPublish={handlePublish}
                    onBack={handleBack}
                  />
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
              <div className="mx-auto max-w-2xl">
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
  );
}
