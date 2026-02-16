"use client";

import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { breathingVariants } from "@/lib/motion";

const SIZES = {
  sm: { container: "h-6 w-6", icon: "h-3 w-3" },
  md: { container: "h-12 w-12", icon: "h-6 w-6" },
  lg: { container: "h-[72px] w-[72px]", icon: "h-8 w-8" },
} as const;

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
}: LoadingSpinnerProps) {
  const s = SIZES[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        variants={breathingVariants}
        animate="animate"
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary",
          s.container
        )}
      >
        <Camera className={s.icon} />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-sm text-muted-foreground"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
