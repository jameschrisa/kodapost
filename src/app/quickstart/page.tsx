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
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

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

function MockWindowChrome({ label, step, stepLabel }: { label: string; step: number; stepLabel: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
      </div>
      <span className="text-xs font-medium text-white/50">
        {stepLabel} {step}: {label}
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

function UploadMockup({ t }: { t: (key: string, fallback?: string) => string; tc?: (key: string, fallback?: string) => string }) {
  return (
    <div className="p-5 space-y-4">
      <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
        <ImagePlus className="h-8 w-8 text-white/50 mx-auto mb-3" />
        <p className="text-sm text-white/50 mb-1">{t("mockup.upload.dropZone")}</p>
        <p className="text-xs text-white/50">{t("mockup.upload.fileHint")}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`aspect-square rounded-lg ${i <= 3 ? "bg-gradient-to-br from-white/8 to-white/4" : "border border-dashed border-white/8"} flex items-center justify-center`}>
            {i <= 3 ? <Camera className="h-3.5 w-3.5 text-white/50" /> : <span className="text-[10px] text-white/50">+</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {["JPEG", "PNG", "WebP", "HEIC"].map((fmt) => (
          <span key={fmt} className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/25">{fmt}</span>
        ))}
        <span className="text-[10px] text-white/50 ml-auto">{t("mockup.upload.photoCount")}</span>
      </div>
      <Callout number={1}>{t("mockup.upload.callout1")}</Callout>
      <Callout number={2}>{t("mockup.upload.callout2")}</Callout>
      <Callout number={3}>{t("mockup.upload.callout3")}</Callout>
    </div>
  );
}

function CraftMockup({ t }: { t: (key: string, fallback?: string) => string; tc?: (key: string, fallback?: string) => string }) {
  return (
    <div className="p-5 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{t("mockup.craft.themeLabel")}</label>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <span className="text-sm text-white/40">{t("mockup.craft.themePlaceholder")}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{t("mockup.craft.styleLabel")}</label>
        <div className="flex gap-1.5 overflow-hidden">
          {[
            { nameKey: "mockup.craft.styleBoldStatement", color: "bg-white/10" },
            { nameKey: "mockup.craft.styleVintageSerif", color: "bg-amber-900/30" },
            { nameKey: "mockup.craft.styleEditorial", color: "bg-white/8" },
          ].map((tpl, i) => (
            <div key={i} className={`flex-1 rounded-lg border ${i === 0 ? "border-purple-500/40 ring-1 ring-purple-500/20" : "border-white/[0.06]"} ${tpl.color} px-2 py-2 text-center`}>
              <Palette className="h-3 w-3 text-white/25 mx-auto mb-0.5" />
              <span className="text-[9px] text-white/50 leading-tight block">{t(tpl.nameKey)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{t("mockup.craft.filterLabel")}</label>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <Camera className="h-3.5 w-3.5 text-amber-400/60" />
          <span className="text-sm text-white/50">{t("mockup.craft.filterValue")}</span>
          <svg className="h-3 w-3 text-white/50 ml-auto" fill="none" viewBox="0 0 12 12"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{t("mockup.craft.vibesLabel")}</label>
        <div className="flex flex-wrap gap-1.5">
          {["relatable", "nostalgic", "warm"].map((vibe) => (
            <span key={vibe} className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/20 px-2.5 py-1 text-[11px] font-medium text-purple-300">
              <Hash className="h-2.5 w-2.5" />
              {t(`mockup.craft.vibe.${vibe}`, vibe)}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full border border-dashed border-white/10 px-2.5 py-1 text-[11px] text-white/50">{t("mockup.craft.addVibe")}</span>
        </div>
      </div>
      <Callout number={1}>{t("mockup.craft.callout1")}</Callout>
      <Callout number={2}>{t("mockup.craft.callout2")}</Callout>
      <Callout number={3}>{t("mockup.craft.callout3")}</Callout>
    </div>
  );
}

function DesignMockup({ t }: { t: (key: string, fallback?: string) => string; tc?: (key: string, fallback?: string) => string }) {
  return (
    <div className="p-5 space-y-4">
      <div className="relative rounded-xl overflow-hidden aspect-[4/5]">
        <img src="/assets/quickstart/slide-main.jpg" alt={t("mockup.design.slidePreviewAlt")} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-end p-4"><div className="w-full space-y-1"><div className="h-4 w-3/4 rounded bg-white/20" /><div className="h-3 w-1/2 rounded bg-white/10" /></div></div>
        <div className="absolute top-3 right-3"><GripVertical className="h-4 w-4 text-white/50" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center"><Type className="h-3.5 w-3.5 text-white/50 mx-auto mb-1" /><span className="text-[10px] text-white/25">{t("mockup.design.slideAlt", "Font")}</span></div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center"><Sliders className="h-3.5 w-3.5 text-white/50 mx-auto mb-1" /><span className="text-[10px] text-white/25">{t("mockup.design.slideAlt", "Position")}</span></div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center"><Palette className="h-3.5 w-3.5 text-white/50 mx-auto mb-1" /><span className="text-[10px] text-white/25">{t("mockup.design.slideAlt", "Color")}</span></div>
      </div>
      <div className="flex gap-1.5 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-10 w-10 shrink-0 rounded-md overflow-hidden ${i === 1 ? "ring-2 ring-purple-500" : "border border-white/[0.06]"}`}>
            <img src={`/assets/quickstart/thumb-${i}.jpg`} alt={`${t("mockup.design.slideAlt")} ${i}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <Callout number={1}>{t("mockup.design.callout1")}</Callout>
      <Callout number={2}>{t("mockup.design.callout2")}</Callout>
      <Callout number={3}>{t("mockup.design.callout3")}</Callout>
    </div>
  );
}

function ReviewMockup({ t }: { t: (key: string, fallback?: string) => string; tc?: (key: string, fallback?: string) => string }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1">
        {["Instagram", "TikTok", "LinkedIn", "X"].map((label, i) => (
          <button key={label} className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${i === 0 ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/40"}`}>{label}</button>
        ))}
      </div>
      <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1">
        {["YouTube", "Shorts", "Reddit"].map((label) => (
          <button key={label} className="flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors text-white/25 hover:text-white/40">{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`aspect-square rounded-lg overflow-hidden ${i <= 5 ? "relative" : "border border-dashed border-white/8 flex items-center justify-center"}`}>
            {i <= 5 ? (<><img src={`/assets/quickstart/grid-${i}.jpg`} alt={`${t("mockup.design.slideAlt", "Slide")} ${i}`} className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/40 bg-black/20">{i}</span></>) : null}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2"><Music className="h-3.5 w-3.5 text-white/25" /><span className="text-[11px] text-white/50">{t("mockup.review.audioTrack")}</span></div>
        <div className="flex items-end gap-px h-6">{Array.from({ length: 40 }).map((_, i) => (<div key={i} className="flex-1 bg-purple-500/20 rounded-t-sm" style={{ height: `${20 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%` }} />))}</div>
      </div>
      <Callout number={1}>{t("mockup.review.callout1")}</Callout>
      <Callout number={2}>{t("mockup.review.callout2")}</Callout>
      <Callout number={3}>{t("mockup.review.callout3")}</Callout>
    </div>
  );
}

function PublishMockup({ t, tc }: { t: (key: string, fallback?: string) => string; tc: (key: string, fallback?: string) => string }) {
  return (
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{t("mockup.publish.publishToLabel")}</label>
        {[
          { name: "Instagram", connected: true, checked: true },
          { name: "TikTok", connected: true, checked: true },
          { name: "LinkedIn", connected: false, checked: false },
          { name: "X/Twitter", connected: true, checked: true },
        ].map((platform) => (
          <div key={platform.name} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className={`h-4 w-4 rounded border ${platform.checked ? "bg-purple-500 border-purple-500" : "border-white/15 bg-transparent"} flex items-center justify-center`}>
              {platform.checked && (<svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
            </div>
            <span className={`text-sm ${platform.checked ? "text-white/60" : "text-white/25"}`}>{platform.name}</span>
            {!platform.connected && (<span className="text-[10px] text-white/50 ml-auto">{tc("status.notConnected")}</span>)}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <div className="flex items-center gap-2"><Fingerprint className="h-3.5 w-3.5 text-amber-400/50" /><span className="text-sm text-white/50">{t("mockup.publish.creatorProvenance")}</span></div>
        <ToggleRight className="h-5 w-5 text-purple-400" />
      </div>
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-2.5 text-sm font-medium text-purple-300"><Share2 className="h-4 w-4" />{tc("button.postNow")}</button>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/40"><Download className="h-4 w-4" />{tc("button.export")}</button>
      </div>
      <Callout number={1}>{t("mockup.publish.callout1")}</Callout>
      <Callout number={2}>{t("mockup.publish.callout2")}</Callout>
      <Callout number={3}>{t("mockup.publish.callout3")}</Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step data                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { step: 1, icon: Upload, accent: "purple", mockupKey: "upload" as const },
  { step: 2, icon: Paintbrush, accent: "amber", mockupKey: "craft" as const },
  { step: 3, icon: LayoutGrid, accent: "blue", mockupKey: "design" as const },
  { step: 4, icon: CheckCircle2, accent: "emerald", mockupKey: "review" as const },
  { step: 5, icon: Share2, accent: "orange", mockupKey: "publish" as const },
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
  const { t } = useTranslation("quickstart");
  const { t: tc } = useTranslation("common");

  const MOCKUP_MAP = {
    upload: UploadMockup,
    craft: CraftMockup,
    design: DesignMockup,
    review: ReviewMockup,
    publish: PublishMockup,
  } as const;

  return (
    <div className="text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute -top-20 right-1/4 h-48 w-48 rounded-full bg-purple-500/10 blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="absolute top-6 right-6"><LanguageSwitcher compact /></div>
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={staggerChild}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 mb-6">
                <Zap className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1 variants={staggerChild} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-5">
              {t("hero.title")}
            </motion.h1>

            <motion.p variants={staggerChild} className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
              {t("hero.description")}
            </motion.p>

            <motion.div variants={staggerChild} className="flex items-center justify-center gap-3 text-sm text-white/50">
              <Link href="/guide" className="hover:text-white/50 transition-colors">{t("hero.breadcrumb.userGuide")}</Link>
              <span>/</span>
              <Link href="/support" className="hover:text-white/50 transition-colors">{t("hero.breadcrumb.support")}</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STEPS                                                       */}
      {/* ============================================================ */}
      {STEPS.map((step, idx) => {
        const colors = ACCENT_MAP[step.accent];
        const Icon = step.icon;
        const Mockup = MOCKUP_MAP[step.mockupKey];
        const stepTitle = t(`steps.${idx}.title`);

        return (
          <section key={step.step} className="border-b border-white/[0.06]">
            <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
                <motion.div variants={staggerChild} className="mb-8">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-4 ${colors.badge}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {t("mockup.windowChrome.step")} {step.step}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{stepTitle}</h2>
                  <p className="text-white/40 text-lg">{t(`steps.${idx}.subtitle`)}</p>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <motion.div variants={staggerChild}>
                    <p className="text-white/50 leading-relaxed mb-6">{t(`steps.${idx}.description`)}</p>
                    {step.step < 5 && (
                      <div className="flex items-center gap-2 text-sm text-white/25">
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>{t("stepNav.next")} {step.step + 1}, {t(`steps.${idx + 1}.title`)}</span>
                      </div>
                    )}
                  </motion.div>
                  <motion.div variants={staggerChild} className="relative">
                    <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-30 ${
                      step.accent === "purple" ? "bg-purple-500/20" :
                      step.accent === "amber" ? "bg-amber-500/20" :
                      step.accent === "blue" ? "bg-blue-500/20" :
                      step.accent === "emerald" ? "bg-emerald-500/20" :
                      "bg-orange-500/20"
                    }`} />
                    <div className="relative rounded-2xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur-sm overflow-hidden ring-1 ring-white/[0.04]">
                      <MockWindowChrome label={stepTitle} step={step.step} stepLabel={t("mockup.windowChrome.step")} />
                      <Mockup t={t} tc={tc} />
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
              {t("nextSteps.title")}
            </h2>
            <p className="text-white/40">
              {t("nextSteps.subtitle")}
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
                    {t("nextSteps.userGuide.title")}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {t("nextSteps.userGuide.description")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50 ml-auto group-hover:text-white/40 transition-colors" />
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
                    {t("nextSteps.supportFaq.title")}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {t("nextSteps.supportFaq.description")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50 ml-auto group-hover:text-white/40 transition-colors" />
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
                    {t("nextSteps.pricing.title")}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {t("nextSteps.pricing.description")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50 ml-auto group-hover:text-white/40 transition-colors" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-white/50 text-sm">
            KodaPost &middot; {tc("footer.shortTagline")}
          </p>
        </div>
      </section>
    </div>
  );
}
