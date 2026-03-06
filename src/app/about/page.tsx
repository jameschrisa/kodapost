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
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

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

/* ── Data (icons, colors, layout metadata only) ── */

const PAIN_POINTS_META = [
  { icon: Layers, color: "from-violet-500 to-purple-600" },
  { icon: MessageCircle, color: "from-amber-500 to-orange-600" },
  { icon: Palette, color: "from-fuchsia-500 to-pink-600" },
  { icon: Shield, color: "from-emerald-500 to-teal-600" },
];

const VALUES_META = [
  { icon: Fingerprint, style: "accent" as const, span: "md:col-span-2" },
  { icon: Zap, style: "glass" as const, span: "" },
  { icon: Eye, style: "dark" as const, span: "" },
  { icon: Heart, style: "glass" as const, span: "md:col-span-2" },
];

const STEPS_META = [
  { icon: ImagePlus, accent: "from-violet-500 to-purple-600", glowColor: "hsl(270 70% 55% / 0.25)" },
  { icon: Sparkles, accent: "from-fuchsia-500 to-pink-600", glowColor: "hsl(320 70% 55% / 0.25)" },
  { icon: Palette, accent: "from-amber-500 to-orange-600", glowColor: "hsl(30 95% 55% / 0.25)" },
  { icon: Share2, accent: "from-emerald-500 to-teal-600", glowColor: "hsl(175 80% 50% / 0.25)" },
];

const WORKFLOW_META = [
  { icon: ImagePlus, color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
];

/* ── Page Component ── */

export default function AboutPage() {
  const { t } = useTranslation("about");
  const { t: tc } = useTranslation("common");

  return (
    <div className="overflow-hidden">
      {/* ═══ 1. HERO ═══ */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-32">
        {/* Language switcher - top right */}
        <div className="absolute right-6 top-6 z-20">
          <LanguageSwitcher compact />
        </div>

        {/* Background image with gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.8), rgba(9,9,11,0.9), rgba(0,0,0,1)), url('/assets/landing/aboutbg.jpg')",
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
            {t("hero.badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
              {t("hero.title.line1")}
            </span>
            <br />
            <span className="text-white">
              {t("hero.title.line2")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOutExpo }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/60"
          >
            {t("hero.description")}
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
              {t("problem.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-serif font-bold text-white sm:text-4xl">
              {t("problem.heading")}
            </h2>
            <p className="mt-4 text-white/60 leading-relaxed">
              {t("problem.p1")}
            </p>
            <p className="mt-4 text-white/60 leading-relaxed">
              {t("problem.p2.before")}
              <span className="text-white font-medium">{t("problem.p2.bold")}</span>
              {t("problem.p2.after")}
            </p>
          </div>

          {/* Pain points card */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-white/10 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-white/[0.02] transition-all duration-300"
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
              {t("problem.soundFamiliar")}
            </p>
            <div className="space-y-4">
              {PAIN_POINTS_META.map((point, i) => (
                <motion.div key={i} variants={staggerChild} className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${point.color}`}>
                    <point.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/70">{t(`problem.painPoints.${i}`)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 3. OUR MISSION ═══ */}
      <section className="relative px-6 py-28 overflow-hidden">
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
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">
            <Heart className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-3xl font-serif font-bold text-white sm:text-4xl">
            {t("mission.heading")}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/60 leading-relaxed">
            {t("mission.description")}
          </p>

          {/* Quote card */}
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-6 backdrop-blur-sm">
            <p className="text-xl font-medium italic text-white/80 sm:text-2xl" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
              &ldquo;{t("mission.quote")}&rdquo;
            </p>
            <p className="mt-3 text-sm text-white/50">
              {t("mission.quoteCaption")}
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
              {t("values.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-serif font-bold text-white sm:text-4xl">{t("values.heading")}</h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-5 md:grid-cols-2"
          >
            {VALUES_META.map((value, i) => {
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
                    {t(`values.${i}.title`)}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isAccent ? "text-white/80" : "text-white/60"}`}>
                    {t(`values.${i}.description`)}
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
              {t("howItWorks.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-serif font-bold text-white sm:text-4xl">
              {t("howItWorks.heading")}
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS_META.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  variants={staggerChild}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-white/[0.02]"
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

                  <h3 className="text-base font-semibold text-white">{t(`howItWorks.steps.${i}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{t(`howItWorks.steps.${i}.description`)}</p>

                  {/* Arrow connector (desktop, between cards) */}
                  {i < STEPS_META.length - 1 && (
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

          <h2 className="text-3xl font-serif font-bold text-white sm:text-4xl">{t("team.heading")}</h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/60 leading-relaxed">
            {t("team.description")}
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("team.badge")}
          </div>
        </motion.div>
      </section>

      {/* ═══ 6b. PHILOSOPHY ═══ */}
      <section className="relative px-6 py-28 scroll-mt-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(24,24,27,0.85), rgba(9,9,11,0.9), rgba(24,24,27,0.85)), url('/assets/landing/color-grade.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
                <Camera className="h-3.5 w-3.5" />
                {t("philosophy.badge")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-6">
                {t("philosophy.heading.youCreate")}{" "}
                <span className="text-white/60">{t("philosophy.heading.kodaAssists")}</span>
              </h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                <p>
                  {t("philosophy.p1")}
                </p>
                <p>
                  {t("philosophy.p2")}
                </p>
                <p>
                  {t("philosophy.p3")}
                </p>
              </div>
            </motion.div>

            {/* Visual — workflow steps */}
            <motion.div variants={staggerChild} className="relative">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm overflow-hidden">
                <div className="space-y-5">
                  {WORKFLOW_META.map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.bg}`}>
                        <step.icon className={`h-5 w-5 ${step.color}`} />
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/20">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-medium text-white/70">{t(`philosophy.workflow.${i}`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
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

            <h2 className="text-2xl font-serif font-bold text-white sm:text-3xl">
              {t("cta.heading")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/60">
              {t("cta.description")}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="rounded-xl bg-orange-500 px-6 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-500/30 transition-all"
              >
                <a href="mailto:hello@kodapost.com">
                  <Mail className="mr-2 h-4 w-4" />
                  {tc("button.emailUs")}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/[0.1] bg-white/[0.03] text-white hover:bg-white/[0.06] transition-all"
              >
                <Link href="/support">
                  {tc("button.supportPage")}
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
