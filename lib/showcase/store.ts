import { create } from "zustand";

import type {
  AiCommandId,
  ShowcasePhase,
  ShowcaseSection,
} from "./commands";

/**
 * useShowcaseStore — client-side state for the showcase composition.
 *
 * Owned state:
 *   - `section`        — which showcase ("skills" | "projects") is active.
 *                        Set by the section wrapper (SkillsShowcase /
 *                        ProjectsShowcase) on mount so the AI toolbar +
 *                        streaming endpoint know which prompt + content
 *                        to use.
 *   - `phase`          — lifecycle phase used by CodeEditorPanel's
 *                        "compiled" badge + the LivePreviewFrame status
 *                        chip. Advanced by stream events in T5.6.
 *   - `activeAction`   — current AiCommandId while a stream is in flight
 *                        (drives the pulsing ring on the toolbar button).
 *                        `null` when idle.
 *   - `highlightLines` — editor line indices to highlight during streaming
 *                        (the line currently being typed). Empty when idle.
 *   - `highlightedSkillKeys` — skills-section-specific highlight set,
 *                        threaded through to `SkillPreviewBody` so chip
 *                        matching the AI response get the ring state.
 *
 * Reset returns to the idle state but preserves `section` (the user
 * doesn't change context by resetting).
 *
 * Selectors: callers should use `useShowcaseStore(state => state.foo)`
 * for memoisation. The store itself is structured so unrelated slices
 * don't re-render each other.
 */
export interface ShowcaseStoreState {
  section: ShowcaseSection;
  phase: ShowcasePhase;
  activeAction: AiCommandId | null;
  highlightLines: number[];
  highlightedSkillKeys: string[];

  setSection: (section: ShowcaseSection) => void;
  setPhase: (phase: ShowcasePhase) => void;
  setActiveAction: (id: AiCommandId | null) => void;
  setHighlightLines: (lines: number[]) => void;
  setHighlightedSkillKeys: (keys: string[]) => void;

  /** Reset to idle, preserving `section`. */
  reset: () => void;
}

const IDLE_PHASE: Pick<
  ShowcaseStoreState,
  "phase" | "activeAction" | "highlightLines" | "highlightedSkillKeys"
> = {
  phase: "idle",
  activeAction: null,
  highlightLines: [],
  highlightedSkillKeys: [],
};

export const useShowcaseStore = create<ShowcaseStoreState>((set) => ({
  section: "skills",
  ...IDLE_PHASE,

  setSection: (section) => set({ section }),
  setPhase: (phase) => set({ phase }),
  setActiveAction: (id) => set({ activeAction: id }),
  setHighlightLines: (lines) => set({ highlightLines: lines }),
  setHighlightedSkillKeys: (keys) => set({ highlightedSkillKeys: keys }),

  reset: () => set({ ...IDLE_PHASE }),
}));

export default useShowcaseStore;
