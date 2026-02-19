"use client";

import { Bot, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ContentBotPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentBotPanel({ open, onOpenChange }: ContentBotPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <SheetTitle>Content Bot</SheetTitle>
            </div>
            <a
              href="https://t.me/kodacontentbot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Telegram
            </a>
          </div>
          <SheetDescription>
            Create carousels via conversation with @kodacontentbot
          </SheetDescription>
        </SheetHeader>

        {/* Telegram Web iframe */}
        <div className="flex-1 min-h-0">
          <iframe
            src="https://web.telegram.org/k/#@kodacontentbot"
            className="h-full w-full border-0"
            title="Content Bot - Telegram"
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
