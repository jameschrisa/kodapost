"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Camera,
  ChevronDown,
  Clock,
  Sparkles,
  Share2,
  ImagePlus,
  Palette,
  Calendar,
  Layers,
  ArrowDown,
  Play,
  Smartphone,
  Shield,
  FileText,
  Database,
  BookOpen,
  HelpCircle,
  Music,
  LayoutTemplate,
  Radio,
  Users,
  Menu,
  X,
} from "lucide-react";
import { IconBrandTelegram } from "@tabler/icons-react";
import { KodaPostIcon, UserHexagonIcon } from "@/components/icons";
import { springGentle } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { isClerkEnabled, useClerkAuth } from "@/hooks/useClerkAuth";
import { useUserInfo } from "@/hooks/useUserInfo";

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
    description: "Choose from 10 iconic camera profiles and 9 retro film filters. KodaPost's AI writes your captions.",
    accent: "from-fuchsia-500 to-pink-600",
    glow: "fuchsia",
  },
  {
    icon: Share2,
    title: "Publish Everywhere",
    description: "Export for Instagram, TikTok, LinkedIn, YouTube Shorts, Reddit, and X. One click, every platform.",
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
    title: "AI Caption Writer",
    description: "Tell your story and KodaPost writes scroll-stopping captions and headlines that feel authentically you.",
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
    icon: Music,
    title: "Audio Clips",
    description: "Browse and add royalty-free music clips with allowable licensing for use in your reels and carousels.",
    span: "",
    style: "card" as const,
  },
  {
    icon: Radio,
    title: "Nano-Casts",
    description: "Turn your carousel into a short-form audio story. Record a voiceover or let KodaPost generate one for you.",
    span: "",
    style: "dark" as const,
  },
  {
    icon: LayoutTemplate,
    title: "Customizable Templates",
    description: "Start from beautifully designed carousel templates or build your own. Every element is fully customizable.",
    span: "md:col-span-2",
    style: "card" as const,
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description: "Schedule your social media carousels, track your creative output, and stay consistent without the burnout.",
    span: "",
    style: "dark" as const,
  },
];

const COLOR_CLASSES = {
  amber:   { glow: "bg-amber-500",   glowTouch: "bg-amber-500/5",   bg: "bg-amber-500/10",   text: "text-amber-400"   },
  violet:  { glow: "bg-violet-500",  glowTouch: "bg-violet-500/5",  bg: "bg-violet-500/10",  text: "text-violet-400"  },
  blue:    { glow: "bg-blue-500",    glowTouch: "bg-blue-500/5",    bg: "bg-blue-500/10",    text: "text-blue-400"    },
  emerald: { glow: "bg-emerald-500", glowTouch: "bg-emerald-500/5", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  fuchsia: { glow: "bg-fuchsia-500", glowTouch: "bg-fuchsia-500/5", bg: "bg-fuchsia-500/10", text: "text-fuchsia-400" },
  orange:  { glow: "bg-orange-500",  glowTouch: "bg-orange-500/5",  bg: "bg-orange-500/10",  text: "text-orange-400"  },
} as const;

type AccentColor = keyof typeof COLOR_CLASSES;

function glowClasses(color: AccentColor): string {
  const c = COLOR_CLASSES[color];
  return `${c.glowTouch} [@media(hover:hover)]:${c.glow}/0 [@media(hover:hover)]:group-hover:${c.glow}/10`;
}

const INDIE_CREATOR_CARDS: Array<{ icon: typeof Clock; title: string; description: string; color: AccentColor }> = [
  {
    icon: Clock,
    title: "Batch-Create a Week of Posts in One Sitting",
    description: "Upload product photos once, KodaPost generates a full week of on-brand carousels — styled, captioned, and ready to publish.",
    color: "amber",
  },
  {
    icon: Palette,
    title: "Consistent Brand Aesthetic Without a Designer",
    description: "Lock in camera profile, film filter, fonts, and color palette — every carousel matches your brand automatically.",
    color: "violet",
  },
  {
    icon: Share2,
    title: "Publish to Every Platform from One Tool",
    description: "Export optimized carousels for Instagram, TikTok, LinkedIn, YouTube Shorts, Reddit, and X — no reformatting required.",
    color: "blue",
  },
  {
    icon: Shield,
    title: "Professional Results on a Bootstrapped Budget",
    description: "Replace graphic designer, copywriter, and scheduling tool with one app. KodaPost does the heavy lifting so your budget goes further.",
    color: "emerald",
  },
  {
    icon: Sparkles,
    title: "AI Captions That Sound Like You, Not a Robot",
    description: "KodaPost writes scroll-stopping captions you edit and approve — no generic AI slop, just your voice amplified.",
    color: "fuchsia",
  },
  {
    icon: Camera,
    title: "Stand Out with a Vintage Aesthetic Nobody Else Has",
    description: "Retro film filters and vintage camera profiles give your brand a visual differentiator vs sterile Canva templates.",
    color: "orange",
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
  const { isSignedIn } = useClerkAuth();
  const userInfo = useUserInfo();
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [indieCardsExpanded, setIndieCardsExpanded] = useState(false);
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
        // Only skip the landing page via sessionStorage for signed-in users.
        // Unauthenticated visitors should always see the marketing site.
        if (isSignedIn && sessionStorage.getItem(SESSION_KEY)) {
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

  // Deterministic quote selection — rotates daily, avoids SSR/hydration mismatch flash.
  const [quote] = useState(() => QUOTES[new Date().getDate() % QUOTES.length]);

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
              {/* Brand — tap to scroll to top */}
              <button
                type="button"
                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2.5 cursor-pointer"
                aria-label="Scroll to top"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/[0.06]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="brand-gradient-nav" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" stroke="url(#brand-gradient-nav)" />
                    <line x1="8" y1="16" x2="16" y2="8" stroke="url(#brand-gradient-nav)" />
                    <line x1="10.5" y1="18" x2="18" y2="10.5" stroke="url(#brand-gradient-nav)" />
                  </svg>
                </div>
                <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500">KodaPost</span>
              </button>

              {/* Nav links — hidden on mobile */}
              <nav className="hidden md:flex items-center gap-8">
                {[
                  { label: "About", href: "/about", isPage: true },
                  { label: "Features", href: "#features", isPage: false },
                  { label: "Pricing", href: "/billing", isPage: true },
                ].map((link) =>
                  link.isPage ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        containerRef.current
                          ?.querySelector(link.href)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  )
                )}
              </nav>

              {/* Mobile menu toggle — visible below md */}
              <button
                type="button"
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Auth / CTA — hidden on mobile (moved into hamburger menu) */}
              <div className="hidden md:flex items-center gap-3">
                {isClerkEnabled && isSignedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={handleGetStarted}
                      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                    >
                      {userInfo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userInfo.imageUrl}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                          <UserHexagonIcon className="h-4 w-4" />
                        </div>
                      )}
                      <span className="hidden sm:inline pr-1 font-medium">
                        {userInfo.firstName || "Account"}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      onClick={handleGetStarted}
                      className="rounded-xl bg-orange-500 hover:bg-orange-400 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200"
                    >
                      Open App
                    </Button>
                  </>
                ) : isClerkEnabled ? (
                  <Button
                    size="sm"
                    asChild
                    className="rounded-xl bg-white/[0.08] hover:bg-white/[0.12] px-5 text-sm font-semibold text-white transition-all duration-200"
                  >
                    <Link href="/sign-in">Log In</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGetStarted}
                    className="rounded-xl bg-orange-500 hover:bg-orange-400 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200"
                  >
                    Launch App
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Mobile navigation menu — slide down on small screens */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="sticky top-[57px] z-40 overflow-hidden md:hidden border-b border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
              >
                <nav className="max-w-5xl mx-auto flex flex-col gap-1 px-6 py-4">
                  {[
                    { label: "About", href: "/about", isPage: true },
                    { label: "Features", href: "#features", isPage: false },
                    { label: "Pricing", href: "/billing", isPage: true },
                  ].map((link) =>
                    link.isPage ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          containerRef.current
                            ?.querySelector(link.href)
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="block rounded-lg px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        {link.label}
                      </a>
                    )
                  )}
                  {/* Auth CTA in mobile menu */}
                  <div className="mt-2 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                    {isClerkEnabled && isSignedIn ? (
                      <Button
                        size="lg"
                        onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/20"
                      >
                        Open App
                      </Button>
                    ) : isClerkEnabled ? (
                      <Button
                        size="lg"
                        asChild
                        className="w-full rounded-xl bg-white/[0.08] hover:bg-white/[0.12] py-3 text-base font-semibold text-white"
                      >
                        <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/20"
                      >
                        Launch App
                      </Button>
                    )}
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================================================================
              HERO SECTION
              ================================================================ */}
          <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Background image — positioned from top to show the subject */}
            <div
              className="absolute inset-0 bg-cover bg-top bg-no-repeat"
              style={{ backgroundImage: "url('/image_other/newbg.jpg?v=2')" }}
            />
            {/* Dark gradient overlay — keeps bottom dark for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-black" />

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
              {/* Hidden on mobile to reduce blur-filter jank on budget devices */}
              <motion.div
                initial={{ x: "5%", y: "-8%", opacity: 0 }}
                animate={{ x: ["5%", "-10%", "5%"], y: ["-8%", "5%", "-8%"], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-1/3 top-1/4 h-[35vh] w-[35vh] rounded-full hidden sm:block"
                style={{ background: "radial-gradient(circle, hsl(30 95% 55% / 0.45) 0%, transparent 65%)", filter: "blur(35px)" }}
              />
              <motion.div
                initial={{ x: "-5%", y: "5%", opacity: 0 }}
                animate={{ x: ["-5%", "12%", "-5%"], y: ["5%", "-8%", "5%"], opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 left-1/4 h-[30vh] w-[30vh] rounded-full hidden sm:block"
                style={{ background: "radial-gradient(circle, hsl(175 80% 50% / 0.4) 0%, transparent 65%)", filter: "blur(30px)" }}
              />
            </motion.div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotate: -15 }}
              animate={{ opacity: 1, x: 0, rotate: -12 }}
              transition={{ delay: 1.6, duration: 0.6, ease: "easeOut" }}
              className="absolute top-[22%] left-[6%] hidden lg:block pointer-events-none select-none"
            >
              <div className="bg-purple-500/20 border border-purple-400/30 text-purple-300 px-6 py-3 rounded-full font-bold text-base backdrop-blur-sm shadow-lg shadow-purple-500/10">
                AI Fortified
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 8 }}
              transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
              className="absolute top-[30%] right-[6%] hidden lg:block pointer-events-none select-none"
            >
              <div className="bg-amber-500/20 border border-amber-400/30 text-amber-300 px-6 py-3 rounded-full font-bold text-base backdrop-blur-sm shadow-lg shadow-amber-500/10">
                Verified Indie
              </div>
            </motion.div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-6 text-center max-w-4xl mx-auto">
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
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
                  Social Media that Feels{" "}
                  <br className="hidden sm:block" />
                  <span className="whitespace-nowrap">Like{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500">
                    You.
                  </span></span>{" "}
                  <span className="whitespace-nowrap">Not an Algorithm.</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                className="max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-zinc-400"
              >
                KodaPost is the social media carousel maker for indie brands and content creators. Transform your photos into nostalgic, scroll-stopping carousels with vintage camera styles, retro film filters, and AI-powered captions.
              </motion.p>

              {/* Quote — hidden on mobile to keep CTAs above fold */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                className="max-w-md hidden sm:block"
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
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0">
                  {isClerkEnabled ? (
                    <>
                      <Button
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-xl bg-orange-500 hover:bg-orange-400 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
                      >
                        <Link href="/sign-up">
                          Start Creating Free
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleTour}
                        className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Take a Tour
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="w-full sm:w-auto rounded-xl bg-orange-500 hover:bg-orange-400 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
                      >
                        Start Creating Free
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleTour}
                        className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Take a Tour
                      </Button>
                    </>
                  )}
                </div>


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
          <section id="how-it-works" className="relative py-16 sm:py-28 px-6 bg-gradient-to-b from-black via-zinc-950 to-zinc-900 scroll-mt-16">
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
                  How KodaPost Works
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Create Social Media Carousels{" "}
                  <span className="text-white/40">in 3 Steps</span>
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
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm overflow-hidden [@media(hover:hover)]:hover:border-white/10 transition-colors duration-500"
                  >
                    {/* Glow — subtle always-on for touch, hover-enhanced for pointer */}
                    <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl transition-all duration-700 ${glowClasses(step.glow as AccentColor)}`} />

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
          <section id="features" className="relative py-16 sm:py-28 px-6 bg-zinc-900 scroll-mt-16">
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
                  KodaPost Features
                </h2>
                <p className="mt-3 text-white/40 max-w-lg">
                  Everything indie creators need to turn everyday photos into scroll-stopping social media carousels — no design experience required.
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
                        : "bg-white/[0.03] border border-white/[0.06] p-8 [@media(hover:hover)]:hover:border-white/10"
                    } ${feature.span ? "border-l-2 border-l-purple-500/20 md:border-l-0" : ""}`}
                  >
                    {feature.style !== "accent" && (
                      <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-purple-500/[0.03] [@media(hover:hover)]:bg-purple-500/0 [@media(hover:hover)]:group-hover:bg-purple-500/5 rounded-full blur-3xl transition-all duration-700" />
                    )}
                    <div className="relative z-10">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${
                        feature.style === "accent"
                          ? "bg-white/20 text-white"
                          : "bg-purple-500/10 text-purple-400"
                      }`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">
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
                      <div className="absolute top-6 right-6 opacity-[0.04] [@media(hover:hover)]:group-hover:opacity-[0.08] transition-opacity duration-500">
                        <feature.icon className="h-16 w-16" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              HUMAN-IN-THE-LOOP PHILOSOPHY
              ================================================================ */}
          <section id="philosophy" className="relative py-16 sm:py-28 px-6 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 scroll-mt-16">
            <div className="max-w-5xl mx-auto">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                {/* Text content */}
                <motion.div variants={staggerChild}>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <Users className="h-3.5 w-3.5" />
                    KodaPost Philosophy
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
                    You Create.{" "}
                    <span className="text-white/40">KodaPost Assists.</span>
                  </h2>
                  <div className="space-y-4 text-white/45 text-sm leading-relaxed">
                    <p>
                      KodaPost is built on the belief that the best creative tools keep humans in the loop. KodaPost never takes over &mdash; it works alongside you, handling the tedious parts so you can focus on what matters: your story.
                    </p>
                    <p>
                      Every caption, every filter, every crop is a suggestion you can accept, modify, or reject. Your creative vision stays front and center. KodaPost is the assistant, never the artist.
                    </p>
                    <p>
                      We believe authentic content comes from real people making real choices &mdash; not from fully automated pipelines. That&apos;s why every KodaPost social media carousel is a collaboration between you and your AI-powered creative assistant.
                    </p>
                  </div>
                </motion.div>

                {/* Visual / image placeholder */}
                <motion.div variants={staggerChild} className="relative">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm overflow-hidden">
                    <div className="space-y-5">
                      {[
                        { label: "You upload your photos", icon: ImagePlus, color: "text-violet-400", bg: "bg-violet-500/10" },
                        { label: "KodaPost suggests captions & styles", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { label: "You review, edit, and approve", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "Publish on your terms", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
                      ].map((step, i) => (
                        <div key={step.label} className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.bg}`}>
                            <step.icon className={`h-5 w-5 ${step.color}`} />
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white/20">{String(i + 1).padStart(2, "0")}</span>
                            <span className="text-sm font-medium text-white/70">{step.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              BUILT FOR INDIE CREATORS
              ================================================================ */}
          <section id="indie-creators" className="relative py-16 sm:py-28 px-6 bg-gradient-to-b from-zinc-900 to-black scroll-mt-16">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-0" />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="text-center mb-16"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Built for Indie Creators
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  KodaPost: The Carousel Maker for{" "}
                  <span className="text-white/40">Small Brands &amp; Content Creators</span>
                </h2>
                <p className="mt-4 text-white/40 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                  You handle the creative vision — KodaPost handles the production work. Batch-create carousels, maintain a consistent brand aesthetic, and publish everywhere from one tool.
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {INDIE_CREATOR_CARDS.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      variants={staggerChild}
                      className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm overflow-hidden [@media(hover:hover)]:hover:border-white/10 transition-colors duration-500 ${
                        i >= 3 && !indieCardsExpanded ? "hidden md:block" : ""
                      }`}
                    >
                      {/* Glow — always-on at low opacity on touch, hover-enhanced on pointer devices */}
                      <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl transition-all duration-700 ${glowClasses(card.color)}`} />

                      <div className="relative z-10">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${COLOR_CLASSES[card.color].bg} ${COLOR_CLASSES[card.color].text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2">{card.title}</h3>
                        <p className="text-sm leading-relaxed text-white/40">{card.description}</p>
                      </div>

                      {/* Decorative icon ghost */}
                      <div className="absolute top-6 right-6 opacity-[0.04] [@media(hover:hover)]:group-hover:opacity-[0.08] transition-opacity duration-500">
                        <Icon className="h-16 w-16" />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Expand toggle — mobile only */}
              {!indieCardsExpanded && (
                <div className="mt-6 text-center md:hidden">
                  <button
                    type="button"
                    onClick={() => setIndieCardsExpanded(true)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-base font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                  >
                    See all benefits
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ================================================================
              MOBILE / TELEGRAM SECTION
              ================================================================ */}
          <section id="mobile" className="relative py-16 sm:py-28 px-6 bg-black overflow-hidden scroll-mt-16">
            {/* Subtle blue glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-0" />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                {/* Image placeholder — left side */}
                <motion.div variants={staggerChild} className="relative order-2 md:order-1 hidden md:block">
                  <div className="aspect-[4/5] max-w-[320px] mx-auto rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-zinc-800/50 to-zinc-900/80 overflow-hidden flex flex-col items-center justify-center">
                    {/* Phone mockup placeholder */}
                    <div className="flex flex-col items-center gap-4 px-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <IconBrandTelegram size={32} className="text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
                        <div className="h-3 w-24 rounded-full bg-white/[0.04] mx-auto" />
                      </div>
                      <div className="mt-4 space-y-3 w-full">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                            <div className="h-2 w-3/4 rounded-full bg-white/[0.04]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                            <div className="h-2 w-2/3 rounded-full bg-white/[0.04]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-500/10 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                            <div className="h-2 w-1/2 rounded-full bg-white/[0.04]" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Replace placeholder text */}
                    <p className="mt-6 text-[10px] uppercase tracking-widest text-white/15 font-medium">Image placeholder</p>
                  </div>
                </motion.div>

                {/* Text content — right side */}
                <motion.div variants={staggerChild} className="order-1 md:order-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile Content Creation
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
                    Create Carousels from Your Phone with{" "}
                    <span className="text-white/40">KodaPost + Telegram</span>
                  </h2>
                  <div className="space-y-4 text-white/45 text-sm leading-relaxed">
                    <p>
                      Snap photos on your phone and send them straight to your KodaPost content assistant via Telegram. KodaPost receives your images, applies your preferred style, and queues a carousel draft &mdash; all while you&apos;re still on the go.
                    </p>
                    <p>
                      No app downloads, no switching between tools. Just open Telegram, send your photos, and pick up where you left off on the KodaPost desktop app when you&apos;re ready to finalize.
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="mt-8 space-y-4">
                    {[
                      { icon: Smartphone, label: "Snap photos on your phone", color: "text-blue-400", bg: "bg-blue-500/10" },
                      { icon: IconBrandTelegram, label: "Send to KodaPost via Telegram", color: "text-sky-400", bg: "bg-sky-500/10", tabler: true },
                      { icon: Sparkles, label: "KodaPost drafts your carousel", color: "text-purple-400", bg: "bg-purple-500/10" },
                      { icon: Camera, label: "Review and publish on KodaPost desktop", color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-4">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step.bg}`}>
                          {step.tabler ? (
                            <step.icon size={18} className={step.color} />
                          ) : (
                            <step.icon className={`h-[18px] w-[18px] ${step.color}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-white/20">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-sm font-medium text-white/70">{step.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              CTA SECTION
              ================================================================ */}
          <section className="relative py-16 sm:py-32 px-6 bg-gradient-to-b from-zinc-900 to-black">
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="relative rounded-[2rem] border border-white/[0.06] bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-purple-500/10 p-8 sm:p-12 md:p-16 backdrop-blur-xl overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] -z-0" />

                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                    Start Creating Social Media Carousels with KodaPost — Free
                  </h2>
                  <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                    Join indie creators using KodaPost to build authentic, nostalgic social media content that stands out from the algorithm.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
                    {isClerkEnabled ? (
                      <Button
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-2xl bg-orange-500 hover:bg-orange-400 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-black text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                      >
                        <Link href="/sign-up">
                          Get Started Now
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="w-full sm:w-auto rounded-2xl bg-orange-500 hover:bg-orange-400 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-black text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                      >
                        Get Started Now
                      </Button>
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <KodaPostIcon className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-orange-500">KodaPost</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/30 max-w-sm mb-6">
                    KodaPost transforms your everyday photos into stunning nostalgic social media carousels with 10 vintage camera profiles, 9 retro film filters, and AI-powered text overlays &mdash; the content creation tool designed for indie brands who value authenticity over algorithms.
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
