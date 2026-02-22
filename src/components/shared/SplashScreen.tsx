"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Camera,
  Sparkles,
  Share2,
  ImagePlus,
  Palette,
  Calendar,
  Layers,
  ArrowDown,
  Play,
  Shield,
  FileText,
  Database,
  BookOpen,
  HelpCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
import { springGentle } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { isClerkEnabled } from "@/hooks/useClerkAuth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUOTES = [
  { text: "Every image tells a story. Make yours unforgettable.", author: null },
  { text: "Creativity takes courage.", author: "Henri Matisse" },
  { text: "Design is intelligence made visible.", author: "Alina Wheeler" },
  { text: "Every picture is a world.", author: "Hans Christian Andersen" },
  { text: "Vision is the art of seeing what is invisible to others.", author: "Jonathan Swift" },
  { text: "A photograph is a secret about a secret.", author: "Diane Arbus" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { text: "Light makes photography. Embrace light.", author: "George Eastman" },
  { text: "To me, photography is an art of observation.", author: "Elliott Erwitt" },
  { text: "The best stories are lived before they are told.", author: null },
  { text: "Create with the heart; build with the mind.", author: "Criss Jami" },
  { text: "In photography there is a reality so subtle that it becomes more real than reality.", author: "Alfred Stieglitz" },
];

const WORKFLOW_STEPS = [
  {
    icon: ImagePlus,
    title: "Upload Your Photos",
    description: "Drag and drop your best shots. Support for JPEG, PNG, WebP and HEIC up to 10 images.",
    accent: "from-violet-500 to-purple-600",
    glow: "violet",
  },
  {
    icon: Palette,
    title: "Style with Vintage Cameras",
    description: "Choose from 10 iconic camera profiles and 9 retro film filters. Koda writes your captions.",
    accent: "from-fuchsia-500 to-pink-600",
    glow: "fuchsia",
  },
  {
    icon: Share2,
    title: "Publish Everywhere",
    description: "Export for Instagram, TikTok, LinkedIn, YouTube, Reddit and more. One click, every platform.",
    accent: "from-amber-500 to-orange-600",
    glow: "amber",
  },
];

const FEATURES = [
  {
    icon: Camera,
    title: "Vintage Camera Profiles",
    description: "Sony Mavica, Polaroid 600, Kodak EasyShare and 7 more iconic cameras recreated in code.",
    span: "md:col-span-2",
    style: "card" as const,
  },
  {
    icon: Sparkles,
    title: "AI-Powered Captions",
    description: "Koda analyzes your photos and generates scroll-stopping text overlays that feel authentically you.",
    span: "",
    style: "accent" as const,
  },
  {
    icon: Layers,
    title: "Retro Film Filters",
    description: "1977, Earlybird, Lo-Fi, Nashville and more. Every pixel processed to feel like it came from film.",
    span: "",
    style: "card" as const,
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description: "Schedule your carousels, track your creative output, and stay consistent without the burnout.",
    span: "md:col-span-2",
    style: "dark" as const,
  },
];

const SESSION_KEY = "kodapost:splash-shown";

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SplashScreenProps {
  onComplete: () => void;
  forceShow?: boolean;
  onGetStarted?: (dismiss: () => void) => void;
  onOpenTour?: () => void;
}

export function SplashScreen({
  onComplete,
  forceShow = false,
  onGetStarted,
  onOpenTour,
}: SplashScreenProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax for hero orbs based on scroll
  const { scrollY } = useScroll({ container: containerRef });
  const orbY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    router.prefetch("/introduction");
  }, [router]);

  useEffect(() => {
    if (!forceShow) {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) {
          setVisible(false);
          onComplete();
          return;
        }
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // sessionStorage unavailable
      }
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  const handleDismiss = () => setVisible(false);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted(handleDismiss);
    } else {
      handleDismiss();
    }
  };

  const handleTour = () => {
    setVisible(false);
    onOpenTour?.();
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          ref={containerRef}
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden"
        >
          {/* ================================================================
              STICKY NAV BAR
              ================================================================ */}
          <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3.5">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/[0.06]">
                  <KodaPostIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold tracking-tight text-white">KodaPost</span>
              </div>

              {/* Nav links — hidden on mobile */}
              <nav className="hidden md:flex items-center gap-8">
                {[
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "/billing" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith("#")) {
                        e.preventDefault();
                        containerRef.current
                          ?.querySelector(link.href)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Auth / CTA */}
              <div className="flex items-center gap-3">
                {isClerkEnabled ? (
                  <>
                    <Link
                      href="/sign-in"
                      className="hidden sm:inline-flex text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
                    >
                      Log In
                    </Link>
                    <Button
                      size="sm"
                      asChild
                      className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:from-purple-500 hover:to-fuchsia-500 transition-all duration-200"
                    >
                      <Link href="/sign-up">Sign Up</Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGetStarted}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:from-purple-500 hover:to-fuchsia-500 transition-all duration-200"
                  >
                    Launch App
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* ================================================================
              HERO SECTION
              ================================================================ */}
          <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Dark gradient base */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

            {/* Dot grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Animated orbs — parallax on scroll */}
            <motion.div className="absolute inset-0 overflow-hidden" style={{ y: orbY, opacity: heroOpacity }}>
              <motion.div
                initial={{ x: "-10%", y: "-5%", opacity: 0 }}
                animate={{ x: ["-10%", "10%", "-10%"], y: ["-5%", "8%", "-5%"], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1/4 top-1/4 h-[60vh] w-[60vh] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(270 70% 55% / 0.6) 0%, transparent 65%)", filter: "blur(40px)" }}
              />
              <motion.div
                initial={{ x: "10%", y: "5%", opacity: 0 }}
                animate={{ x: ["10%", "-15%", "10%"], y: ["5%", "-10%", "5%"], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-1/4 top-1/3 h-[50vh] w-[50vh] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(210 90% 55% / 0.5) 0%, transparent 65%)", filter: "blur(45px)" }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 left-1/2 h-[35vh] w-[35vh] -translate-x-1/2 rounded-full"
                style={{ background: "radial-gradient(circle, hsl(280 70% 55% / 0.5) 0%, transparent 65%)", filter: "blur(30px)" }}
              />
              <motion.div
                initial={{ x: "5%", y: "-8%", opacity: 0 }}
                animate={{ x: ["5%", "-10%", "5%"], y: ["-8%", "5%", "-8%"], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-1/3 top-1/4 h-[35vh] w-[35vh] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(30 95% 55% / 0.45) 0%, transparent 65%)", filter: "blur(35px)" }}
              />
              <motion.div
                initial={{ x: "-5%", y: "5%", opacity: 0 }}
                animate={{ x: ["-5%", "12%", "-5%"], y: ["5%", "-8%", "5%"], opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 left-1/4 h-[30vh] w-[30vh] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(175 80% 50% / 0.4) 0%, transparent 65%)", filter: "blur(30px)" }}
              />
            </motion.div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotate: -15 }}
              animate={{ opacity: 1, x: 0, rotate: -12 }}
              transition={{ delay: 1.6, duration: 0.6, ease: "easeOut" }}
              className="absolute top-[22%] left-[8%] hidden lg:block pointer-events-none select-none"
            >
              <div className="bg-purple-500/20 border border-purple-400/30 text-purple-300 px-4 py-2 rounded-full font-semibold text-sm backdrop-blur-sm">
                No Algorithms
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 8 }}
              transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
              className="absolute top-[30%] right-[8%] hidden lg:block pointer-events-none select-none"
            >
              <div className="bg-amber-500/20 border border-amber-400/30 text-amber-300 px-4 py-2 rounded-full font-semibold text-sm backdrop-blur-sm">
                Verified Indie
              </div>
            </motion.div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-4xl mx-auto">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springGentle, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-2xl"
              >
                <KodaPostIcon className="h-8 w-8 text-white" />
              </motion.div>

              {/* Brand */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  Your Photos.{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-amber-400">
                    Your Story.
                  </span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                className="max-w-lg text-base sm:text-lg leading-relaxed text-white/50"
              >
                Transform personal photos into stunning nostalgic carousels with vintage camera styles, film filters, and AI-generated text.
              </motion.p>

              {/* Quote */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                className="max-w-md"
              >
                <p
                  className="text-lg sm:text-xl font-semibold leading-relaxed text-white/80"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  &ldquo;{quote.text}&rdquo;
                </p>
                {quote.author && (
                  <p className="mt-2 text-xs font-medium text-white/40">
                    &mdash; {quote.author}
                  </p>
                )}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4, ease: "easeOut" }}
                className="mt-4 flex flex-col items-center gap-5"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {isClerkEnabled ? (
                    <>
                      <Button
                        size="lg"
                        asChild
                        className="rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-10 py-6 text-base font-semibold text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                      >
                        <Link href="/sign-up">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Get Started Free
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="rounded-full border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                      >
                        <Link href="/sign-in">
                          <LogIn className="mr-2 h-4 w-4" />
                          Log In
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-10 py-6 text-base font-semibold text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                      >
                        Get Started
                      </Button>
                      {onOpenTour && (
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={handleTour}
                          className="rounded-full border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Quick Tour
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {/* Tour link — always available below main CTAs */}
                {isClerkEnabled && onOpenTour && (
                  <button
                    type="button"
                    onClick={handleTour}
                    className="text-sm text-white/35 hover:text-white/70 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3" />
                    Take a quick tour first
                  </button>
                )}
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.8 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-[11px] uppercase tracking-widest text-white/30 font-medium">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown className="h-4 w-4 text-white/30" />
              </motion.div>
            </motion.div>
          </section>

          {/* ================================================================
              HOW IT WORKS — 3-step workflow
              ================================================================ */}
          <section id="how-it-works" className="relative py-28 px-6 bg-gradient-to-b from-black via-zinc-950 to-zinc-900 scroll-mt-16">
            <div className="max-w-5xl mx-auto">
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="text-center mb-16"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  How It Works
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  From Photos to Feed.{" "}
                  <span className="text-white/40">In Minutes.</span>
                </h2>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {WORKFLOW_STEPS.map((step, i) => (
                  <motion.div
                    key={step.title}
                    variants={staggerChild}
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm overflow-hidden hover:border-white/10 transition-colors duration-500"
                  >
                    {/* Glow on hover */}
                    <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-${step.glow}-500/0 group-hover:bg-${step.glow}-500/10 blur-3xl transition-all duration-700`} />

                    <div className="relative z-10">
                      {/* Step number */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-lg`}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                          Step {i + 1}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-white/45">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              FEATURES — Bento Grid
              ================================================================ */}
          <section id="features" className="relative py-28 px-6 bg-zinc-900 scroll-mt-16">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-0" />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="mb-14"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Camera className="h-7 w-7 text-purple-400" />
                  The Creative Toolkit
                </h2>
                <p className="mt-3 text-white/40 max-w-lg">
                  Everything you need to turn everyday photos into scroll-stopping content.
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {FEATURES.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={staggerChild}
                    className={`${feature.span} relative rounded-2xl overflow-hidden transition-all duration-500 group ${
                      feature.style === "accent"
                        ? "bg-gradient-to-br from-purple-600 to-fuchsia-700 p-8 text-white"
                        : feature.style === "dark"
                        ? "bg-zinc-800/80 border border-white/[0.06] p-8"
                        : "bg-white/[0.03] border border-white/[0.06] p-8 hover:border-white/10"
                    }`}
                  >
                    {feature.style !== "accent" && (
                      <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-purple-500/0 group-hover:bg-purple-500/5 rounded-full blur-3xl transition-all duration-700" />
                    )}
                    <div className="relative z-10">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${
                        feature.style === "accent"
                          ? "bg-white/20 text-white"
                          : "bg-purple-500/10 text-purple-400"
                      }`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${
                        feature.style === "accent" ? "text-white" : "text-white"
                      }`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        feature.style === "accent" ? "text-white/80" : "text-white/40"
                      }`}>
                        {feature.description}
                      </p>
                    </div>

                    {/* Decorative icon ghost */}
                    {feature.style !== "accent" && (
                      <div className="absolute top-6 right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <feature.icon className="h-16 w-16" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              CTA SECTION
              ================================================================ */}
          <section className="relative py-32 px-6 bg-gradient-to-b from-zinc-900 to-black">
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="relative rounded-[2rem] border border-white/[0.06] bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-amber-500/10 p-12 sm:p-16 backdrop-blur-xl overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] -z-0" />

                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                    Ready to create something{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">
                      beautiful
                    </span>
                    ?
                  </h2>
                  <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                    Join creators building stunning visual stories with vintage soul and modern tools.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {isClerkEnabled ? (
                      <>
                        <Button
                          size="lg"
                          asChild
                          className="rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-10 py-6 text-base font-semibold text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                        >
                          <Link href="/sign-up">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Get Started Free
                          </Link>
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          asChild
                          className="rounded-full border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                        >
                          <Link href="/sign-in">
                            <LogIn className="mr-2 h-4 w-4" />
                            Log In
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          onClick={handleGetStarted}
                          className="rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-10 py-6 text-base font-semibold text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                        >
                          Get Started Free
                        </Button>
                        {onOpenTour && (
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={handleTour}
                            className="rounded-full border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Quick Tour
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ================================================================
              FOOTER
              ================================================================ */}
          <footer className="border-t border-white/[0.06] py-16 px-6 bg-black">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {/* Brand & description */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/[0.06]">
                      <KodaPostIcon className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-white/80">KodaPost</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/30 max-w-sm mb-6">
                    Transform your everyday photos into stunning nostalgic social media carousels. Vintage camera styles, retro film filters, and AI-powered text overlays &mdash; designed for creators who value authenticity over algorithms.
                  </p>
                </div>

                {/* Product links */}
                <div>
                  <h4 className="text-sm font-semibold text-white/60 mb-4">Product</h4>
                  <ul className="space-y-2.5">
                    <li>
                      <a
                        href="#how-it-works"
                        onClick={(e) => {
                          e.preventDefault();
                          containerRef.current
                            ?.querySelector("#how-it-works")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a
                        href="#features"
                        onClick={(e) => {
                          e.preventDefault();
                          containerRef.current
                            ?.querySelector("#features")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Features
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/guide"
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        User Guide
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/support"
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Support
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal links */}
                <div>
                  <h4 className="text-sm font-semibold text-white/60 mb-4">Legal</h4>
                  <ul className="space-y-2.5">
                    <li>
                      <Link
                        href="/legal/privacy"
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/legal/terms"
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Terms of Use
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/legal/data"
                        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Database className="h-3.5 w-3.5" />
                        Data Policy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-white/20">
                  &copy; {new Date().getFullYear()} KodaPost. All rights reserved.
                </p>
                <p className="text-xs text-white/15">
                  Built for creators who refuse to compromise.
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
