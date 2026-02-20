import { create } from "zustand";

interface LoadingState {
  operations: Map<string, string>;
  startLoading: (key: string, label: string) => void;
  stopLoading: (key: string) => void;
  isLoading: () => boolean;
  currentLabel: () => string;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  operations: new Map(),

  startLoading: (key, label) =>
    set((state) => {
      const next = new Map(state.operations);
      next.set(key, label);
      return { operations: next };
    }),

  stopLoading: (key) =>
    set((state) => {
      const next = new Map(state.operations);
      next.delete(key);
      return { operations: next };
    }),

  isLoading: () => get().operations.size > 0,

  currentLabel: () => {
    const ops = get().operations;
    const first = ops.values().next().value;
    return first ?? "";
  },
}));
