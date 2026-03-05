"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Language,
  TranslationDict,
  TranslationNamespace,
} from "./types";
import { SUPPORTED_LANGUAGES } from "./types";

// ---------------------------------------------------------------------------
// English bundles (statically imported so they're always available)
// ---------------------------------------------------------------------------

import enCommon from "./locales/en/common.json";
import enSplash from "./locales/en/splash.json";
import enIntroduction from "./locales/en/introduction.json";
import enQuickstart from "./locales/en/quickstart.json";
import enAbout from "./locales/en/about.json";
import enSupport from "./locales/en/support.json";
import enGuide from "./locales/en/guide.json";

const EN_BUNDLES: Record<TranslationNamespace, TranslationDict> = {
  common: enCommon,
  splash: enSplash,
  introduction: enIntroduction,
  quickstart: enQuickstart,
  about: enAbout,
  support: enSupport,
  guide: enGuide,
};

// ---------------------------------------------------------------------------
// Dynamic loaders for non-English languages
// ---------------------------------------------------------------------------

type DynamicLoader = () => Promise<{ default: TranslationDict }>;

const LOADERS: Record<
  Exclude<Language, "en">,
  Record<TranslationNamespace, DynamicLoader>
> = {
  ko: {
    common: () => import("./locales/ko/common.json"),
    splash: () => import("./locales/ko/splash.json"),
    introduction: () => import("./locales/ko/introduction.json"),
    quickstart: () => import("./locales/ko/quickstart.json"),
    about: () => import("./locales/ko/about.json"),
    support: () => import("./locales/ko/support.json"),
    guide: () => import("./locales/ko/guide.json"),
  },
  zh: {
    common: () => import("./locales/zh/common.json"),
    splash: () => import("./locales/zh/splash.json"),
    introduction: () => import("./locales/zh/introduction.json"),
    quickstart: () => import("./locales/zh/quickstart.json"),
    about: () => import("./locales/zh/about.json"),
    support: () => import("./locales/zh/support.json"),
    guide: () => import("./locales/zh/guide.json"),
  },
  ja: {
    common: () => import("./locales/ja/common.json"),
    splash: () => import("./locales/ja/splash.json"),
    introduction: () => import("./locales/ja/introduction.json"),
    quickstart: () => import("./locales/ja/quickstart.json"),
    about: () => import("./locales/ja/about.json"),
    support: () => import("./locales/ja/support.json"),
    guide: () => import("./locales/ja/guide.json"),
  },
  tl: {
    common: () => import("./locales/tl/common.json"),
    splash: () => import("./locales/tl/splash.json"),
    introduction: () => import("./locales/tl/introduction.json"),
    quickstart: () => import("./locales/tl/quickstart.json"),
    about: () => import("./locales/tl/about.json"),
    support: () => import("./locales/tl/support.json"),
    guide: () => import("./locales/tl/guide.json"),
  },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const STORAGE_KEY = "kodapost:language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dictionaries: Record<string, TranslationDict>;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  dictionaries: {},
});

/**
 * Detects the best supported language from the browser's locale preferences.
 * Checks navigator.languages (ordered by preference) then navigator.language.
 * Matches exact codes first (e.g. "ko"), then base language from regional
 * variants (e.g. "zh-CN" → "zh", "ja-JP" → "ja", "tl-PH" → "tl").
 */
function detectBrowserLanguage(): Language | null {
  if (typeof navigator === "undefined") return null;
  const candidates = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  for (const locale of candidates) {
    const lower = locale.toLowerCase();
    // Exact match (e.g. "ko", "zh", "ja", "tl", "en")
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lower)) {
      return lower as Language;
    }
    // Base language from regional variant (e.g. "zh-cn" → "zh", "ko-kr" → "ko")
    const base = lower.split("-")[0];
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(base)) {
      return base as Language;
    }
  }
  return null;
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  // 1. User's explicit choice always wins
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as Language;
  }
  // 2. Auto-detect from browser locale on first visit
  const detected = detectBrowserLanguage();
  if (detected) return detected;
  // 3. Default to English
  return "en";
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [dictionaries, setDictionaries] = useState<
    Record<string, TranslationDict>
  >({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const initial = getInitialLanguage();
    setLanguageState(initial);
    setHydrated(true);
  }, []);

  // Load dictionaries when language changes
  useEffect(() => {
    if (!hydrated) return;
    if (language === "en") {
      // English is statically bundled, no loading needed
      setDictionaries({});
      return;
    }

    const loaders = LOADERS[language];
    if (!loaders) return;

    const namespaces = Object.keys(loaders) as TranslationNamespace[];
    let cancelled = false;

    Promise.all(
      namespaces.map(async (ns) => {
        try {
          const mod = await loaders[ns]();
          return [ns, mod.default] as const;
        } catch {
          return [ns, {}] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const loaded: Record<string, TranslationDict> = {};
      for (const [ns, dict] of entries) {
        loaded[`${language}:${ns}`] = dict;
      }
      setDictionaries(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [language, hydrated]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const value = useMemo(
    () => ({ language: hydrated ? language : "en", setLanguage, dictionaries }),
    [language, setLanguage, dictionaries, hydrated]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  return { language, setLanguage };
}

export function useTranslation(namespace: TranslationNamespace) {
  const { language, dictionaries } = useContext(LanguageContext);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      // For non-English, look up in loaded dictionaries
      if (language !== "en") {
        const dict = dictionaries[`${language}:${namespace}`];
        if (dict?.[key]) return dict[key];
      }
      // Fall back to English bundle
      const enDict = EN_BUNDLES[namespace];
      return enDict?.[key] ?? fallback ?? key;
    },
    [language, dictionaries, namespace]
  );

  return { t, language };
}
