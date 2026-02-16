"use client";

import { type ReactNode, useState } from "react";
import { HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CardHelpIconProps {
  title: string;
  children: ReactNode;
}

export function CardHelpIcon({ title, children }: CardHelpIconProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={`Help: ${title}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <AnimatePresence>
        {open && (
          <PopoverContent
            asChild
            side="top"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ type: "spring", ...springSnappy, duration: 0.2 }}
            >
              <p className="text-xs font-semibold mb-1.5">{title}</p>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {children}
              </div>
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  );
}
