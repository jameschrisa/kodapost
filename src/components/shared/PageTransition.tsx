"use client";

import { motion } from "framer-motion";
import { pageTransitionVariants } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Mount-only fade + slide-up animation for page transitions. */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
