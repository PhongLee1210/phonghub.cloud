import { create } from "zustand";

import type { AiCommandId, ShowcasePhase } from "./commands";

/**
 * useShowcaseStore — client-side state for the showcase composition.
 * Holds the current lifecycle phase and the active AI command (or null
 * when idle). The `reset` action returns to idle.
 */
export interface ShowcaseStoreState {
  phase: ShowcasePhase;
  activeAction: AiCommandId | null;

  setPhase: (phase: ShowcasePhase) => void;
  setActiveAction: (id: AiCommandId | null) => void;
  reset: () => void;
}

const IDLE_PHASE: Pick<ShowcaseStoreState, "phase" | "activeAction"> = {
  phase: "idle",
  activeAction: null,
};

export const useShowcaseStore = create<ShowcaseStoreState>((set) => ({
  ...IDLE_PHASE,

  setPhase: (phase) => set({ phase }),
  setActiveAction: (id) => set({ activeAction: id }),

  reset: () => set({ ...IDLE_PHASE }),
}));

export default useShowcaseStore;
