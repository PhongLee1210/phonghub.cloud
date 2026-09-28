import { beforeEach, describe, expect, test } from "bun:test";

import {
  RobotState,
  __resetPresenceForTests,
  readPresence,
  setPresence,
  subscribePresence,
} from "./agent-presence";

beforeEach(() => {
  __resetPresenceForTests();
});

describe("setPresence", () => {
  test("bumps the revision and notifies every subscriber", () => {
    let first = 0;
    let second = 0;
    subscribePresence(() => first++);
    subscribePresence(() => second++);

    const before = readPresence().revision;
    setPresence({ state: RobotState.THINKING });

    expect(readPresence().state).toBe(RobotState.THINKING);
    expect(readPresence().revision).toBe(before + 1);
    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  test("an identical state does not bump the revision", () => {
    // useFrame reads `revision` to decide whether to crossfade a clip.
    // Re-setting the same state on every store emission would restart the
    // animation continuously, which is the spasm this guard prevents.
    setPresence({ state: RobotState.SPEAKING });
    const settled = readPresence().revision;

    let notifications = 0;
    subscribePresence(() => notifications++);
    setPresence({ state: RobotState.SPEAKING });

    expect(readPresence().revision).toBe(settled);
    expect(notifications).toBe(0);
  });

  test("the same state with a moved lookAt does bump the revision", () => {
    // POINTING re-anchors as the page scrolls — the target moved even though
    // the state did not, so the scene still needs to know.
    setPresence({ state: RobotState.POINTING, lookAt: { x: 10, y: 20 } });
    const settled = readPresence().revision;

    setPresence({ state: RobotState.POINTING, lookAt: { x: 10, y: 400 } });

    expect(readPresence().revision).toBe(settled + 1);
    expect(readPresence().lookAt).toEqual({ x: 10, y: 400 });
  });

  test("returning to IDLE clears a stale lookAt", () => {
    setPresence({ state: RobotState.POINTING, lookAt: { x: 120, y: 340 } });
    setPresence({ state: RobotState.IDLE });

    expect(readPresence().state).toBe(RobotState.IDLE);
    expect(readPresence().lookAt).toBeUndefined();
  });

  test("a listener that throws does not strand the others", () => {
    // One bad subscriber (e.g. a component mid-unmount) must not leave the
    // rest un-notified, which would hold the robot in the wrong clip.
    const seen: string[] = [];
    subscribePresence(() => {
      throw new Error("listener boom");
    });
    subscribePresence(() => seen.push("second"));

    expect(() => setPresence({ state: RobotState.THINKING })).not.toThrow();
    expect(seen).toEqual(["second"]);
  });
});

describe("subscribePresence", () => {
  test("the returned function stops delivery", () => {
    let notifications = 0;
    const unsubscribe = subscribePresence(() => notifications++);

    setPresence({ state: RobotState.THINKING });
    expect(notifications).toBe(1);

    unsubscribe();
    setPresence({ state: RobotState.IDLE });
    expect(notifications).toBe(1);
  });

  test("unsubscribing twice is safe", () => {
    const unsubscribe = subscribePresence(() => {});
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe("readPresence", () => {
  test("starts IDLE with no lookAt", () => {
    const presence = readPresence();
    expect(presence.state).toBe(RobotState.IDLE);
    expect(presence.lookAt).toBeUndefined();
  });

  test("returns a stable object identity across calls", () => {
    // Hot-path contract: this is read once per animation frame, so it must not
    // allocate a fresh snapshot (or freeze one) per read. Immutability for
    // callers is a compile-time guarantee via Readonly, not a runtime copy.
    const first = readPresence();
    setPresence({ state: RobotState.POINTING, lookAt: { x: 1, y: 2 } });
    const second = readPresence();

    expect(first).toBe(second);
  });
});
