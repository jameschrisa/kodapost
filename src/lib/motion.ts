// =============================================================================
// KodaPost Motion System
// Centralized animation variants, springs, and transitions for Framer Motion.
// Prevents magic numbers scattered across components.
// =============================================================================

import type { Transition, Variants } from "framer-motion";

// -----------------------------------------------------------------------------
// Spring Presets
// -----------------------------------------------------------------------------

/** Snappy spring for buttons, toggles, small interactive elements */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

/** Gentle spring for content transitions, page changes */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/** Bouncy spring for celebratory moments, completed states */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
};

// -----------------------------------------------------------------------------
// Step Transition Variants (direction-aware)
// -----------------------------------------------------------------------------

/**
 * Direction-aware page transitions with blur depth-of-field effect.
 * `custom` prop should be 1 (forward) or -1 (backward).
 */
export const stepTransitionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      ...springGentle,
      opacity: { duration: 0.3 },
      filter: { duration: 0.3 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  }),
};

// -----------------------------------------------------------------------------
// Stagger Variants
// -----------------------------------------------------------------------------

/** Parent container that staggers its children's entrance */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

/** Individual child item — fades up from below */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

// -----------------------------------------------------------------------------
// Card Entrance Variants
// -----------------------------------------------------------------------------

/** Cards scale up + fade in + slide up on entrance */
export const cardEntranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

// -----------------------------------------------------------------------------
// Button Micro-Interaction
// -----------------------------------------------------------------------------

/** Scale-down effect for button press (whileTap) */
export const buttonTapScale = { scale: 0.97 };

// -----------------------------------------------------------------------------
// Breathing / Loading Variants
// -----------------------------------------------------------------------------

/** Pulsing breathing animation for loading states */
export const breathingVariants: Variants = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// -----------------------------------------------------------------------------
// Icon Swap Variants (for ThemeToggle, Test Connection icons)
// -----------------------------------------------------------------------------

/** Rotate + scale entrance for swapping icons */
export const iconSwapVariants: Variants = {
  initial: { scale: 0, rotate: -90, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: springSnappy,
  },
  exit: {
    scale: 0,
    rotate: 90,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// -----------------------------------------------------------------------------
// Page Transition Variants (mount-only, route changes)
// -----------------------------------------------------------------------------

/** Fade + slight slide-up on page mount. Used by PageTransition wrapper. */
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
