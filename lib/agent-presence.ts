/**
 * Agent presence bus — the single channel between the chat agent's state and
 * the 3D companion that portrays it.
 *
 * Deliberately NOT a zustand store and NOT React state. The consumer is
 * `useFrame` inside `components/three/robot-scene.tsx`, which runs up to 60
 * times a second; routing agent state through a React re-render is the exact
 * regression that commit 6dd9fae ("optimize robot render performance") fixed.
 * So: a module-level mutable object, read directly in the render loop, plus a
 * listener set for the few consumers that legitimately render on change
 * (via `useSyncExternalStore`).
 *
 * Writers: the chat-store bridge, and citation-chip hover (P1).
 * Readers: the robot scene (per frame), the tour HUD (per change).
 */

/** What the visitor's on-screen companion is currently portraying. */
export const RobotState = {
  IDLE: "IDLE",
  GREETING: "GREETING",
  THINKING: "THINKING",
  SPEAKING: "SPEAKING",
  POINTING: "POINTING",
  CONFIRMING: "CONFIRMING",
  APOLOGIZING: "APOLOGIZING",
} as const;
export type RobotState = (typeof RobotState)[keyof typeof RobotState];

/** A point in viewport (CSS pixel) space — not world or NDC space. */
export interface ScreenPoint {
  x: number;
  y: number;
}

export interface AgentPresence {
  state: RobotState;
  /**
   * Screen-space point the companion should orient toward. Only meaningful
   * while `state` is POINTING; cleared whenever the state returns to IDLE so a
   * stale anchor can't survive into the next turn.
   */
  lookAt?: ScreenPoint;
  /**
   * Incremented on every accepted write. `useFrame` compares this against the
   * revision it last acted on, which is cheaper than diffing the state itself
   * and gives re-entry into the same state (a second POINTING at a new target)
   * a detectable edge.
   */
  revision: number;
}

export interface PresenceWrite {
  state: RobotState;
  lookAt?: ScreenPoint;
}

type PresenceListener = () => void;

const INITIAL_STATE: RobotState = RobotState.IDLE;

/** The one mutable instance. Handed out by reference — see `readPresence`. */
const presence: AgentPresence = {
  state: INITIAL_STATE,
  lookAt: undefined,
  revision: 0,
};

const listeners = new Set<PresenceListener>();

function samePoint(a: ScreenPoint | undefined, b: ScreenPoint | undefined) {
  if (a === undefined || b === undefined) return a === b;
  return a.x === b.x && a.y === b.y;
}

/**
 * The live presence object, typed read-only.
 *
 * Returns the same reference on every call by design: this is read once per
 * animation frame, so allocating (or freezing) a snapshot per read would put
 * garbage-collection pressure directly in the render loop. Callers must treat
 * it as immutable — `Readonly` makes that a compile-time error, and a write
 * would in any case never reach subscribers.
 */
export function readPresence(): Readonly<AgentPresence> {
  return presence;
}

/**
 * Records what the companion should portray.
 *
 * A write that changes nothing is dropped: no revision bump, no notification.
 * Without that guard, every token of a streamed reply would re-enter the same
 * state and restart its animation clip mid-crossfade.
 */
export function setPresence(next: PresenceWrite): void {
  const lookAt = next.state === RobotState.IDLE ? undefined : next.lookAt;

  const unchanged =
    presence.state === next.state && samePoint(presence.lookAt, lookAt);
  if (unchanged) return;

  presence.state = next.state;
  presence.lookAt = lookAt;
  presence.revision += 1;

  // forEach rather than for...of: tsconfig targets es5, where iterating a Set
  // needs downlevelIteration.
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      // A subscriber mid-unmount must not strand the ones after it in the set,
      // which would hold the companion in a state it has already left.
      console.warn("[agent-presence] listener threw, continuing:", err);
    }
  });
}

/** Subscribes to accepted writes. Returns an idempotent unsubscribe. */
export function subscribePresence(listener: PresenceListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only reset — mirrors `__setProvidersForTests()` in lib/llm/registry.ts. */
export function __resetPresenceForTests(): void {
  presence.state = INITIAL_STATE;
  presence.lookAt = undefined;
  presence.revision = 0;
  listeners.clear();
}
