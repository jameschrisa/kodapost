"use client";

import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./context";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "./types";
import type { Language } from "./types";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** Compact mode shows only the globe icon */
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact, className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const current = LANGUAGE_LABELS[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(
            "gap-1.5 text-sm font-medium",
            compact && "h-8 w-8",
            className
          )}
        >
          <Globe className="h-4 w-4" />
          {!compact && (
            <span className="hidden sm:inline">{current.native}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const info = LANGUAGE_LABELS[lang];
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang as Language)}
              className={cn(
                "gap-2 cursor-pointer",
                lang === language && "bg-accent"
              )}
            >
              <span className="text-base leading-none">{info.flag}</span>
              <span>{info.native}</span>
              {info.native !== info.english && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {info.english}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
