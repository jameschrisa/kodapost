"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Mail, MessageCircle } from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What image formats are supported?",
    answer:
      "JPG, PNG, and WebP files up to 10 MB each. For best results, use high-resolution photos.",
  },
  {
    question: "How many slides can my carousel have?",
    answer:
      "Carousels support 2 to 12 slides. Most engaging carousels use 5\u20137 slides. Slides beyond your uploaded image count become text-only.",
  },
  {
    question: "Can I change filters after generating?",
    answer:
      "Yes! Filters are applied as live CSS overlays. Go back to the Configure step any time to change the camera style, predefined filter, or fine-tune sliders.",
  },
  {
    question: "How do I publish to social media?",
    answer:
      "Connect your accounts in Settings, then use the Publish step. You can also export individual slides as images or download the full carousel.",
  },
  {
    question: "What does \u2018No Emulation\u2019 do?",
    answer:
      "Selecting \u2018No Emulation\u2019 in the Camera section uses your photos as-is with no camera emulation. You can still apply a predefined filter or fine-tune adjustments independently.",
  },
];

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  function toggleFAQ(index: number) {
    setExpandedFAQ((prev) => (prev === index ? null : index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KodaPostIcon className="h-5 w-5" />
            KodaPost Help
          </DialogTitle>
          <DialogDescription>
            Learn how to create stunning carousels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quick Start Guide */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Quick Start</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              <li>Upload your photos (1\u201310 images)</li>
              <li>Pick a camera style and filter to set the mood</li>
              <li>Fine-tune grain, bloom, vignette, and color</li>
              <li>Edit AI-generated text overlays on each slide</li>
              <li>Review, reorder, and export or publish</li>
            </ol>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-sm font-semibold mb-2">FAQ</h3>
            <div className="space-y-1">
              {FAQ_ITEMS.map((item, index) => {
                const isExpanded = expandedFAQ === index;
                return (
                  <div key={index} className="border rounded-md">
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      {item.question}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pl-9 text-sm text-muted-foreground">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Contact & Support</h3>
            <div className="space-y-2">
              <a
                href="mailto:support@kodapost.app"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@kodapost.app
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Community Discord
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
