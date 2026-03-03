"use client";

import { cn } from "@/lib/utils";
import { STYLE_TEMPLATES, type StyleTemplate, getFontFamilyWithFallback } from "@/lib/constants";

interface StyleTemplatePickerProps {
  activeTemplateId?: string;
  onApply: (template: StyleTemplate) => void;
}

export function StyleTemplatePicker({ activeTemplateId, onApply }: StyleTemplatePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {STYLE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onApply(template)}
          className={cn(
            "group relative rounded-lg border p-2 text-left transition-all",
            activeTemplateId === template.id
              ? "border-purple-400 bg-purple-500/10 ring-1 ring-purple-400"
              : "border-muted-foreground/20 hover:border-muted-foreground/40"
          )}
        >
          {/* Preview swatch */}
          <div
            className="mb-1.5 flex h-14 items-center justify-center rounded-md overflow-hidden"
            style={{ background: template.backgroundColor === "transparent" ? "#1a1a1a" : template.backgroundColor }}
          >
            <span
              className="truncate px-2 text-center leading-tight"
              style={{
                fontFamily: getFontFamilyWithFallback(template.fontFamily),
                fontSize: `${Math.min(template.fontSize * 0.35, 20)}px`,
                fontWeight: template.fontWeight,
                fontStyle: template.fontStyle,
                color: template.textColor,
                textShadow: template.textShadow ? "0 1px 4px rgba(0,0,0,0.7)" : "none",
              }}
            >
              Sample Text
            </span>
          </div>
          <p className="text-xs font-medium truncate">{template.name}</p>
          <p className="text-[10px] text-muted-foreground leading-snug truncate">{template.description}</p>
        </button>
      ))}
    </div>
  );
}
