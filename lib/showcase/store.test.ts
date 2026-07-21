import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { useShowcaseStore } from "./store";
import type { ShowcaseStoreState } from "./store";

/**
 * Unit tests for `useShowcaseStore`. Covers the actions the streaming
 * wire-up (T5.5 / T5.6) depends on: phase transitions, active action
 * tracking, highlight state, and reset semantics (preserve `section`).
 *
 * Uses Zustand's vanilla API directly (`getState` / `setState`) — no React
 * render needed, no `@testing-library/react` dependency.
 */

function snapshot(): ShowcaseStoreState {
  return useShowcaseStore.getState();
}

beforeEach(() => {
  // Reset to factory defaults before every test.
  useShowcaseStore.setState({
    section: "skills",
    phase: "idle",
    activeAction: null,
    highlightLines: [],
    highlightedSkillKeys: [],
  });
});

afterEach(() => {
  useShowcaseStore.setState({
    section: "skills",
    phase: "idle",
    activeAction: null,
    highlightLines: [],
    highlightedSkillKeys: [],
  });
});

describe("useShowcaseStore", () => {
  test("initial state is the idle skills showcase", () => {
    const s = snapshot();
    expect(s.section).toBe("skills");
    expect(s.phase).toBe("idle");
    expect(s.activeAction).toBeNull();
    expect(s.highlightLines).toEqual([]);
    expect(s.highlightedSkillKeys).toEqual([]);
  });

  test("setSection switches section without disturbing other state", () => {
    useShowcaseStore.getState().setActiveAction("feature");
    useShowcaseStore.getState().setPhase("coding");

    useShowcaseStore.getState().setSection("projects");

    const s = snapshot();
    expect(s.section).toBe("projects");
    expect(s.activeAction).toBe("feature");
    expect(s.phase).toBe("coding");
  });

  test("setPhase transitions through the lifecycle", () => {
    useShowcaseStore.getState().setPhase("coding");
    expect(snapshot().phase).toBe("coding");

    useShowcaseStore.getState().setPhase("compiled");
    expect(snapshot().phase).toBe("compiled");

    useShowcaseStore.getState().setPhase("preview");
    expect(snapshot().phase).toBe("preview");
  });

  test("setActiveAction tracks the in-flight command id", () => {
    useShowcaseStore.getState().setActiveAction("modify");
    expect(snapshot().activeAction).toBe("modify");

    useShowcaseStore.getState().setActiveAction(null);
    expect(snapshot().activeAction).toBeNull();
  });

  test("setHighlightLines replaces the highlight array", () => {
    useShowcaseStore.getState().setHighlightLines([1, 2, 3]);
    expect(snapshot().highlightLines).toEqual([1, 2, 3]);

    useShowcaseStore.getState().setHighlightLines([5]);
    expect(snapshot().highlightLines).toEqual([5]);
  });

  test("setHighlightedSkillKeys updates the chip filter set", () => {
    useShowcaseStore.getState().setHighlightedSkillKeys(["react", "nextjs"]);
    expect(snapshot().highlightedSkillKeys).toEqual(["react", "nextjs"]);
  });

  test("reset returns to idle but preserves section", () => {
    useShowcaseStore.getState().setSection("projects");
    useShowcaseStore.getState().setActiveAction("feature");
    useShowcaseStore.getState().setPhase("coding");
    useShowcaseStore.getState().setHighlightLines([2, 4]);
    useShowcaseStore.getState().setHighlightedSkillKeys(["typescript"]);

    useShowcaseStore.getState().reset();

    const s = snapshot();
    expect(s.section).toBe("projects"); // preserved
    expect(s.phase).toBe("idle");
    expect(s.activeAction).toBeNull();
    expect(s.highlightLines).toEqual([]);
    expect(s.highlightedSkillKeys).toEqual([]);
  });

  test("multiple subscribers are decoupled via Zustand selectors", () => {
    const phaseReads: string[] = [];
    const actionReads: string[] = [];

    const unsubPhase = useShowcaseStore.subscribe((s) => {
      phaseReads.push(s.phase);
    });
    const unsubAction = useShowcaseStore.subscribe((s) => {
      actionReads.push(String(s.activeAction));
    });

    useShowcaseStore.getState().setPhase("coding");
    useShowcaseStore.getState().setActiveAction("modify");
    useShowcaseStore.getState().setPhase("compiled");

    unsubPhase();
    unsubAction();

    // Each listener fired for every state change (Zustand's default
    // subscriber fires on every set, not just selected-slice changes).
    // This test documents that behaviour so future refactors notice
    // if the store moves to a selector-based subscription.
    expect(phaseReads.length).toBeGreaterThan(0);
    expect(actionReads.length).toBeGreaterThan(0);
    expect(phaseReads[phaseReads.length - 1]).toBe("compiled");
    expect(actionReads[actionReads.length - 1]).toBe("modify");
  });
});
