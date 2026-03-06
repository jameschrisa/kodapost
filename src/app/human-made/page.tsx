"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Fingerprint,
  ShieldCheck,
  ScanEye,
  Camera,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Animation helpers ── */

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

const WHY_POINTS = [
  {
    icon: ScanEye,
    title: "Screenshots get stolen daily",
    text: "Your art shows up in someone else's feed. No credit, no link, no way to prove it was yours first. Human Made changes that.",
  },
  {
    icon: Camera,
    title: "AI slop is drowning out real work",
    text: "Audiences are losing trust because they can't tell what's real anymore. A verified badge tells them: this was made by a human, and here's the proof.",
  },
  {
    icon: ShieldCheck,
    title: "Your reputation is your livelihood",
    text: "For indie creators, artists, and challenger brands, credibility is everything. Human Made gives you a verifiable record of authorship that no one can fake.",
  },
];

const WHAT_POINTS = [
  {
    title: "A unique fingerprint for every image",
    text: "When you export, KodaPost computes a one-of-a-kind digital fingerprint of your image. Think of it like a serial number that's mathematically tied to your exact pixels.",
  },
  {
    title: "A visual fingerprint that survives social media",
    text: "Platforms like Instagram and TikTok recompress your photos when you upload. KodaPost also creates a perceptual hash, a visual fingerprint that stays the same even after the platform changes the file. Your proof travels with your work.",
  },
  {
    title: "An industry-standard Content Credential",
    text: "KodaPost embeds a C2PA manifest (the same standard used by Adobe, Google, and Microsoft) directly into your image. Any C2PA-compatible tool can read it and confirm you're the original creator.",
  },
  {
    title: "A public verification page anyone can check",
    text: "Every signed image gets a short link (like kodapost.com/v/a3f2c1) that anyone can visit to see who created it, when, and verify the cryptographic signature. Share it in your bio, your DMs, or a dispute claim.",
  },
];

const HOW_STEPS = [
  {
    step: "1",
    title: "Create your carousel",
    text: "Upload your photos and build your carousel as usual. Nothing changes about your creative workflow.",
  },
  {
    step: "2",
    title: "Turn on Creator Provenance",
    text: "In the Publish step, toggle Creator Provenance on. That's it. One tap.",
  },
  {
    step: "3",
    title: "Export or publish",
    text: "KodaPost fingerprints every slide, signs the claim, embeds the Content Credential, and registers your record. All of this happens automatically in seconds.",
  },
  {
    step: "4",
    title: "Share your proof",
    text: "After export, you'll see your Human Made badge with a verification link. Share the link, add it to your bio, or keep it for your records. If anyone ever questions your work, you have the receipt.",
  },
];

const WHEN_SCENARIOS = [
  "You post original art and want proof you made it first",
  "You're building a brand and need visible, credible attribution",
  "You're worried about AI scrapers using your photos without permission",
  "Someone reposts your work without credit and you need evidence",
  "You work with clients and want to deliver verifiably authentic content",
  "You're an indie creator competing against faceless AI content farms",
];

/* ── Page ── */

export default function HumanMadePage() {
  return (
    <div className="overflow-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-28 sm:py-36">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, hsl(160 50% 15% / 0.5) 0%, transparent 60%), linear-gradient(to bottom, #0a0a0a, #000)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400"
          >
            <Fingerprint className="h-3.5 w-3.5" />
            Human Made
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            <span className="text-white">Made by a human.</span>
            <br />
            <span className="text-white/60">Proven by KodaPost.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOutExpo }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/60 leading-relaxed"
          >
            In a world flooded with AI-generated content, your audience deserves
            to know what&apos;s real. Human Made is how KodaPost protects your
            creative work with a digital fingerprint, a cryptographic signature,
            and an industry-standard content credential. All automatic. All
            verifiable. All yours.
          </motion.p>
        </div>
      </section>

      {/* ═══ WHY ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-black to-zinc-900">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-5xl"
        >
          <div className="text-center mb-14">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              The Problem
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Why does this matter?
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto leading-relaxed">
              The internet makes it easy to share your work. It also makes it
              easy for others to take credit for it. For independent creators,
              that&apos;s not just annoying. It&apos;s a threat to your income and identity.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {WHY_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  variants={staggerChild}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm"
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {point.text}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ WHAT ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-zinc-900 to-black">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-5xl"
        >
          <div className="text-center mb-14">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-400">
              How It Protects You
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              What is Human Made?
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto leading-relaxed">
              Four layers of protection, built into every export. You don&apos;t need
              to understand the cryptography. You just need to know it works.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {WHAT_POINTS.map((point, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {point.title}
                  </h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  {point.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ WHEN ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-black to-zinc-900">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl"
        >
          <div className="text-center mb-14">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
              Is This For You?
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              When should you use it?
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto leading-relaxed">
              If any of these sound like you, Human Made was built for your situation.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="space-y-3"
          >
            {WHEN_SCENARIOS.map((scenario, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-white/80 leading-relaxed">
                  {scenario}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ HOW ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-zinc-900 to-black">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-4xl"
        >
          <div className="text-center mb-14">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Simple as 1-2-3-4
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              How does it work?
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto leading-relaxed">
              You don&apos;t need to learn anything new. It&apos;s a single
              toggle in the Publish step. Everything else happens automatically.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {HOW_STEPS.map((item) => (
              <motion.div
                key={item.step}
                variants={staggerChild}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-lg font-bold mb-4">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-black">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, hsl(160 50% 15% / 0.3) 0%, transparent 60%)",
          }}
        />
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <Fingerprint className="h-10 w-10 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Your pixels. Your proof.
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Start protecting your creative work today. Creator Provenance is
            available on Creator Mode and Monster Mode plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-5 text-base font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300"
            >
              <Link href="/sign-up">
                Start Creating
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 px-8 py-5 text-base font-bold text-white hover:scale-105 transition-all duration-300"
            >
              <Link href="/guide#creator-provenance">
                <ExternalLink className="h-4 w-4 mr-2" />
                Technical Details
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-black to-zinc-900">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl"
        >
          <h2 className="text-2xl font-bold text-white mb-10 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="Do I need to understand cryptography to use this?"
              answer="Not at all. Just toggle Creator Provenance on when you publish. KodaPost handles the fingerprinting, signing, and embedding automatically. You get a verification link you can share with anyone."
            />
            <FaqItem
              question="What if someone screenshots my image instead of downloading it?"
              answer="The perceptual hash (visual fingerprint) still works. Even if someone screenshots, crops, or recompresses your image, the visual fingerprint is close enough to match. Your proof holds up regardless of how the image was captured."
            />
            <FaqItem
              question="What is C2PA and why should I care?"
              answer="C2PA is an open standard created by Adobe, Google, Microsoft, and others. It's the same technology major platforms are adopting to verify content authenticity. When KodaPost embeds a C2PA credential in your image, it's readable by any tool that supports the standard. Your proof isn't locked into one app."
            />
            <FaqItem
              question="Does this work after I post to Instagram or TikTok?"
              answer="Yes. Social platforms recompress images, which changes the exact file data. But the perceptual hash (visual fingerprint) survives recompression. The verification system can still match your posted image back to the original record."
            />
            <FaqItem
              question="Is my provenance data public?"
              answer="Your verification page (kodapost.com/v/[code]) is public so anyone can verify your work. It shows your creator name, creation date, and signature validity. Your actual images are never stored or displayed on the verification page."
            />
            <FaqItem
              question="Which plans include Human Made?"
              answer="Creator Provenance (including Human Made verification) is available on Creator Mode ($19/mo) and Monster Mode ($39/mo) plans."
            />
          </div>
        </motion.div>
      </section>

      {/* ═══ Footer link ═══ */}
      <div className="bg-zinc-900 px-6 py-8 text-center">
        <p className="text-xs text-white/30">
          Need help?{" "}
          <Link href="/guide#creator-provenance" className="underline hover:text-white/50 transition-colors">
            Read the full technical guide
          </Link>
          {" "} or{" "}
          <Link href="/contact" className="underline hover:text-white/50 transition-colors">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/* ── FAQ Item ── */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
      <h3 className="text-sm font-bold text-white mb-2">{question}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{answer}</p>
    </div>
  );
}
