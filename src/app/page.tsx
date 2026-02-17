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
import { AssistantBanner, isAssistantEnabled, setAssistantPreference } from "@/components/shared/AssistantBanner";
import { AssistantChat } from "@/components/assistant/AssistantChat";
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
import { computeConfigHash } from "@/lib/utils";
import type { CarouselProject, UploadedImage } from "@/lib/types";

type Step = "upload" | "configure" | "edit" | "review" | "publish";

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
  const [assistantMode, setAssistantMode] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const saved = loadProject();
    const savedStep = loadStep();
    const savedName = loadProjectName();
    if (saved) {
      setProject(saved);
      // If the saved step requires images but they were stripped from storage,
      // reset to upload step so the user re-uploads
      const hasImages = saved.uploadedImages.some((img) => img.url.length > 0);
      if (!hasImages && savedStep !== "upload") {
        setStep("upload");
      } else {
        setStep(savedStep);
      }

      // Show resume prompt if project has a name — skip splash
      if (savedName && savedStep !== "upload") {
        setSplashDismissed(true);
        setTimeout(() => {
          toast.info(`Resume "${savedName}"?`, {
            description: "You have a saved project from a previous session.",
            duration: 8000,
            action: {
              label: "Start Fresh",
              onClick: () => {
                clearProject();
                setProject(createEmptyProject());
                setDirection(-1);
                setStep("upload");
              },
            },
          });
        }, 500);
      }
    } else {
      setStep(savedStep);
    }
    // Check if assistant mode was previously enabled
    if (isAssistantEnabled()) {
      setAssistantMode(true);
    }

    setHydrated(true);
  }, []);

  // Auto-dismiss splash for signed-in users returning from auth
  useEffect(() => {
    if (authLoaded && isSignedIn && !splashDismissed && hydrated) {
      setSplashDismissed(true);
    }
  }, [authLoaded, isSignedIn, splashDismissed, hydrated]);

  // Auto-save project and step on changes
  useEffect(() => {
    if (!hydrated) return;
    saveProject(project);
    saveStep(step);
  }, [project, step, hydrated]);

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
      setProject((prev) => ({
        ...prev,
        uploadedImages: images,
      }));
      navigateToStep("configure");
      toast.success("Photos uploaded", {
        description: `${images.length} image${images.length !== 1 ? "s" : ""} ready for your carousel.`,
      });
    },
    [navigateToStep]
  );

  const handleProjectUpdate = useCallback((updated: CarouselProject) => {
    setProject(updated);
  }, []);

  const handleGenerate = useCallback(async () => {
    const result = await generateCarousel(project);

    if (!result.success) {
      toast.error("Generation failed", {
        description: result.error,
      });
      return;
    }

    const data = result.data;
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
      toast.success("Carousel generated", {
        description: `${readySlides} slides created successfully.`,
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

  const handleEnableAssistant = useCallback(() => {
    setAssistantMode(true);
    setAssistantPreference(true);
    toast.success("Assistant Mode enabled", {
      description: "Send photos, audio, or text to create carousels.",
    });
  }, []);

  const handleToggleAssistant = useCallback(() => {
    const next = !assistantMode;
    setAssistantMode(next);
    setAssistantPreference(next);
    toast.info(next ? "Switched to Assistant Mode" : "Switched to Manual Mode");
  }, [assistantMode]);

  const handleAssistantApprove = useCallback(
    (generatedProject: CarouselProject) => {
      setProject(generatedProject);
      setAssistantMode(false);
      navigateToStep("publish");
      toast.success("Carousel approved! Ready to publish.");
    },
    [navigateToStep]
  );

  const handleAssistantEdit = useCallback(
    (generatedProject: CarouselProject) => {
      setProject(generatedProject);
      setAssistantMode(false);
      navigateToStep("edit");
      toast.info("Switching to editor for fine-tuning.");
    },
    [navigateToStep]
  );

  const handleResetApp = useCallback(() => {
    clearAllStorage();
    setProject(createEmptyProject());
    setDirection(-1);
    setStep("upload");
    setSplashForced(false);
    setSplashDismissed(false);
    toast.success("App reset", {
      description: "All data cleared. Starting fresh as a new user.",
    });
  }, []);

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
            <motion.div whileTap={buttonTapScale}>
              <SaveProjectButton project={project} />
            </motion.div>
          )}
          {/* Consolidated menu: theme toggle + help/profile/settings */}
          <HeaderMenu
            onOpenHelp={() => setHelpOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onResetApp={handleResetApp}
            assistantMode={assistantMode}
            onToggleAssistant={handleToggleAssistant}
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

      {/* Step indicator — hidden in assistant mode */}
      {!assistantMode && (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <StepIndicator currentStep={step} onStepClick={handleStepClick} />
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 sm:px-6">
        {/* Auth guard — redirect unauthenticated users who bypassed splash */}
        {splashDismissed && authLoaded && !isSignedIn && isClerkEnabled && (
          <AuthRedirect />
        )}

        {/* Assistant banner — shown when preference not yet set */}
        {!assistantMode && (
          <AssistantBanner onEnable={handleEnableAssistant} />
        )}

        {/* Assistant mode: chat interface */}
        {assistantMode ? (
          <AssistantChat
            onApproveToPublish={handleAssistantApprove}
            onEditCarousel={handleAssistantEdit}
          />
        ) : (
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
                  <h2 className="text-xl font-semibold">Configure Your Carousel</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set your theme, choose a vintage camera style, and customize
                    your carousel settings.
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
                  <h2 className="text-xl font-semibold">Review Your Carousel</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Preview your slides, reorder, and export your carousel.
                  </p>
                </motion.div>
                <motion.div variants={staggerItemVariants}>
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
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
    </div>
  );
}
