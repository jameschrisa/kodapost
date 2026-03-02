"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Users,
  Eye,
  Sparkles,
  Shield,
  Share2,
  Layers,
  ArrowRight,
  ImagePlus,
  Palette,
  Zap,
  MessageCircle,
  Fingerprint,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Animation helpers (match SplashScreen) ── */

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

/* ── Data ── */

const PAIN_POINTS = [
  { icon: Layers, label: "Resizing for every platform", color: "from-violet-500 to-purple-600" },
  { icon: MessageCircle, label: "Writing captions that land", color: "from-amber-500 to-orange-600" },
  { icon: Palette, label: "Formatting carousels & layouts", color: "from-fuchsia-500 to-pink-600" },
  { icon: Shield, label: "Keeping your brand voice consistent", color: "from-emerald-500 to-teal-600" },
];

const VALUES = [
  {
    icon: Fingerprint,
    title: "Creators Own Their Voice",
    description:
      "AI generates options. You make the decisions. Your audience follows you for your perspective — we protect that.",
    style: "accent" as const,
    span: "md:col-span-2",
  },
  {
    icon: Zap,
    title: "Busywork Is the Enemy of Craft",
    description:
      "Formatting a carousel shouldn't take longer than the idea behind it. We automate the mechanics so you can invest in the meaning.",
    style: "glass" as const,
    span: "",
  },
  {
    icon: Eye,
    title: "Tools Should Be Transparent",
    description:
      "You always see what Koda is doing and why. No black-box publishing, no surprise edits, no hidden algorithms shaping your content.",
    style: "dark" as const,
    span: "",
  },
  {
    icon: Heart,
    title: "Great Content Is Human Content",
    description:
      "The best posts have fingerprints on them — imperfect, opinionated, real. We're here to polish, not to homogenize.",
    style: "glass" as const,
    span: "md:col-span-2",
  },
];

const STEPS = [
  {
    icon: ImagePlus,
    title: "Upload Your Images",
    description: "Bring your photos and tell Koda what your post is about.",
    accent: "from-violet-500 to-purple-600",
    glowColor: "hsl(270 70% 55% / 0.25)",
  },
  {
    icon: Sparkles,
    title: "Koda Generates Options",
    description: "Headlines, captions, and layouts tailored to your vibe and platform.",
    accent: "from-fuchsia-500 to-pink-600",
    glowColor: "hsl(320 70% 55% / 0.25)",
  },
  {
    icon: Palette,
    title: "You Review & Refine",
    description: "Edit text, adjust styling, crop images, tweak filters — until it feels right.",
    accent: "from-amber-500 to-orange-600",
    glowColor: "hsl(30 95% 55% / 0.25)",
  },
  {
    icon: Share2,
    title: "Publish Directly",
    description: "To Instagram, Telegram, and more — or export on your own schedule.",
    accent: "from-emerald-500 to-teal-600",
    glowColor: "hsl(175 80% 50% / 0.25)",
  },
];

/* ── Page Component ── */

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* ═══ 1. HERO ═══ */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-32">
        {/* Background image with gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.8), rgba(9,9,11,0.9), rgba(0,0,0,1)), url('/image_other/aboutbg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ x: "-10%", y: "-5%", opacity: 0 }}
            animate={{ x: ["-10%", "10%", "-10%"], y: ["-5%", "8%", "-5%"], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/4 top-1/4 h-[50vh] w-[50vh] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(270 70% 55% / 0.5) 0%, transparent 65%)", filter: "blur(40px)" }}
          />
          <motion.div
            initial={{ x: "10%", y: "5%", opacity: 0 }}
            animate={{ x: ["10%", "-15%", "10%"], y: ["5%", "-10%", "5%"], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-1/4 top-1/3 h-[40vh] w-[40vh] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(30 95% 55% / 0.4) 0%, transparent 65%)", filter: "blur(45px)" }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 left-1/2 h-[30vh] w-[30vh] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(280 70% 55% / 0.4) 0%, transparent 65%)", filter: "blur(30px)" }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-400"
          >
            <Sparkles className="h-3.5 w-3.5" />
            About KodaPost
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
              Your Creative Vision,
            </span>
            <br />
            <span className="text-white">
              Amplified — Not Automated.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOutExpo }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/45"
          >
            We build tools that handle the tedious parts of content publishing
            so you can focus on the work that actually matters — telling your
            story, your way.
          </motion.p>
        </div>
      </section>

      {/* ═══ 2. THE PROBLEM ═══ */}
      <section className="relative px-6 py-28 bg-gradient-to-b from-black to-zinc-900">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2"
        >
          {/* Text */}
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              The Problem
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Creating great content isn&rsquo;t the hard part.
            </h2>
            <p className="mt-4 text-white/45 leading-relaxed">
              The hard part is everything that comes after: resizing for every
              platform, writing captions that land, formatting carousels,
              keeping your brand voice consistent across channels. The busywork
              eats the hours you should spend making things.
            </p>
            <p className="mt-4 text-white/45 leading-relaxed">
              Meanwhile, fully automated AI tools promise to &ldquo;do it all
              for you&rdquo; — and strip out the one thing that makes your
              content yours: <span className="text-white font-medium">you</span>.
            </p>
          </div>

          {/* Pain points card */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8"
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/30">
              Sound familiar?
            </p>
            <div className="space-y-4">
              {PAIN_POINTS.map((point, i) => (
                <motion.div key={i} variants={staggerChild} className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${point.color}`}>
                    <point.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/70">{point.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 3. OUR MISSION ═══ */}
      <section className="relative px-6 py-28 bg-zinc-900">
        {/* Subtle center glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(270 70% 55% / 0.4) 0%, transparent 70%)", filter: "blur(80px)" }}
        />

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">
            <Heart className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Keep Humans in the Creative Driver&rsquo;s Seat
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/45 leading-relaxed">
            KodaPost exists to keep you in control. We handle the tedious,
            time-consuming parts of content publishing — formatting,
            captioning, cross-platform adaptation — so you can focus on telling
            your story, your way.
          </p>

          {/* Quote card */}
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-6 backdrop-blur-sm">
            <p className="text-xl font-medium italic text-white/80 sm:text-2xl" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
              &ldquo;AI should be your production assistant, not your ghostwriter.&rdquo;
            </p>
            <p className="mt-3 text-sm text-white/30">
              Every headline Koda suggests is a starting point that you shape, refine, and approve. Nothing publishes without your say-so.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══ 4. WHAT WE BELIEVE ═══ */}
      <section className="relative px-6 py-28 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Our Values
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">What We Believe</h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-5 md:grid-cols-2"
          >
            {VALUES.map((value, i) => {
              const Icon = value.icon;
              const isAccent = value.style === "accent";
              const isDark = value.style === "dark";
              return (
                <motion.div
                  key={i}
                  variants={staggerChild}
                  className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${value.span} ${
                    isAccent
                      ? "bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white"
                      : isDark
                        ? "border border-white/[0.06] bg-zinc-800/80 hover:border-white/10"
                        : "border border-white/[0.06] bg-white/[0.03] hover:border-white/10"
                  }`}
                >
                  {/* Ghost icon */}
                  <Icon className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]" />

                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                    isAccent ? "bg-white/20" : "bg-white/[0.06]"
                  }`}>
                    <Icon className={`h-5 w-5 ${isAccent ? "text-white" : "text-white/70"}`} />
                  </div>

                  <h3 className={`text-lg font-semibold ${isAccent ? "text-white" : "text-white"}`}>
                    {value.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isAccent ? "text-white/80" : "text-white/45"}`}>
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 5. HOW IT WORKS ═══ */}
      <section className="relative px-6 py-28 bg-zinc-950">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-12 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-fuchsia-400">
              <Sparkles className="h-3.5 w-3.5" />
              How It Works
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Four steps. You&rsquo;re in control the whole way.
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  variants={staggerChild}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10"
                >
                  {/* Hover glow */}
                  <div
                    className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle, ${step.glowColor} 0%, transparent 70%)`, filter: "blur(20px)" }}
                  />

                  <span className="mb-3 block text-xs font-bold text-white/20">0{i + 1}</span>

                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{step.description}</p>

                  {/* Arrow connector (desktop, between cards) */}
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/15 lg:block" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 6. THE TEAM ═══ */}
      <section className="relative px-6 py-28 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
            <Users className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white sm:text-4xl">Built by Creators</h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/45 leading-relaxed">
            KodaPost is built by creators who got tired of the gap between
            having a great idea and getting it out into the world. We&rsquo;re
            a small, independent team focused on one thing: making the content
            pipeline faster without making it feel less human.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Indie team, shipping daily
          </div>
        </motion.div>
      </section>

      {/* ═══ 7. GET IN TOUCH (CTA) ═══ */}
      <section className="relative px-6 py-32 bg-gradient-to-b from-zinc-900 to-black">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(30 95% 55% / 0.15) 0%, transparent 70%)", filter: "blur(80px)" }}
        />

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          <div className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-10 text-center backdrop-blur-sm sm:p-14">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
              <Mail className="h-6 w-6 text-orange-400" />
            </div>

            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Questions? Let&rsquo;s Talk.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/45">
              Feedback, partnership ideas, or just want to say hi — we&rsquo;d
              love to hear from you.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="rounded-xl bg-orange-500 px-6 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-500/30 transition-all"
              >
                <a href="mailto:hello@kodapost.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/[0.1] bg-white/[0.03] text-white hover:bg-white/[0.06] transition-all"
              >
                <Link href="/support">
                  Support Page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
