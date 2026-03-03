"use client";

import { useEffect, useState } from "react";
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
  Share,
  PlusSquare,
  Download,
  Fingerprint,
  Lock,
  ScanEye,
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
    icon: Shield,
    title: "Creator Provenance",
    description: "Every export embeds your name, timestamp, and a unique image fingerprint into the file metadata. Add a visible watermark for instant attribution. Prove you made it first.",
    span: "",
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
// Who It's For — Target Segment Tabs
// ---------------------------------------------------------------------------

const SEGMENTS = [
  {
    id: "creators" as const,
    label: "Content Creators",
    color: "purple",
    tagBg: "bg-purple-500/10",
    tagText: "text-purple-400",
    activeBg: "bg-purple-500",
    headline: "Turn your photo library into a content engine.",
    description: "You already have the eye. KodaPost handles the production work so you can post consistently without burning out.",
    points: [
      { title: "Batch-Create a Week of Posts", text: "Upload once, get a full week of styled, captioned carousels ready to publish." },
      { title: "AI Captions in Your Voice", text: "KodaPost writes scroll-stopping copy you edit and approve. Your voice, amplified." },
      { title: "Publish Everywhere at Once", text: "Export optimized for Instagram, TikTok, LinkedIn, YouTube Shorts, Reddit, and X." },
      { title: "Content Calendar", text: "Schedule carousels, track output, and stay consistent without the burnout." },
    ],
  },
  {
    id: "brands" as const,
    label: "Indie Brands",
    color: "amber",
    tagBg: "bg-amber-500/10",
    tagText: "text-amber-400",
    activeBg: "bg-amber-500",
    headline: "Your brand voice, amplified across every platform.",
    description: "KodaPost gives your small team the same polished, consistent content output as brands ten times your size, without losing the authenticity that makes you different.",
    points: [
      { title: "Locked-In Brand Aesthetic", text: "Set your camera profile, film filter, fonts, and colors once. Every carousel matches automatically." },
      { title: "Multi-Platform, No Reformatting", text: "One export covers every social channel with the right dimensions and aspect ratio." },
      { title: "Creator Provenance", text: "Every export embeds your brand, timestamp, and a unique fingerprint. Prove you made it first." },
      { title: "Stand Out from Canva Templates", text: "Vintage camera profiles and retro filters give your brand a visual differentiator competitors can't copy." },
    ],
  },
  {
    id: "artists" as const,
    label: "Artists",
    color: "fuchsia",
    tagBg: "bg-fuchsia-500/10",
    tagText: "text-fuchsia-400",
    activeBg: "bg-fuchsia-500",
    headline: "Your art deserves better than stock templates.",
    description: "KodaPost's vintage aesthetic and human-in-the-loop approach means your portfolio carousels feel as intentional as the work itself.",
    points: [
      { title: "10 Vintage Camera Profiles", text: "Sony Mavica, Polaroid 600, Kodak EasyShare and more. Your work, through an iconic lens." },
      { title: "Retro Film Filters", text: "1977, Earlybird, Lo-Fi, Nashville. Every pixel processed to feel like it came from film." },
      { title: "Nano-Casts", text: "Turn your carousel into a short-form audio story. Add a voiceover to walk viewers through your process." },
      { title: "You Stay in Control", text: "Every caption, crop, and filter is a suggestion you accept, modify, or reject. The assistant, never the artist." },
    ],
  },
];

function WhoItsForSection() {
  const [activeTab, setActiveTab] = useState<"creators" | "brands" | "artists">("creators");
  const segment = SEGMENTS.find((s) => s.id === activeTab)!;

  return (
    <section id="who-its-for" className="relative py-16 sm:py-28 px-6 scroll-mt-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.85), rgba(9,9,11,0.9), rgba(24,24,27,0.85)), url('/image_other/color-grade.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Users className="h-3.5 w-3.5" />
            Who It&apos;s For
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for People Who{" "}
            <span className="text-white/40">Make Things.</span>
          </h2>
          <p className="mt-3 text-white/40 max-w-lg">
            Whether you&apos;re growing an audience, launching a brand, or sharing your art, KodaPost fits your workflow.
          </p>
        </motion.div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => setActiveTab(seg.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === seg.id
                  ? `${seg.activeBg} text-white shadow-lg`
                  : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: easeOutExpo }}
            className="grid md:grid-cols-2 gap-10 items-start"
          >
            {/* Left — headline + description */}
            <div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${segment.tagBg} ${segment.tagText} text-xs font-bold uppercase tracking-widest mb-4`}>
                {segment.label}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                {segment.headline}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed">
                {segment.description}
              </p>
            </div>

            {/* Right — value points */}
            <div className="space-y-4">
              {segment.points.map((point, i) => (
                <div
                  key={point.title}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-white/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{point.title}</p>
                      <p className="mt-1 text-xs text-white/40 leading-relaxed">{point.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

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
  // Use window scroll for native mobile scrolling (no fixed container)
  const { scrollY } = useScroll();
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
          className="relative z-50 min-h-screen overflow-x-hidden"
        >
          {/* ================================================================
              STICKY NAV BAR
              ================================================================ */}
          <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3.5">
              {/* Brand — tap to scroll to top */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2.5 cursor-pointer"
                aria-label="Scroll to top"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <span className="text-base font-bold tracking-tight text-white">KodaPost</span>
              </button>

              {/* Nav links — hidden on mobile */}
              <nav className="hidden md:flex items-center gap-8">
                {[
                  { label: "Features", href: "#features", isPage: false },
                  { label: "Pricing", href: "/billing", isPage: true },
                  { label: "About", href: "/about", isPage: true },
                  { label: "Support", href: "/support", isPage: true },
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
                        document
                          .querySelector(link.href)
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
                    { label: "Features", href: "#features", isPage: false },
                    { label: "Pricing", href: "/billing", isPage: true },
                    { label: "About", href: "/about", isPage: true },
                    { label: "Support", href: "/support", isPage: true },
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
                          document
                            .querySelector(link.href)
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
                    &ndash; {quote.author}
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
          <section id="features" className="relative py-16 sm:py-28 px-6 scroll-mt-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.65), rgba(9,9,11,0.70), rgba(24,24,27,0.65)), url('/image_other/blurcolor.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
                  Everything indie creators need to turn everyday photos into scroll-stopping social media carousels, no design experience required.
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
              WHO IT'S FOR — Target Segment Tabs
              ================================================================ */}
          <WhoItsForSection />

          {/* ================================================================
              CREATOR PROVENANCE — IP Protection
              ================================================================ */}
          <section id="creator-provenance" className="relative py-16 sm:py-28 px-6 bg-gradient-to-b from-zinc-900 to-black scroll-mt-16">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-0" />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="text-center mb-16"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Creator Provenance
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Your Work Is Yours.{" "}
                  <span className="text-white/40">Prove It.</span>
                </h2>
                <p className="mt-4 text-white/40 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                  Social media is flooded with AI-generated slop and wholesale copies of original work. KodaPost doesn&apos;t just help you create. It helps you prove you created it first.
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid md:grid-cols-2 gap-8"
              >
                {/* Left — main provenance card */}
                <motion.div
                  variants={staggerChild}
                  className="group relative rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 sm:p-10 text-white overflow-hidden"
                >
                  <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-white/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-6 bg-white/20">
                      <Fingerprint className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Digital Fingerprint on Every Export</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Every carousel you export from KodaPost embeds your name, a timestamp, and a unique image fingerprint directly into the file metadata. If someone copies your work, you have the receipt.
                    </p>
                  </div>
                </motion.div>

                {/* Right — supporting points */}
                <div className="space-y-5">
                  {[
                    {
                      icon: Shield,
                      title: "Protect Your Art from AI Scraping",
                      text: "Your original photos and designs are your IP. Creator Provenance creates a verifiable chain of authorship that stands up when your content gets reposted, scraped, or fed into AI training sets.",
                      color: "emerald",
                    },
                    {
                      icon: ScanEye,
                      title: "Visible Watermarking",
                      text: "Add a branded watermark to your carousels so attribution is instant and visible. Your audience knows it's yours before they even read the caption.",
                      color: "blue",
                    },
                    {
                      icon: Lock,
                      title: "Own Your Creative Identity",
                      text: "In an era where AI-generated content is indistinguishable from human work, provenance is your proof of authenticity. KodaPost empowers creators, artists, and brands to claim what's theirs.",
                      color: "violet",
                    },
                  ].map((point) => {
                    const Icon = point.icon;
                    return (
                      <motion.div
                        key={point.title}
                        variants={staggerChild}
                        className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm overflow-hidden [@media(hover:hover)]:hover:border-white/10 transition-colors duration-500"
                      >
                        <div className={`absolute -top-16 -right-16 h-32 w-32 rounded-full blur-3xl transition-all duration-700 ${glowClasses(point.color as AccentColor)}`} />
                        <div className="relative z-10 flex items-start gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${COLOR_CLASSES[point.color as AccentColor].bg} ${COLOR_CLASSES[point.color as AccentColor].text}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white mb-1">{point.title}</h3>
                            <p className="text-sm leading-relaxed text-white/40">{point.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
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
                      Snap photos on your phone and send them straight to your KodaPost content assistant via Telegram. KodaPost receives your images, applies your preferred style, and queues a carousel draft, all while you&apos;re still on the go.
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

                  {/* Add to Home Screen CTA */}
                  <div className="mt-10 rounded-xl border border-purple-500/30 bg-purple-950/60 p-5 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                        <Download className="h-[18px] w-[18px] text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">Install KodaPost on Your Phone</h3>
                        <p className="mt-1 text-xs text-white/40 leading-relaxed">
                          Add KodaPost to your home screen for instant, full-screen access. No app store needed.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2.5 pl-12">
                      <div className="flex items-center gap-2.5 text-xs text-white/50">
                        <Share className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <span><strong className="text-white/70">iPhone:</strong> Tap <span className="text-white/70">Share</span> then <span className="text-white/70">Add to Home Screen</span></span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-white/50">
                        <PlusSquare className="h-3.5 w-3.5 shrink-0 text-green-400" />
                        <span><strong className="text-white/70">Android:</strong> Tap <span className="text-white/70">Menu (&#8942;)</span> then <span className="text-white/70">Add to Home screen</span></span>
                      </div>
                    </div>
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
                    Start Creating Social Media Carousels with KodaPost, Free
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
                    <KodaPostIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-base font-bold tracking-tight text-orange-500">KodaPost</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/30 max-w-sm mb-6">
                    KodaPost transforms your everyday photos into stunning nostalgic social media carousels with 10 vintage camera profiles, 9 retro film filters, and AI-powered text overlays. The content creation tool designed for indie brands who value authenticity over algorithms.
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
                          document
                            .querySelector("#how-it-works")
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
                          document
                            .querySelector("#features")
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
