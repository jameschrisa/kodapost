"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  ArrowRight,
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
  Globe,
  ExternalLink,
} from "lucide-react";
import { IconBrandTelegram } from "@tabler/icons-react";
import { KodaPostIcon, UserHexagonIcon } from "@/components/icons";
import { springGentle } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { isClerkEnabled, useClerkAuth } from "@/hooks/useClerkAuth";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

// ---------------------------------------------------------------------------
// Constants (non-translatable data only)
// ---------------------------------------------------------------------------

const QUOTES_META = [
  { author: null },
  { author: "Henri Matisse" },
  { author: "Alina Wheeler" },
  { author: "Hans Christian Andersen" },
  { author: "Jonathan Swift" },
  { author: "Diane Arbus" },
  { author: "Edgar Degas" },
  { author: "George Eastman" },
  { author: "Elliott Erwitt" },
  { author: null },
  { author: "Criss Jami" },
  { author: "Alfred Stieglitz" },
];

const WORKFLOW_STEPS = [
  { icon: ImagePlus, accent: "from-violet-500 to-purple-600", glow: "violet" },
  { icon: Palette, accent: "from-fuchsia-500 to-pink-600", glow: "fuchsia" },
  { icon: Share2, accent: "from-amber-500 to-orange-600", glow: "amber" },
];

const FEATURES = [
  { icon: Camera, style: "card" as const },
  { icon: Sparkles, style: "accent" as const },
  { icon: Layers, style: "card" as const },
  { icon: Music, style: "card" as const },
  { icon: Radio, style: "dark" as const },
  { icon: LayoutTemplate, style: "card" as const },
  { icon: Shield, style: "card" as const },
  { icon: Calendar, style: "dark" as const },
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
// Segment data (non-translatable)
// ---------------------------------------------------------------------------

const SEGMENTS = [
  {
    id: "creators" as const,
    color: "purple",
    tagBg: "bg-purple-500/10",
    tagText: "text-purple-400",
    activeBg: "bg-purple-500",
    image: "/assets/landing/creators.png",
    segmentIndex: 0,
  },
  {
    id: "brands" as const,
    color: "amber",
    tagBg: "bg-amber-500/10",
    tagText: "text-amber-400",
    activeBg: "bg-amber-500",
    image: "/assets/landing/brands.png",
    segmentIndex: 1,
  },
  {
    id: "artists" as const,
    color: "fuchsia",
    tagBg: "bg-fuchsia-500/10",
    tagText: "text-fuchsia-400",
    activeBg: "bg-fuchsia-500",
    image: "/assets/landing/artists.png",
    segmentIndex: 2,
  },
];

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

// Kaleida-inspired easing: smooth, deliberate entrances
const smoothCubic: [number, number, number, number] = [0.22, 0.31, 0, 1];

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: smoothCubic },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.075, delayChildren: 0.1 },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: smoothCubic },
  },
};

// Smooth fade-up for hero headline
const heroFade = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: smoothCubic },
  },
};

const heroFadeDelayed = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, delay: 0.15, ease: smoothCubic },
  },
};

// ---------------------------------------------------------------------------
// Who It's For — Target Segment Tabs
// ---------------------------------------------------------------------------

function WhoItsForSection() {
  const { t } = useTranslation("splash");
  const [activeTab, setActiveTab] = useState<"creators" | "brands" | "artists">("creators");
  const segment = SEGMENTS.find((s) => s.id === activeTab)!;
  const si = segment.segmentIndex;

  return (
    <section id="who-its-for" className="relative py-16 sm:py-28 px-6 scroll-mt-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.85), rgba(9,9,11,0.9), rgba(24,24,27,0.85)), url('/assets/landing/color-grade.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
            {t("whoItsFor.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            {t("whoItsFor.title")}{" "}
            <span className="text-white/60">{t("whoItsFor.titleFaded")}</span>
          </h2>
          <p className="mt-3 text-white/60 max-w-lg">
            {t("whoItsFor.subtitle")}
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
                  : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {t(`segments.${seg.segmentIndex}.label`)}
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
            transition={{ duration: 0.25, ease: smoothCubic }}
            className="grid md:grid-cols-2 gap-10 items-start"
          >
            {/* Left — headline + description + image */}
            <div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${segment.tagBg} ${segment.tagText} text-xs font-bold uppercase tracking-widest mb-4`}>
                {t(`segments.${si}.label`)}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                {t(`segments.${si}.headline`)}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {t(`segments.${si}.description`)}
              </p>
              <Image
                src={segment.image}
                alt={t(`segments.${si}.label`)}
                width={1080}
                height={650}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="mt-6 w-full rounded-xl object-cover shadow-lg shadow-black/30"
              />
            </div>

            {/* Right — value points */}
            <div className="space-y-4">
              {[0, 1, 2, 3].map((pi) => (
                <div
                  key={pi}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-white/60">
                      {String(pi + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t(`segments.${si}.points.${pi}.title`)}</p>
                      <p className="mt-1 text-xs text-white/60 leading-relaxed">{t(`segments.${si}.points.${pi}.text`)}</p>
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
  const { t } = useTranslation("splash");
  const { t: tc } = useTranslation("common"); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"telegram" | "mobileweb">("telegram");
  // Use window scroll for native mobile scrolling (no fixed container)
  const { scrollYProgress, scrollY } = useScroll();
  const orbY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);


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
  const [quoteIndex] = useState(() => new Date().getDate() % QUOTES_META.length);

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

  // Nav links data (non-translatable hrefs + keys for labels)
  const NAV_LINKS = [
    { labelKey: "nav.features", href: "#features", isPage: false },
    { labelKey: "nav.pricing", href: "/billing", isPage: true },
    { labelKey: "nav.about", href: "/about", isPage: true },
    { labelKey: "nav.support", href: "/support", isPage: true },
  ];

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
          {/* Scroll progress bar */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-orange-500 via-purple-500 to-emerald-500"
            style={{ width: progressWidth }}
          />

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
                aria-label={t("nav.scrollToTop")}
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
                <span className="text-base font-bold tracking-tight text-white">{t("nav.brand")}</span>
              </button>

              {/* Nav links — hidden on mobile */}
              <nav className="hidden md:flex items-center gap-8">
                {NAV_LINKS.map((link) =>
                  link.isPage ? (
                    <Link
                      key={link.labelKey}
                      href={link.href}
                      className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ) : (
                    <a
                      key={link.labelKey}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .querySelector(link.href)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {t(link.labelKey)}
                    </a>
                  )
                )}
              </nav>

              {/* Mobile menu toggle — visible below md */}
              <button
                type="button"
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Auth / CTA — hidden on mobile (moved into hamburger menu) */}
              <div className="hidden md:flex items-center gap-3">
                <LanguageSwitcher compact className="text-white/60 hover:text-white hover:bg-white/[0.06]" />
                {isClerkEnabled && isSignedIn ? (
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 [@media(hover:hover)]:hover:bg-orange-400 pl-2 pr-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 [@media(hover:hover)]:hover:shadow-orange-500/30 transition-all duration-200"
                  >
                    {userInfo.avatarEmoji ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">{userInfo.avatarEmoji}</span>
                    ) : userInfo.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userInfo.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                        <UserHexagonIcon className="h-4 w-4" />
                      </div>
                    )}
                    {t("nav.openApp")}
                  </button>
                ) : isClerkEnabled ? (
                  <Button
                    size="sm"
                    asChild
                    className="rounded-xl bg-white/[0.08] hover:bg-white/[0.12] px-5 text-sm font-semibold text-white transition-all duration-200"
                  >
                    <Link href="/sign-in">{t("nav.logIn")}</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGetStarted}
                    className="rounded-xl bg-orange-500 hover:bg-orange-400 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200"
                  >
                    {t("nav.launchApp")}
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
                  {NAV_LINKS.map((link) =>
                    link.isPage ? (
                      <Link
                        key={link.labelKey}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        {t(link.labelKey)}
                      </Link>
                    ) : (
                      <a
                        key={link.labelKey}
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
                        {t(link.labelKey)}
                      </a>
                    )
                  )}
                  {/* Language switcher in mobile menu */}
                  <div className="px-3 py-2">
                    <LanguageSwitcher className="text-white/70 hover:text-white hover:bg-white/[0.06] w-full justify-start" />
                  </div>
                  {/* Auth CTA in mobile menu */}
                  <div className="mt-2 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                    {isClerkEnabled && isSignedIn ? (
                      <button
                        type="button"
                        onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-orange-500 [@media(hover:hover)]:hover:bg-orange-400 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/20"
                      >
                        {userInfo.avatarEmoji ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">{userInfo.avatarEmoji}</span>
                        ) : userInfo.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={userInfo.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                            <UserHexagonIcon className="h-4 w-4" />
                          </div>
                        )}
                        {t("nav.openApp")}
                      </button>
                    ) : isClerkEnabled ? (
                      <Button
                        size="lg"
                        asChild
                        className="w-full rounded-xl bg-white/[0.08] hover:bg-white/[0.12] py-3 text-base font-semibold text-white"
                      >
                        <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>{t("nav.logIn")}</Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/20"
                      >
                        {t("nav.launchApp")}
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
              style={{ backgroundImage: "url('/assets/landing/newbg.jpg?v=2')" }}
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
                {t("hero.badges.aiFortified")}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 8 }}
              transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
              className="absolute top-[30%] right-[6%] hidden lg:block pointer-events-none select-none"
            >
              <div className="bg-amber-500/20 border border-amber-400/30 text-amber-300 px-6 py-3 rounded-full font-bold text-base backdrop-blur-sm shadow-lg shadow-amber-500/10">
                {t("hero.badges.verifiedIndie")}
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

              {/* Brand — smooth fade-up */}
              <motion.h1
                variants={heroFade}
                initial="hidden"
                animate="visible"
                className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.1]"
              >
                {t("hero.title.line1")}
                <br className="hidden sm:block" />{" "}
                {t("hero.title.line2")}{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 italic" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {t("hero.title.gradient")}
                </span>{" "}
                {t("hero.title.line3")}
              </motion.h1>

              {/* Tagline */}
              <motion.p
                variants={heroFadeDelayed}
                initial="hidden"
                animate="visible"
                className="max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-zinc-400"
              >
                {t("hero.description")}
              </motion.p>

              {/* Quote — hidden on mobile to keep CTAs above fold */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: smoothCubic }}
                className="max-w-md hidden sm:block"
              >
                <p
                  className="text-lg sm:text-xl font-semibold leading-relaxed text-white/80"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  &ldquo;{t(`quotes.${quoteIndex}.text`)}&rdquo;
                </p>
                {QUOTES_META[quoteIndex].author && (
                  <p className="mt-2 text-xs font-medium text-white/60">
                    &ndash; {t(`quotes.${quoteIndex}.author`, QUOTES_META[quoteIndex].author!)}
                  </p>
                )}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5, ease: smoothCubic }}
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
                          {t("hero.cta.startCreating")}
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <Link href="/quickstart">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {t("hero.cta.quickStart")}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="w-full sm:w-auto rounded-xl bg-orange-500 hover:bg-orange-400 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
                      >
                        {t("hero.cta.startCreating")}
                      </Button>
                      <Button
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <Link href="/quickstart">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {t("hero.cta.quickStart")}
                        </Link>
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
              <span className="text-[11px] uppercase tracking-widest text-white/60 font-medium">{t("hero.scrollToExplore")}</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown className="h-4 w-4 text-white/60" />
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
                  {t("howItWorks.badge")}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                  {t("howItWorks.title")}{" "}
                  <span className="text-white/60">{t("howItWorks.titleFaded")}</span>
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
                    key={i}
                    variants={staggerChild}
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm overflow-hidden [@media(hover:hover)]:hover:border-white/10 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-white/[0.02] transition-all duration-500"
                  >
                    {/* Glow — subtle always-on for touch, hover-enhanced for pointer */}
                    <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl transition-all duration-700 ${glowClasses(step.glow as AccentColor)}`} />

                    <div className="relative z-10">
                      {/* Step number */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-lg`}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                          {t("howItWorks.stepLabel")} {i + 1}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3">{t(`workflow.${i}.title`)}</h3>
                      <p className="text-sm leading-relaxed text-white/60">{t(`workflow.${i}.description`)}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Walkthrough CTA */}
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="mt-12 text-center"
              >
                <Button
                  size="lg"
                  onClick={handleTour}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t("howItWorks.walkthroughButton")}
                </Button>
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              FEATURES — Bento Grid
              ================================================================ */}
          <section id="features" className="relative py-16 sm:py-28 px-6 scroll-mt-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.65), rgba(9,9,11,0.70), rgba(24,24,27,0.65)), url('/assets/landing/blurcolor.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
                  <Camera className="h-7 w-7 text-purple-400" />
                  {t("featuresSection.title")}
                </h2>
                <p className="mt-3 text-white/60 max-w-lg">
                  {t("featuresSection.subtitle")}
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5"
              >
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={staggerChild}
                    className={`relative rounded-2xl overflow-hidden transition-all duration-500 group h-full ${
                      feature.style === "accent"
                        ? "bg-gradient-to-br from-purple-600 to-fuchsia-700 p-8 text-white"
                        : feature.style === "dark"
                        ? "bg-zinc-800/80 border border-white/[0.06] p-8"
                        : "bg-white/[0.03] border border-white/[0.06] p-8 [@media(hover:hover)]:hover:border-white/10"
                    }`}
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
                        {t(`features.${i}.title`)}
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        feature.style === "accent" ? "text-white/80" : "text-white/60"
                      }`}>
                        {t(`features.${i}.description`)}
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
                  {t("provenance.badge")}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                  {t("provenance.title")}{" "}
                  <span className="text-white/60">{t("provenance.titleFaded")}</span>
                </h2>
                <p className="mt-4 text-white/60 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                  {t("provenance.subtitle")}
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
                    <h3 className="text-2xl font-bold mb-3">{t("provenance.mainCard.title")}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {t("provenance.mainCard.description")}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/landing/proven.png"
                      alt={t("provenance.mainCard.imageAlt")}
                      className="mt-6 w-full h-auto rounded-xl"
                    />
                  </div>
                </motion.div>

                {/* Right — supporting points */}
                <div className="space-y-5">
                  {[
                    { icon: Shield, color: "emerald", index: 0 },
                    { icon: ScanEye, color: "blue", index: 1 },
                    { icon: Lock, color: "violet", index: 2 },
                  ].map((point) => {
                    const Icon = point.icon;
                    return (
                      <motion.div
                        key={point.index}
                        variants={staggerChild}
                        className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm overflow-hidden [@media(hover:hover)]:hover:border-white/10 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-white/[0.02] transition-all duration-500"
                      >
                        <div className={`absolute -top-16 -right-16 h-32 w-32 rounded-full blur-3xl transition-all duration-700 ${glowClasses(point.color as AccentColor)}`} />
                        <div className="relative z-10 flex items-start gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${COLOR_CLASSES[point.color as AccentColor].bg} ${COLOR_CLASSES[point.color as AccentColor].text}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white mb-1">{t(`provenance.cards.${point.index}.title`)}</h3>
                            <p className="text-sm leading-relaxed text-white/60">{t(`provenance.cards.${point.index}.text`)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Learn More CTA */}
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="mt-10 text-center"
              >
                <Button
                  size="lg"
                  asChild
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-5 text-base font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300"
                >
                  <Link href="/human-made">
                    {t("provenance.learnMore")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
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
                  <div className="max-w-[320px] mx-auto rounded-[2rem] border border-white/[0.06] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/landing/kodamobile.png"
                      alt={t("mobile.imageAlt")}
                      className="w-full h-auto"
                    />
                  </div>
                </motion.div>

                {/* Text content — right side */}
                <motion.div variants={staggerChild} className="order-1 md:order-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <Smartphone className="h-3.5 w-3.5" />
                    {t("mobile.badge")}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-6">
                    {t("mobile.title")}{" "}
                    <span className="text-white/60">{t("mobile.titleFaded")}</span>
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {t("mobile.description")}
                  </p>

                  {/* Telegram / Mobile Web tabs */}
                  <div className="mt-8">
                    <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1 mb-6">
                      <button
                        type="button"
                        onClick={() => setMobileTab("telegram")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                          mobileTab === "telegram"
                            ? "bg-sky-500/15 text-sky-400 shadow-sm"
                            : "text-white/60 hover:text-white/60"
                        }`}
                      >
                        <IconBrandTelegram size={16} />
                        {t("mobile.tabs.telegram")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileTab("mobileweb")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                          mobileTab === "mobileweb"
                            ? "bg-purple-500/15 text-purple-400 shadow-sm"
                            : "text-white/60 hover:text-white/60"
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                        {t("mobile.tabs.mobileWeb")}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {mobileTab === "telegram" ? (
                        <motion.div
                          key="telegram"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Telegram workflow steps */}
                          <div className="space-y-4">
                            {[
                              { icon: Smartphone, color: "text-blue-400", bg: "bg-blue-500/10" },
                              { icon: IconBrandTelegram, color: "text-sky-400", bg: "bg-sky-500/10", tabler: true },
                              { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
                              { icon: Camera, color: "text-amber-400", bg: "bg-amber-500/10" },
                            ].map((step, i) => (
                              <div key={i} className="flex items-center gap-4">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step.bg}`}>
                                  {step.tabler ? (
                                    <step.icon size={18} className={step.color} />
                                  ) : (
                                    <step.icon className={`h-[18px] w-[18px] ${step.color}`} />
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-white/20">{String(i + 1).padStart(2, "0")}</span>
                                  <span className="text-sm font-medium text-white/70">{t(`telegram.steps.${i}`)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="mt-5 text-xs text-white/35 leading-relaxed">
                            {t("telegram.description")}
                          </p>
                          <div className="mt-5 flex justify-center">
                            <Link
                              href="/guide#telegram"
                              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
                            >
                              {t("telegram.learnMore")}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="mobileweb"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Install KodaPost on Your Phone */}
                          <div className="rounded-xl border border-purple-500/30 bg-purple-950/60 p-5 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                                <Download className="h-[18px] w-[18px] text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-white">{t("mobileWeb.installTitle")}</h3>
                                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                                  {t("mobileWeb.installDescription")}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2.5 pl-12">
                              <div className="flex items-center gap-2.5 text-xs text-white/60">
                                <Share className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                <span><strong className="text-white/70">{t("mobileWeb.iphone.label")}</strong> {t("mobileWeb.iphone.instructions")}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-white/60">
                                <PlusSquare className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                <span><strong className="text-white/70">{t("mobileWeb.android.label")}</strong> {t("mobileWeb.android.instructions")}</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-5 text-xs text-white/35 leading-relaxed">
                            {t("mobileWeb.description")}
                          </p>
                          <div className="mt-5 flex justify-center">
                            <Link
                              href="/guide#mobile-web"
                              className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
                            >
                              {t("mobileWeb.learnMore")}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ================================================================
              CTA SECTION
              ================================================================ */}
          <section className="relative py-16 sm:py-32 px-6 overflow-hidden">
            {/* Gallery background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/landing/gallerybg.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/75" />
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className="relative z-10 max-w-3xl mx-auto text-center"
            >
              <div className="relative rounded-[2rem] border border-white/[0.06] bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-purple-500/10 p-8 sm:p-12 md:p-16 backdrop-blur-xl overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] -z-0" />

                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white tracking-tight mb-6">
                    {t("cta.title")}
                  </h2>
                  <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                    {t("cta.subtitle")}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
                    {isClerkEnabled ? (
                      <Button
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-2xl bg-orange-500 hover:bg-orange-400 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-black text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                      >
                        <Link href="/sign-up">
                          {t("cta.button")}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="w-full sm:w-auto rounded-2xl bg-orange-500 hover:bg-orange-400 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-black text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                      >
                        {t("cta.button")}
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
                    <span className="text-base font-bold tracking-tight text-orange-500">{t("footer.brand")}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/60 max-w-sm mb-6">
                    {t("footer.description")}
                  </p>
                </div>

                {/* Product links */}
                <div>
                  <h4 className="text-sm font-semibold text-white/60 mb-4">{t("footer.product.heading")}</h4>
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
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("footer.product.howItWorks")}
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
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {t("footer.product.features")}
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/guide"
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {t("footer.product.userGuide")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/support"
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {t("footer.product.support")}
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal links */}
                <div>
                  <h4 className="text-sm font-semibold text-white/60 mb-4">{t("footer.legal.heading")}</h4>
                  <ul className="space-y-2.5">
                    <li>
                      <Link
                        href="/legal/privacy"
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {t("footer.legal.privacyPolicy")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/legal/terms"
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {t("footer.legal.termsOfUse")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/legal/data"
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/60 transition-colors"
                      >
                        <Database className="h-3.5 w-3.5" />
                        {t("footer.legal.dataPolicy")}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-white/20">
                  &copy; {new Date().getFullYear()} {t("footer.copyright")}
                </p>
                <p className="text-xs text-white/15">
                  {t("footer.tagline")}
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
