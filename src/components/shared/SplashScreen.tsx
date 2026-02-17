"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { IconArrowBounce } from "@tabler/icons-react";
import { KodaPostIcon } from "@/components/icons";
import { springGentle } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const SESSION_KEY = "kodapost:splash-shown";

interface SplashScreenProps {
  onComplete: () => void;
  /** When true, bypass the sessionStorage check and always show the splash */
  forceShow?: boolean;
  /** Optional external handler for "Get started". Receives a dismiss function to trigger the exit animation. */
  onGetStarted?: (dismiss: () => void) => void;
}

export function SplashScreen({ onComplete, forceShow = false, onGetStarted }: SplashScreenProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  // Prefetch the Introduction route so it's instant when clicked
  useEffect(() => {
    router.prefetch("/introduction");
  }, [router]);

  // Check if splash was already shown this session (skip when forced via brand click)
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
        // sessionStorage unavailable — show splash anyway
      }
    }

    // Check for reduced motion preference — auto-dismiss faster
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }

    // No auto-dismiss for normal motion — user clicks "Get Started"
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick a random quote (stable for the component lifetime)
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Immersive dark gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

          {/* Animated abstract orbs — CSS-only ambient light effect */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary orb — brand color, large drift */}
            <motion.div
              initial={{ x: "-10%", y: "-5%", opacity: 0 }}
              animate={{
                x: ["-10%", "10%", "-10%"],
                y: ["-5%", "8%", "-5%"],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/4 top-1/4 h-[70vh] w-[70vh] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.7) 0%, transparent 65%)",
                filter: "blur(30px)",
              }}
            />
            {/* Blue orb — cool tone, opposite drift */}
            <motion.div
              initial={{ x: "10%", y: "5%", opacity: 0 }}
              animate={{
                x: ["10%", "-15%", "10%"],
                y: ["5%", "-10%", "5%"],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-1/4 top-1/3 h-[55vh] w-[55vh] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(210 90% 55% / 0.6) 0%, transparent 65%)",
                filter: "blur(35px)",
              }}
            />
            {/* Purple orb — accent pulse near bottom */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.35, 0.6, 0.35],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(280 70% 55% / 0.55) 0%, transparent 65%)",
                filter: "blur(25px)",
              }}
            />
            {/* Amber/orange orb — warm accent, drifts top-right */}
            <motion.div
              initial={{ x: "5%", y: "-8%", opacity: 0 }}
              animate={{
                x: ["5%", "-10%", "5%"],
                y: ["-8%", "5%", "-8%"],
                opacity: [0.3, 0.55, 0.3],
              }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-1/3 top-1/4 h-[40vh] w-[40vh] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(30 95% 55% / 0.5) 0%, transparent 65%)",
                filter: "blur(30px)",
              }}
            />
            {/* Teal orb — bright accent, floats bottom-left */}
            <motion.div
              initial={{ x: "-5%", y: "5%", opacity: 0 }}
              animate={{
                x: ["-5%", "12%", "-5%"],
                y: ["5%", "-8%", "5%"],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/3 left-1/4 h-[35vh] w-[35vh] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(175 80% 50% / 0.5) 0%, transparent 65%)",
                filter: "blur(25px)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springGentle, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-2xl"
            >
              <KodaPostIcon className="h-7 w-7 text-white" />
            </motion.div>

            {/* Brand name — large and clean */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                KodaPost
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              className="max-w-xs text-sm leading-relaxed text-white/50 sm:max-w-sm sm:text-base"
            >
              Transform your photos into stunning, share-ready carousels
            </motion.p>

            {/* Quote */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
              className="max-w-sm sm:max-w-md"
            >
              <p
                className="text-lg font-semibold leading-relaxed text-white sm:text-xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className="mt-2 text-xs font-medium text-white/50">
                  - {quote.author}
                </p>
              )}
            </motion.div>

            {/* Split button: Get Started + Introduction dropdown */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4, ease: "easeOut" }}
              className="mt-4"
            >
              <div className="inline-flex rounded-full shadow-lg">
                {/* Primary action */}
                <Button
                  size="lg"
                  onClick={() => {
                    if (onGetStarted) {
                      onGetStarted(() => setVisible(false));
                    } else {
                      setVisible(false);
                    }
                  }}
                  className="rounded-l-full rounded-r-none border-r-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-8 text-base font-medium text-white hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                >
                  Get started
                </Button>
                {/* Divider */}
                <div className="w-px bg-white/20" />
                {/* Secondary action dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="lg"
                      className="rounded-l-none rounded-r-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-3 text-white hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500"
                      aria-label="More options"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px]" style={{ zIndex: 60 }}>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/introduction"
                        className="flex items-center gap-2"
                      >
                        <IconArrowBounce className="h-3.5 w-3.5" />
                        Introduction
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
