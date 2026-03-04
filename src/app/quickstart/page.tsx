"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Paintbrush,
  LayoutGrid,
  CheckCircle2,
  Share2,
  ImagePlus,
  Camera,
  Type,
  Sliders,
  Music,
  Download,
  BookOpen,
  HelpCircle,
  CreditCard,
  ArrowRight,
  Zap,
  Hash,
  Palette,
  ToggleRight,
  GripVertical,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ------------------------------------------------------------------ */
/*  Reusable mockup components                                         */
/* ------------------------------------------------------------------ */

function MockWindowChrome({ label, step }: { label: string; step: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
      </div>
      <span className="text-xs font-medium text-white/30">
        Step {step}: {label}
      </span>
    </div>
  );
}

function Callout({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mt-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">
        {number}
      </span>
      <span className="text-xs text-white/50 leading-relaxed">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step mockups                                                       */
/* ------------------------------------------------------------------ */

function UploadMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Drop zone */}
      <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
        <ImagePlus className="h-8 w-8 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/30 mb-1">Drag and drop your photos here</p>
        <p className="text-xs text-white/15">JPEG, PNG, WebP, HEIC up to 10 MB each</p>
      </div>

      {/* Thumbnail grid mockup */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg ${
              i <= 3 ? "bg-gradient-to-br from-white/8 to-white/4" : "border border-dashed border-white/8"
            } flex items-center justify-center`}
          >
            {i <= 3 ? (
              <Camera className="h-3.5 w-3.5 text-white/20" />
            ) : (
              <span className="text-[10px] text-white/15">+</span>
            )}
          </div>
        ))}
      </div>

      {/* File type badges */}
      <div className="flex items-center gap-2">
        {["JPEG", "PNG", "WebP", "HEIC"].map((fmt) => (
          <span
            key={fmt}
            className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/25"
          >
            {fmt}
          </span>
        ))}
        <span className="text-[10px] text-white/20 ml-auto">3 of 10 photos</span>
      </div>

      <Callout number={1}>Drag photos into the drop zone, or click to browse files.</Callout>
      <Callout number={2}>Thumbnails appear in a grid. Drag to reorder them.</Callout>
      <Callout number={3}>File types are validated automatically. HEIC files convert to JPEG.</Callout>
    </div>
  );
}

function CraftMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Theme input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Carousel Theme</label>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <span className="text-sm text-white/40">Sunrise hike at Joshua Tree...</span>
        </div>
      </div>

      {/* Style template selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Style Template</label>
        <div className="flex gap-1.5 overflow-hidden">
          {[
            { name: "Bold Statement", color: "bg-white/10" },
            { name: "Vintage Serif", color: "bg-amber-900/30" },
            { name: "Editorial", color: "bg-white/8" },
          ].map((tpl, i) => (
            <div
              key={tpl.name}
              className={`flex-1 rounded-lg border ${
                i === 0 ? "border-purple-500/40 ring-1 ring-purple-500/20" : "border-white/[0.06]"
              } ${tpl.color} px-2 py-2 text-center`}
            >
              <Palette className="h-3 w-3 text-white/25 mx-auto mb-0.5" />
              <span className="text-[9px] text-white/30 leading-tight block">{tpl.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camera filter dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Camera Filter</label>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <Camera className="h-3.5 w-3.5 text-amber-400/60" />
          <span className="text-sm text-white/50">Kodak Gold 200</span>
          <svg className="h-3 w-3 text-white/20 ml-auto" fill="none" viewBox="0 0 12 12"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Vibe keyword tags */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Vibes</label>
        <div className="flex flex-wrap gap-1.5">
          {["relatable", "nostalgic", "warm"].map((vibe) => (
            <span
              key={vibe}
              className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/20 px-2.5 py-1 text-[11px] font-medium text-purple-300"
            >
              <Hash className="h-2.5 w-2.5" />
              {vibe}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full border border-dashed border-white/10 px-2.5 py-1 text-[11px] text-white/20">
            + add vibe
          </span>
        </div>
      </div>

      <Callout number={1}>Pick a style template to set fonts, colors, and overlays in one click.</Callout>
      <Callout number={2}>Choose a camera filter to set the visual mood for all slides.</Callout>
      <Callout number={3}>Add vibe tags to shape the tone of generated text and captions.</Callout>
    </div>
  );
}

function DesignMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Slide preview with text overlay */}
      <div className="relative rounded-xl overflow-hidden aspect-[4/5]">
        <img
          src="/assets/quickstart/slide-main.jpg"
          alt="Slide preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-end p-4">
          <div className="w-full space-y-1">
            <div className="h-4 w-3/4 rounded bg-white/20" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </div>
        {/* Drag handle indicator */}
        <div className="absolute top-3 right-3">
          <GripVertical className="h-4 w-4 text-white/30" />
        </div>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Font selector */}
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center">
          <Type className="h-3.5 w-3.5 text-white/30 mx-auto mb-1" />
          <span className="text-[10px] text-white/25">Font</span>
        </div>
        {/* Position */}
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center">
          <Sliders className="h-3.5 w-3.5 text-white/30 mx-auto mb-1" />
          <span className="text-[10px] text-white/25">Position</span>
        </div>
        {/* Color */}
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center">
          <Palette className="h-3.5 w-3.5 text-white/30 mx-auto mb-1" />
          <span className="text-[10px] text-white/25">Color</span>
        </div>
      </div>

      {/* Slide thumbnails strip */}
      <div className="flex gap-1.5 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-10 w-10 shrink-0 rounded-md overflow-hidden ${
              i === 1
                ? "ring-2 ring-purple-500"
                : "border border-white/[0.06]"
            }`}
          >
            <img
              src={`/assets/quickstart/thumb-${i}.jpg`}
              alt={`Slide ${i}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <Callout number={1}>Edit text overlays directly on the slide preview.</Callout>
      <Callout number={2}>Use the font, position, and color controls to style each slide.</Callout>
      <Callout number={3}>Click slide thumbnails to navigate between slides.</Callout>
    </div>
  );
}

function ReviewMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Platform selector tabs */}
      <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1">
        {[
          { label: "Instagram", active: true },
          { label: "TikTok", active: false },
          { label: "LinkedIn", active: false },
          { label: "X", active: false },
        ].map((tab) => (
          <button
            key={tab.label}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              tab.active
                ? "bg-white/10 text-white/70"
                : "text-white/25 hover:text-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1">
        {[
          { label: "YouTube", active: false },
          { label: "Shorts", active: false },
          { label: "Reddit", active: false },
          { label: "Lemon8", active: false },
        ].map((tab) => (
          <button
            key={tab.label}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors text-white/25 hover:text-white/40`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Carousel grid preview */}
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg overflow-hidden ${
              i <= 5
                ? "relative"
                : "border border-dashed border-white/8 flex items-center justify-center"
            }`}
          >
            {i <= 5 ? (
              <>
                <img
                  src={`/assets/quickstart/grid-${i}.jpg`}
                  alt={`Slide ${i}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/40 bg-black/20">
                  {i}
                </span>
              </>
            ) : null}
          </div>
        ))}
      </div>

      {/* Audio waveform strip */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Music className="h-3.5 w-3.5 text-white/25" />
          <span className="text-[11px] text-white/30">Audio Track</span>
        </div>
        <div className="flex items-end gap-px h-6">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-500/20 rounded-t-sm"
              style={{ height: `${20 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%` }}
            />
          ))}
        </div>
      </div>

      <Callout number={1}>Switch platform tabs to preview format differences.</Callout>
      <Callout number={2}>The carousel grid shows all your slides at a glance.</Callout>
      <Callout number={3}>Add an optional audio track for video-format exports.</Callout>
    </div>
  );
}

function PublishMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Platform checkboxes */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Publish To</label>
        {[
          { name: "Instagram", connected: true, checked: true },
          { name: "TikTok", connected: true, checked: true },
          { name: "LinkedIn", connected: false, checked: false },
          { name: "X/Twitter", connected: true, checked: true },
        ].map((platform) => (
          <div
            key={platform.name}
            className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <div
              className={`h-4 w-4 rounded border ${
                platform.checked
                  ? "bg-purple-500 border-purple-500"
                  : "border-white/15 bg-transparent"
              } flex items-center justify-center`}
            >
              {platform.checked && (
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={`text-sm ${platform.checked ? "text-white/60" : "text-white/25"}`}>
              {platform.name}
            </span>
            {!platform.connected && (
              <span className="text-[10px] text-white/15 ml-auto">Not connected</span>
            )}
          </div>
        ))}
      </div>

      {/* Provenance toggle */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-3.5 w-3.5 text-amber-400/50" />
          <span className="text-sm text-white/50">Creator Provenance</span>
        </div>
        <ToggleRight className="h-5 w-5 text-purple-400" />
      </div>

      {/* Export / Download button */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-2.5 text-sm font-medium text-purple-300">
          <Share2 className="h-4 w-4" />
          Post Now
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/40">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <Callout number={1}>Check the platforms you want to publish to.</Callout>
      <Callout number={2}>Toggle Creator Provenance to embed authorship metadata and an optional watermark.</Callout>
      <Callout number={3}>Use Export to download a ZIP for manual posting instead.</Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step data                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    step: 1,
    title: "Upload",
    subtitle: "Add your photos",
    description:
      "Drag and drop 1 to 10 photos into the upload area. KodaPost accepts JPEG, PNG, WebP, and HEIC files. Photos appear as thumbnails that you can reorder by dragging.",
    icon: Upload,
    accent: "purple",
    mockup: UploadMockup,
  },
  {
    step: 2,
    title: "Craft",
    subtitle: "Set the mood",
    description:
      "Choose a style template to set fonts, colors, and overlays in one click. Then describe your carousel theme, pick a camera emulation filter, and add vibe keywords that shape the tone of generated text. Koda uses these inputs to write slide overlays and a caption.",
    icon: Paintbrush,
    accent: "amber",
    mockup: CraftMockup,
  },
  {
    step: 3,
    title: "Design",
    subtitle: "Style every slide",
    description:
      "Edit text overlays directly on the slide preview. Change fonts, adjust text position, pick colors, and fine-tune each slide individually. Navigate between slides using the thumbnail strip.",
    icon: LayoutGrid,
    accent: "blue",
    mockup: DesignMockup,
  },
  {
    step: 4,
    title: "Review",
    subtitle: "Preview the final result",
    description:
      "See all your slides in a carousel grid. Switch between platform tabs (Instagram, TikTok, LinkedIn, X/Twitter, YouTube, YouTube Shorts, Reddit, Lemon8) to preview format differences. Optionally add an audio track by recording a voiceover, uploading your own file, or browsing the built-in music library.",
    icon: CheckCircle2,
    accent: "emerald",
    mockup: ReviewMockup,
  },
  {
    step: 5,
    title: "Publish",
    subtitle: "Share with the world",
    description:
      "Select connected platforms and hit Post Now, or export a ZIP for manual posting. Toggle Creator Provenance to cryptographically sign your work with Ed25519 and embed tamper-proof authorship metadata. You can also add a brand watermark to protect your content across platforms.",
    icon: Share2,
    accent: "orange",
    mockup: PublishMockup,
  },
];

const ACCENT_MAP: Record<string, { badge: string; icon: string; ring: string; border: string }> = {
  purple: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    icon: "text-purple-400",
    ring: "ring-purple-500/20",
    border: "border-purple-500/15",
  },
  amber: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: "text-amber-400",
    ring: "ring-amber-500/20",
    border: "border-amber-500/15",
  },
  blue: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    icon: "text-blue-400",
    ring: "ring-blue-500/20",
    border: "border-blue-500/15",
  },
  emerald: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: "text-emerald-400",
    ring: "ring-emerald-500/20",
    border: "border-emerald-500/15",
  },
  orange: {
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    icon: "text-orange-400",
    ring: "ring-orange-500/20",
    border: "border-orange-500/15",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function QuickStartPage() {
  return (
    <div className="text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute -top-20 right-1/4 h-48 w-48 rounded-full bg-purple-500/10 blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={staggerChild}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 mb-6">
                <Zap className="h-3.5 w-3.5" />
                Quick Start
              </span>
            </motion.div>

            <motion.h1
              variants={staggerChild}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-5"
            >
              Quick Start Guide
            </motion.h1>

            <motion.p
              variants={staggerChild}
              className="text-lg text-white/50 max-w-2xl mx-auto mb-8"
            >
              Create your first phonographic carousel in 5 minutes. Follow each step below to go from photos to a polished, ready-to-post carousel with style templates, audio, and creator provenance.
            </motion.p>

            {/* Breadcrumb links */}
            <motion.div
              variants={staggerChild}
              className="flex items-center justify-center gap-3 text-sm text-white/30"
            >
              <Link href="/guide" className="hover:text-white/50 transition-colors">
                User Guide
              </Link>
              <span>/</span>
              <Link href="/support" className="hover:text-white/50 transition-colors">
                Support
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STEPS                                                       */}
      {/* ============================================================ */}
      {STEPS.map((step) => {
        const colors = ACCENT_MAP[step.accent];
        const Icon = step.icon;
        const Mockup = step.mockup;

        return (
          <section
            key={step.step}
            className="border-b border-white/[0.06]"
          >
            <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {/* Step header */}
                <motion.div variants={staggerChild} className="mb-8">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-4 ${colors.badge}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    Step {step.step}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {step.title}
                  </h2>
                  <p className="text-white/40 text-lg">{step.subtitle}</p>
                </motion.div>

                {/* Content grid: description + mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <motion.div variants={staggerChild}>
                    <p className="text-white/50 leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Step navigation hint */}
                    {step.step < 5 && (
                      <div className="flex items-center gap-2 text-sm text-white/25">
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>
                          Next: Step {step.step + 1},{" "}
                          {STEPS[step.step]?.title}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Mockup card */}
                  <motion.div
                    variants={staggerChild}
                    className="relative"
                  >
                    {/* Background glow for contrast against dark page */}
                    <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-30 ${
                      step.accent === "purple" ? "bg-purple-500/20" :
                      step.accent === "amber" ? "bg-amber-500/20" :
                      step.accent === "blue" ? "bg-blue-500/20" :
                      step.accent === "emerald" ? "bg-emerald-500/20" :
                      "bg-orange-500/20"
                    }`} />
                    <div className="relative rounded-2xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur-sm overflow-hidden ring-1 ring-white/[0.04]">
                      <MockWindowChrome label={step.title} step={step.step} />
                      <Mockup />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* ============================================================ */}
      {/*  NEXT STEPS                                                   */}
      {/* ============================================================ */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              What&apos;s Next?
            </h2>
            <p className="text-white/40">
              You&apos;re ready to create. Explore these resources to learn more.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <motion.div variants={staggerChild}>
              <Link
                href="/guide"
                className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                    User Guide
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Full documentation and tips
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
              </Link>
            </motion.div>

            <motion.div variants={staggerChild}>
              <Link
                href="/support"
                className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Support FAQ
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Answers to common questions
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
              </Link>
            </motion.div>

            <motion.div variants={staggerChild}>
              <Link
                href="/billing"
                className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Pricing & Plans
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Compare tiers and features
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-white/30 text-sm">
            KodaPost &middot; The carousel maker for indie brands and content creators
          </p>
        </div>
      </section>
    </div>
  );
}
