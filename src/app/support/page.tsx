"use client";

import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  HelpCircle,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "What is KodaPost?",
    answer:
      "KodaPost is a carousel creation tool that transforms your photos into polished, share-ready social media posts. You upload photos, Koda (our AI assistant) generates text overlays and captions, and you export or publish directly to your social accounts.",
  },
  {
    category: "Getting Started",
    question: "Do I need an account to use KodaPost?",
    answer:
      "You can create carousels without signing in. An account is required if you want to connect social media accounts for direct publishing, save drafts across sessions, or access premium features.",
  },
  {
    category: "Getting Started",
    question: "How do I start creating my first carousel?",
    answer:
      "Click Get Started on the welcome screen. Drag and drop your photos onto the upload area, or click to browse your files. Follow the five-step workflow: Upload, Craft, Design, Review, and Publish. Use the interactive tour (Menu > Help > Take a Tour) for a guided walkthrough.",
  },
  {
    category: "Getting Started",
    question: "Is there a mobile app?",
    answer:
      "KodaPost is a web app that works on all modern browsers including mobile. For a fully native mobile experience, you can also create carousels via the @kodacontentbot Telegram bot.",
  },
  {
    category: "Getting Started",
    question: "What is Creator Provenance?",
    answer:
      "Creator Provenance embeds authorship data directly into your exported images. When enabled, KodaPost writes your creator name, copyright notice, software tag, and a SHA-256 image fingerprint into EXIF metadata. Each carousel is also signed with an Ed25519 digital signature for tamper-proof verification. You can choose from four watermark modes: Visible Text, Brand Logo, Hidden Only, or Logo + Hidden. It is available on Creator Mode ($19/mo) and Monster Mode ($39/mo) plans.",
  },
  {
    category: "Getting Started",
    question: "How do I register provenance for my carousel?",
    answer:
      "Provenance is registered automatically when you export your carousel with Creator Provenance enabled. Open the Publish step, make sure Creator Provenance is toggled on, then export. KodaPost embeds your creator name, copyright, SHA-256 image fingerprint, and an Ed25519 digital signature into each exported image. No wallet, no blockchain, no extra steps required.",
  },
  {
    category: "Getting Started",
    question: "How does provenance verification work?",
    answer:
      "Each exported image contains an Ed25519 digital signature in its EXIF metadata. Anyone with the KodaPost public key can verify that the image was created by you and has not been tampered with since export. The verification checks the image hash, creator name, and timestamp against the embedded signature. You can verify images using any EXIF viewer that displays the signature field.",
  },
  {
    category: "Getting Started",
    question: "Does provenance cost anything?",
    answer:
      "No. Creator Provenance uses Ed25519 cryptographic signing, which is free and instant. There are no transaction fees, no wallet setup, and no third-party service costs. The only requirement is a Creator Mode or Monster Mode plan.",
  },
  {
    category: "Getting Started",
    question: "Is there a Quick Start Guide?",
    answer:
      "Yes! The Quick Start Guide walks you through each of the 5 workflow steps (Upload, Craft, Design, Review, Publish) with visual mockups so you can follow along. Visit /quickstart or open Menu > Help > Quick Start in the app.",
  },
  // Uploads & Formats
  {
    category: "Uploads & Formats",
    question: "What image formats are supported?",
    answer:
      "KodaPost accepts JPEG, PNG, WebP, and HEIC/HEIF files. HEIC files (common on iPhones) are automatically converted to JPEG during upload.",
  },
  {
    category: "Uploads & Formats",
    question: "What is the maximum file size per image?",
    answer:
      "Each image must be 10 MB or smaller. For best results, use high-resolution photos (at least 1080 x 1080 px).",
  },
  {
    category: "Uploads & Formats",
    question: "How many photos can I upload?",
    answer:
      "You can upload between 1 and 10 photos per carousel. For the best carousel experience, 3 to 6 photos is recommended.",
  },
  {
    category: "Uploads & Formats",
    question: "Can I reorder photos after uploading?",
    answer:
      "Yes. In the Design step, drag and drop slides to reorder them. The first slide becomes the cover image of your carousel.",
  },
  // Filters & Style
  {
    category: "Filters & Style",
    question: "What are camera emulation filters?",
    answer:
      "Camera filters replicate the look of classic film cameras, adjusting color grading, grain, contrast, and tone to give your photos a distinctive aesthetic. Choose from cameras like Kodak Gold, Fuji Velvia, Polaroid, and more.",
  },
  {
    category: "Filters & Style",
    question: "Can I adjust the filter intensity?",
    answer:
      "Yes. In the Craft step, use the sliders to control grain, vignette, bloom, saturation, contrast, and other parameters independently of the camera preset.",
  },
  {
    category: "Filters & Style",
    question: "Can I change the filter after generating?",
    answer:
      "Yes. Filters are applied as live CSS overlays at export time. Return to the Craft step at any time to change the camera style, predefined filter, or fine-tune the sliders, then regenerate.",
  },
  {
    category: "Filters & Style",
    question: "How do I use style templates?",
    answer:
      "In the Design step, open the text editing panel for any slide and look for the Style Templates section. Templates provide preset combinations of font, size, weight, color, background, and text shadow. Click a template to apply it to your current slide. You can browse options like Bold Statement, Minimal Clean, Vintage Warmth, and more.",
  },
  {
    category: "Filters & Style",
    question: "Can I customize a style template after applying it?",
    answer:
      "Yes. Templates are starting points, not locked presets. After applying a template, you can adjust any individual property (font, size, color, background, shadow) using the text editing controls. Your manual changes override the template defaults.",
  },
  // AI Generation
  {
    category: "AI Generation",
    question: "How does Koda generate text overlays?",
    answer:
      "Koda analyzes your uploaded photos and your carousel theme to suggest text overlays for each slide. The AI uses visual context (mood, composition, subject) combined with your style preferences to write concise, compelling slide text.",
  },
  {
    category: "AI Generation",
    question: "Can I edit the generated text?",
    answer:
      "Yes. Every text overlay can be edited in the Design step. You can also toggle text on or off per slide, change font style, and adjust text position.",
  },
  {
    category: "AI Generation",
    question: "Does Koda store my photos?",
    answer:
      "Photos are sent to the Koda processing pipeline solely to generate your carousel content. We do not permanently store your images on our servers after processing completes. See our Privacy Policy for full details.",
  },
  // Audio & Music
  {
    category: "Audio & Music",
    question: "What music can I use in my carousel?",
    answer:
      "KodaPost includes a built-in music library powered by Jamendo (Creative Commons licensed tracks) and Audius. You can search by keyword, filter by genre (Ambient, Electronic, Lo-Fi, Pop, Hip-Hop, Jazz, Classical, Rock), toggle instrumental-only, and preview tracks before selecting. All Jamendo tracks include proper CC attribution automatically.",
  },
  {
    category: "Audio & Music",
    question: "How does auto-trim work?",
    answer:
      "When you select a track or upload audio, KodaPost calculates the ideal duration based on your slide count. The recommended length is 4.5 seconds per slide (the \"Goldilocks zone\"). If your audio is longer than this, it is automatically trimmed to fit. You can drag the trim handles to adjust the start and end points manually.",
  },
  {
    category: "Audio & Music",
    question: "Can I use my own audio?",
    answer:
      "Yes. In the audio panel, choose Upload Audio to select a file from your device (MP3, WAV, M4A, OGG, WebM, or AAC, up to 50 MB and 10 minutes). You can also choose Record Voice to capture a voiceover directly in your browser using your microphone.",
  },
  {
    category: "Audio & Music",
    question: "Why did my audio disappear after reloading the page?",
    answer:
      "Audio clips use temporary browser URLs (blob URLs) that do not survive page reloads. If you reload or close the tab, you will need to re-add the audio track. Your audio selection metadata is preserved so KodaPost shows which track was previously applied. Click Clear and Re-add, then select the same track again.",
  },
  // Publishing
  {
    category: "Publishing",
    question: "Which platforms can I publish to?",
    answer:
      "KodaPost supports direct publishing to Instagram, TikTok, and LinkedIn via OAuth. YouTube, YouTube Shorts, X/Twitter, and Reddit support export for manual posting. You can also export a platform-optimised ZIP for any platform.",
  },
  {
    category: "Publishing",
    question: "How do I connect a social media account?",
    answer:
      "Open Menu > Social Media Settings (or the Settings icon). Click Connect next to the platform you want. Complete the OAuth authorisation in the new browser tab. Return to KodaPost and the platform will show as connected.",
  },
  {
    category: "Publishing",
    question: "Can I publish to multiple platforms at once?",
    answer:
      "Yes. In the Publish step, select all the platforms you want to post to, then click Post Now. KodaPost publishes sequentially and shows a success confirmation for each platform.",
  },
  {
    category: "Publishing",
    question: "What metadata is embedded in exported images?",
    answer:
      "When Creator Provenance is enabled, each exported image includes EXIF metadata: Artist (your creator or brand name), Copyright (\"Made with [your name]\"), Software (\"KodaPost\"), and an ImageDescription field containing a SHA-256 fingerprint of the image and the creation timestamp. This metadata is embedded regardless of which watermark mode you choose, including Hidden Only. You can verify it with any EXIF viewer.",
  },
  // Brand & Watermarks
  {
    category: "Brand & Watermarks",
    question: "How do I upload a brand logo for watermarking?",
    answer:
      "Open Menu > Settings and select the Brand tab. Click the upload area under Brand Logo and choose a PNG file with a transparent background. The image must be between 64 and 512 pixels wide and under 500 KB. After uploading, configure your default position, opacity, and scale, then click Save Settings. You can also upload a logo directly from the Publish step.",
  },
  {
    category: "Brand & Watermarks",
    question: "What are the four watermark modes?",
    answer:
      "Visible Text places a small \"Made with [your name]\" line in the bottom-right corner. Brand Logo composites your uploaded PNG logo at a configurable position, opacity, and scale. Hidden Only embeds EXIF metadata with no visible mark. Logo + Hidden combines the logo watermark with metadata embedding.",
  },
  {
    category: "Brand & Watermarks",
    question: "What format should my brand logo be?",
    answer:
      "Use a PNG file with a transparent background. The image must be between 64 and 512 pixels wide, with a maximum file size of 500 KB. White or light-colored logos work best on photo backgrounds. Avoid overly complex artwork that becomes hard to read at small sizes.",
  },
  {
    category: "Brand & Watermarks",
    question: "Can I adjust the logo watermark per export?",
    answer:
      "Yes. Your defaults are loaded from Settings, but you can override position, opacity, and scale in the Publish step each time you export. Changes made in the Publish step are also saved back to your settings for next time.",
  },
  // Accounts & Billing
  {
    category: "Accounts & Billing",
    question: "Is KodaPost free?",
    answer:
      "KodaPost offers Explore Mode (free) with up to 10 AI-generated carousels per month and 1 saved draft. Premium plans include Creator Mode ($19/mo) with 200 generations, 5 drafts, direct publishing, and Creator Provenance. Monster Mode ($39/mo) offers unlimited generations, 15 drafts that never expire, and priority support.",
  },
  {
    category: "Accounts & Billing",
    question: "How do I upgrade my plan?",
    answer:
      "Go to the Billing page (Menu > Billing, or visit /billing). You will see all three plans side by side. Click the upgrade button on the plan you want. You will be redirected to a secure Stripe checkout page to complete payment.",
  },
  {
    category: "Accounts & Billing",
    question: "How do I manage my subscription?",
    answer:
      "Visit the Billing page and click Manage Subscription. This opens the Stripe billing portal where you can update your payment method, view invoices, download receipts, or change your plan. You can also see your subscription status and renewal date directly on the Billing page.",
  },
  {
    category: "Accounts & Billing",
    question: "Can I cancel my subscription?",
    answer:
      "Yes. Open the Billing page and click Manage Subscription to access the Stripe billing portal. From there, click Cancel Plan. You retain access to premium features until the end of your current billing period.",
  },
  // Troubleshooting
  {
    category: "Troubleshooting",
    question: "My upload failed. What should I check?",
    answer:
      "Ensure the file is JPEG, PNG, WebP, or HEIC and under 10 MB. If the file is HEIC, wait for the automatic conversion dialog to complete. Try a different browser if the issue persists (Chrome or Safari recommended).",
  },
  {
    category: "Troubleshooting",
    question: "The carousel generation failed. What do I do?",
    answer:
      "Check your internet connection and try again. If the error persists, try reducing the number of slides or uploading fewer images. Contact support with the error message if it continues.",
  },
  {
    category: "Troubleshooting",
    question: "Publishing to Instagram failed. Why?",
    answer:
      "Ensure your Instagram account is a Professional account (Creator or Business). Personal accounts do not support API publishing. Try disconnecting and reconnecting your Instagram account in Settings. Instagram tokens expire periodically, so reconnect to refresh your access.",
  },
  {
    category: "Troubleshooting",
    question: "My project data disappeared. How do I recover it?",
    answer:
      "Project data is stored in your browser's local storage. It may be lost if you cleared browser data, used a different browser, or opened KodaPost in a private/incognito window. We recommend exporting your carousel ZIP frequently as a backup.",
  },
  {
    category: "Troubleshooting",
    question: "My export is taking too long. What can I do?",
    answer:
      "Large carousels with high-resolution images or video reels may take longer to process. If the export stalls, use the Cancel button to stop it, then retry. Try reducing the number of slides or image resolution if the problem persists. Make sure your browser tab stays in focus during export.",
  },
  {
    category: "Troubleshooting",
    question: "The app feels cramped on my phone. Any tips?",
    answer:
      "KodaPost is optimized for mobile browsers with safe-area support and touch-friendly controls. For the best experience, use your device in portrait mode and add KodaPost to your home screen as a PWA for full-screen viewing. If buttons feel too small, try zooming in slightly or rotating to landscape for the Design step.",
  },
  {
    category: "Troubleshooting",
    question: "My audio track disappeared after a page reload.",
    answer:
      "Audio clips use temporary blob URLs that do not persist across page reloads. This is a browser limitation, not a bug. When you reopen your project, the audio panel will show a prompt to re-add your track. Click Clear and Re-add, then select the same music or upload your file again.",
  },
];

const FAQ_CATEGORIES = [
  "Getting Started",
  "Uploads & Formats",
  "Filters & Style",
  "AI Generation",
  "Audio & Music",
  "Publishing",
  "Brand & Watermarks",
  "Accounts & Billing",
  "Troubleshooting",
];

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
/*  Contact form state                                                 */
/* ------------------------------------------------------------------ */

type FormStatus = "idle" | "submitting" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contact form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");
  const contactRef = useRef<HTMLDivElement>(null);

  // Filter FAQs by search query and active category
  const filteredFaqs = useMemo(() => {
    let items = FAQ_DATA;
    if (activeCategory) {
      items = items.filter((faq) => faq.category === activeCategory);
    }
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [searchQuery, activeCategory]);

  // AI-assisted search: when user types a question-like query, try to suggest an answer
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setAiSuggestion(null);

    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    // Only trigger AI suggestion for longer queries that look like questions
    if (value.trim().length > 15) {
      aiTimeoutRef.current = setTimeout(() => {
        generateAiSuggestion(value.trim());
      }, 800);
    }
  };

  const generateAiSuggestion = async (query: string) => {
    // First check if any FAQ matches well
    const q = query.toLowerCase();
    const bestMatch = FAQ_DATA.find(
      (faq) =>
        faq.question.toLowerCase().includes(q) ||
        q.includes(faq.question.toLowerCase().replace(/[?]/g, ""))
    );
    if (bestMatch) {
      setAiSuggestion(bestMatch.answer);
      return;
    }

    // For queries that don't match FAQ directly, call the AI endpoint
    setAiLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest", query }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
        }
      }
    } catch {
      // Silently fail — AI suggestion is a nice-to-have
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");
    setFormError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contact",
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMessage,
        }),
      });

      if (res.ok) {
        setFormStatus("success");
        setFormName("");
        setFormEmail("");
        setFormSubject("");
        setFormMessage("");
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Something went wrong. Please try again.");
        setFormStatus("error");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setFormStatus("error");
    }
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Background gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
          <div className="absolute -top-20 right-1/4 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={staggerChild}>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 mb-6">
                <HelpCircle className="h-3.5 w-3.5" />
                Support Center
              </span>
            </motion.div>

            <motion.h1
              variants={staggerChild}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-5"
            >
              How Can We Help?
            </motion.h1>

            <motion.p
              variants={staggerChild}
              className="text-lg text-white/50 max-w-2xl mx-auto mb-10"
            >
              Search our FAQs, browse the user guide, or contact our team directly.
            </motion.p>

            {/* Search bar */}
            <motion.div variants={staggerChild} className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="text"
                placeholder="Search for help (e.g. &quot;How do I publish to Instagram?&quot;)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-12 pr-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              {aiLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 animate-spin" />
              )}
            </motion.div>

            {/* AI suggestion */}
            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-purple-300 mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested Answer
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{aiSuggestion}</p>
                <p className="text-xs text-white/30 mt-3">
                  Still need help?{" "}
                  <button
                    onClick={scrollToContact}
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                  >
                    Contact our team
                  </button>
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  QUICK LINKS                                                  */}
      {/* ============================================================ */}
      <section className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr"
          >
            {[
              {
                href: "#faq",
                icon: HelpCircle,
                iconBg: "bg-amber-500/10",
                iconColor: "text-amber-400",
                hoverColor: "group-hover:text-amber-300",
                title: "Browse FAQs",
                description: "Answers to common questions",
              },
              {
                href: "/guide",
                icon: BookOpen,
                iconBg: "bg-blue-500/10",
                iconColor: "text-blue-400",
                hoverColor: "group-hover:text-blue-300",
                title: "User Guide",
                description: "Step-by-step documentation",
              },
              {
                href: "#contact",
                icon: MessageCircle,
                iconBg: "bg-purple-500/10",
                iconColor: "text-purple-400",
                hoverColor: "group-hover:text-purple-300",
                title: "Contact Us",
                description: "Send a message to our team",
                onClick: scrollToContact,
              },
              {
                href: "/quickstart",
                icon: Zap,
                iconBg: "bg-emerald-500/10",
                iconColor: "text-emerald-400",
                hoverColor: "group-hover:text-emerald-300",
                title: "Quick Start Guide",
                description: "Visual walkthrough in 5 steps",
              },
            ].map((item) => {
              const inner = (
                <span className="group flex h-full flex-col justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold text-white ${item.hoverColor} transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
                  </div>
                </span>
              );
              return (
                <motion.div key={item.title} variants={staggerChild} className="flex">
                  {item.onClick ? (
                    <button type="button" onClick={item.onClick} className="flex w-full text-left">
                      {inner}
                    </button>
                  ) : item.href.startsWith("#") ? (
                    <a href={item.href} className="flex w-full">
                      {inner}
                    </a>
                  ) : (
                    <Link href={item.href} className="flex w-full">
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ SECTION                                                  */}
      {/* ============================================================ */}
      <section id="faq" className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-white/40">
              Find quick answers organized by topic.
            </p>
          </motion.div>

          {/* Category filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === null
                  ? "bg-purple-500 text-white"
                  : "bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              All
            </button>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-purple-500 text-white"
                    : "bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto space-y-2"
          >
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40 mb-4">
                  No matching questions found.
                </p>
                <button
                  onClick={scrollToContact}
                  className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  Ask our support team instead
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const globalIdx = FAQ_DATA.indexOf(faq);
                const isOpen = expandedFaq === globalIdx;
                return (
                  <motion.div
                    key={globalIdx}
                    variants={staggerChild}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(isOpen ? null : globalIdx)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/40">
                          {faq.category}
                        </span>
                        <span className="text-sm font-medium text-white/80 truncate">
                          {faq.question}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
                      )}
                    </button>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.04] px-5 py-4"
                      >
                        <p className="text-sm text-white/50 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CONTACT FORM                                                 */}
      {/* ============================================================ */}
      <section ref={contactRef} id="contact" className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left column: Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-300 mb-6">
                <Mail className="h-3.5 w-3.5" />
                Get in Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Contact Our Team
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Have a question the FAQ didn&apos;t answer? Ran into a bug?
                Want to request a feature? Send us a message and we&apos;ll
                get back to you within 24 hours.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <Mail className="h-4 w-4 text-orange-400" />
                  <a
                    href="mailto:support@kodapost.app"
                    className="hover:text-white/60 transition-colors"
                  >
                    support@kodapost.app
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                  <a
                    href="https://t.me/kodacontentbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/60 transition-colors"
                  >
                    @kodacontentbot on Telegram
                  </a>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Helpful Resources
                </h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/guide"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      User Guide
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      Frequently Asked Questions
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/billing"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Pricing & Plans
                    </Link>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Right column: Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
            >
              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center h-full rounded-xl border border-green-500/20 bg-green-500/[0.06] p-10 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Message Sent
                  </h3>
                  <p className="text-sm text-white/50 mb-6">
                    We&apos;ll get back to you within 24 hours. Check your inbox
                    for a confirmation.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setFormStatus("idle")}
                    className="text-white/50 hover:text-white"
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitContact}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/60">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        placeholder="Your name"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/60">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white/60">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      required
                      placeholder="What can we help with?"
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white/60">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Describe your issue or question in detail..."
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50 resize-y"
                    />
                  </div>

                  {formStatus === "error" && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {formError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className="w-full gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                    size="lg"
                  >
                    {formStatus === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-white/25 text-center">
                    By submitting, you agree to our{" "}
                    <Link
                      href="/legal/privacy"
                      className="underline underline-offset-2 hover:text-white/40"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER CTA                                                   */}
      {/* ============================================================ */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-white/30 text-sm">
            KodaPost &middot; The carousel maker for indie brands and content creators
          </p>
        </div>
      </section>
    </div>
  );
}
