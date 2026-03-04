export const SUPPORTED_LANGUAGES = ["en", "ko", "zh", "ja", "tl"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<
  Language,
  { native: string; english: string; flag: string }
> = {
  en: { native: "English", english: "English", flag: "🇺🇸" },
  ko: { native: "한국어", english: "Korean", flag: "🇰🇷" },
  zh: { native: "中文", english: "Chinese", flag: "🇨🇳" },
  ja: { native: "日本語", english: "Japanese", flag: "🇯🇵" },
  tl: { native: "Tagalog", english: "Tagalog", flag: "🇵🇭" },
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ko: "Korean",
  zh: "Simplified Chinese",
  ja: "Japanese",
  tl: "Tagalog",
};

export type TranslationNamespace =
  | "common"
  | "splash"
  | "introduction"
  | "quickstart"
  | "about"
  | "support"
  | "guide";

export type TranslationDict = Record<string, string>;
