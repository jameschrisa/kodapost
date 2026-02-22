"use client";

import { createContext, useContext } from "react";

interface TourContextValue {
  /** Navigate the app to the screen required by the given tour step index,
   *  then resolve after the Framer Motion transition (~600 ms). */
  navigateForTourStep: (tourStepIdx: number) => Promise<void>;
}

export const TourContext = createContext<TourContextValue | null>(null);

export function useTourContext() {
  return useContext(TourContext);
}
