import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { useShowcaseStore } from "./store";
import type { ShowcaseStoreState } from "./store";

/**
 * Unit tests for `useShowcaseStore`. Covers phase transitions, active
 * action tracking, and reset semantics. Uses Zustand's vanilla API
 * directly (`getState` / `setState`) — no React render needed.
 */

function snapshot(): ShowcaseStoreState {
  return useShowcaseStore.getState();
}

beforeEach(() => {
  useShowcaseStore.setState({ phase: "idle", activeAction: null });
});

afterEach(() => {
  useShowcaseStore.setState({ phase: "idle", activeAction: null });
});

describe("useShowcaseStore", () => {
  test("initial state is idle with no active action", () => {
    const s = snapshot();
    expect(s.phase).toBe("idle");
    expect(s.activeAction).toBeNull();
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

  test("reset returns to idle", () => {
    useShowcaseStore.getState().setActiveAction("feature");
    useShowcaseStore.getState().setPhase("coding");

    useShowcaseStore.getState().reset();

    const s = snapshot();
    expect(s.phase).toBe("idle");
    expect(s.activeAction).toBeNull();
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

    expect(phaseReads.length).toBeGreaterThan(0);
    expect(actionReads.length).toBeGreaterThan(0);
    expect(phaseReads[phaseReads.length - 1]).toBe("compiled");
    expect(actionReads[actionReads.length - 1]).toBe("modify");
  });
});
