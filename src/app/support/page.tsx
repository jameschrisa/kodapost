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
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

/* ------------------------------------------------------------------ */
/*  FAQ helpers                                                        */
/* ------------------------------------------------------------------ */

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_COUNT = 44; // faq.0 through faq.43
const FAQ_CATEGORY_COUNT = 9; // faq.categories.0 through faq.categories.8

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
  const { t } = useTranslation("support");
  const { t: tc } = useTranslation("common");

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

  // Build FAQ data from translation keys
  const FAQ_DATA: FAQItem[] = useMemo(() => {
    const items: FAQItem[] = [];
    for (let i = 0; i < FAQ_COUNT; i++) {
      items.push({
        category: t(`faq.${i}.category`),
        question: t(`faq.${i}.question`),
        answer: t(`faq.${i}.answer`),
      });
    }
    return items;
  }, [t]);

  // Build FAQ categories from translation keys
  const FAQ_CATEGORIES: string[] = useMemo(() => {
    const cats: string[] = [];
    for (let i = 0; i < FAQ_CATEGORY_COUNT; i++) {
      cats.push(t(`faq.categories.${i}`));
    }
    return cats;
  }, [t]);

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
  }, [searchQuery, activeCategory, FAQ_DATA]);

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
      // Silently fail -- AI suggestion is a nice-to-have
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
        setFormError(data.error || tc("error.somethingWentWrong"));
        setFormStatus("error");
      }
    } catch {
      setFormError(tc("error.networkError"));
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
            {/* Language switcher in the hero area */}
            <motion.div variants={staggerChild} className="flex justify-end mb-4">
              <LanguageSwitcher />
            </motion.div>

            <motion.div variants={staggerChild}>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 mb-6">
                <HelpCircle className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              variants={staggerChild}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-5"
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              variants={staggerChild}
              className="text-lg text-white/50 max-w-2xl mx-auto mb-10"
            >
              {t("hero.description")}
            </motion.p>

            {/* Search bar */}
            <motion.div variants={staggerChild} className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
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
                  {t("aiSuggestion.label")}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{aiSuggestion}</p>
                <p className="text-xs text-white/30 mt-3">
                  {t("aiSuggestion.stillNeedHelp")}{" "}
                  <button
                    onClick={scrollToContact}
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                  >
                    {t("aiSuggestion.contactTeam")}
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
                title: t("quickLinks.0.title"),
                description: t("quickLinks.0.description"),
              },
              {
                href: "/guide",
                icon: BookOpen,
                iconBg: "bg-blue-500/10",
                iconColor: "text-blue-400",
                hoverColor: "group-hover:text-blue-300",
                title: t("quickLinks.1.title"),
                description: t("quickLinks.1.description"),
              },
              {
                href: "#contact",
                icon: MessageCircle,
                iconBg: "bg-purple-500/10",
                iconColor: "text-purple-400",
                hoverColor: "group-hover:text-purple-300",
                title: t("quickLinks.2.title"),
                description: t("quickLinks.2.description"),
                onClick: scrollToContact,
              },
              {
                href: "/quickstart",
                icon: Zap,
                iconBg: "bg-emerald-500/10",
                iconColor: "text-emerald-400",
                hoverColor: "group-hover:text-emerald-300",
                title: t("quickLinks.3.title"),
                description: t("quickLinks.3.description"),
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
              {t("faq.heading")}
            </h2>
            <p className="text-white/40">
              {t("faq.subtitle")}
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
              {tc("label.all")}
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
                  {t("faq.noResults")}
                </p>
                <button
                  onClick={scrollToContact}
                  className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  {t("faq.askTeam")}
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
                {t("contact.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {t("contact.heading")}
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                {t("contact.description")}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <Mail className="h-4 w-4 text-orange-400" />
                  <a
                    href={`mailto:${t("contact.emailAddress")}`}
                    className="hover:text-white/60 transition-colors"
                  >
                    {t("contact.emailAddress")}
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
                    {t("contact.telegramHandle")}
                  </a>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  {t("contact.helpfulResources")}
                </h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/guide"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {t("contact.resourceUserGuide")}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {t("contact.resourceFaq")}
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/billing"
                      className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {t("contact.resourcePricing")}
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
                    {t("contact.success.title")}
                  </h3>
                  <p className="text-sm text-white/50 mb-6">
                    {t("contact.success.description")}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setFormStatus("idle")}
                    className="text-white/50 hover:text-white"
                  >
                    {t("contact.success.sendAnother")}
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
                        {tc("label.name")}
                      </Label>
                      <Input
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        placeholder={tc("placeholder.name")}
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/60">
                        {tc("label.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        required
                        placeholder={tc("placeholder.email")}
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white/60">
                      {tc("label.subject")}
                    </Label>
                    <Input
                      id="subject"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      required
                      placeholder={tc("placeholder.subject")}
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-purple-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white/60">
                      {tc("label.message")}
                    </Label>
                    <Textarea
                      id="message"
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder={tc("placeholder.message")}
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
                        {tc("button.sending")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {tc("button.sendMessage")}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-white/25 text-center">
                    {tc("legal.bySubmitting")}{" "}
                    <Link
                      href="/legal/privacy"
                      className="underline underline-offset-2 hover:text-white/40"
                    >
                      {tc("legal.privacyPolicyLink")}
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
            {tc("footer.brand")} &middot; {tc("footer.shortTagline")}
          </p>
        </div>
      </section>
    </div>
  );
}
