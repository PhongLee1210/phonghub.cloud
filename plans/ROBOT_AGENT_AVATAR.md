# P3 — Robot as Agent Avatar

_Effort: M–L. **Blender work is the long pole** — start it in parallel with P2. Depends on P0 (optimized GLB + presence bus)._

## Problem

`components/home/robot-companion.tsx` is the most technically impressive thing on the site — scroll-interpolated waypoints, ResizeObserver re-measurement, WebGL context-loss recovery, frameloop gating when docked. And it is **decorative**. It floats through the page on a sine wave and knows nothing about the agent sitting 20 pixels below it in `chat-launcher.tsx`.

Meanwhile the agent already emits exactly the signals a companion would react to: `ChatStatus` (`idle` / `streaming` / `acting` / `error`), `pendingHighlight`, `pendingSkillSelect`, `pendingNavigate`, and the lead-capture action.

The gap is not conceptual. It is that **the model has no skeleton and no animation clips**:

```
skins: 0        animations: []        meshes: 1 (fused, single material)
vertices: 746,033                     file: 7.4 MB
```

All current motion is procedural whole-object transform in `useFrame` (`position.y` sine, `rotation.y` lerp toward `lookDirRef`). That is the ceiling until Blender work happens.

## Goal

The robot becomes the agent's physical presence:

| Agent signal | Robot reads as |
|---|---|
| chat panel opens, first visit | `GREETING` — turns to face the panel, waves |
| `ChatStatus.Streaming`, no text yet | `THINKING` — head tilt, slow scan, eye pulse |
| text streaming | `SPEAKING` — subtle bob keyed to token cadence |
| `pendingHighlight` / `pendingSkillSelect` | `POINTING` — orients toward the DOM target's screen position, gestures |
| `done` with citations | `CONFIRMING` — single nod, returns to idle |
| `ChatStatus.Error` / empty search results | `APOLOGIZING` — shrug |
| idle > 8 s | `IDLE` — the existing float |

---

## Part A — Blender

### A.1 Decide the rig track

The mesh is a single fused primitive from a third-party exporter. Two viable tracks; **pick one before touching code**.

**Track A — Loose-parts split (recommended, ~4 h)**

1. Import the GLB, `Tab` into Edit Mode, `P → By Loose Parts`.
2. Inspect what falls out in the Outliner. A robot model of this origin usually separates into head / torso / limb / antenna shells.
3. Rename the useful shells: `Robot_Head`, `Robot_Body`, `Robot_Arm_L`, `Robot_Arm_R`, `Robot_Eye`. Join leftovers back into `Robot_Body`.
4. Set each part's origin to a sensible pivot (`Object → Set Origin → Origin to 3D Cursor`, cursor snapped to the joint).
5. Parent all parts to an empty `Robot_Root` (`Ctrl+P → Object (Keep Transform)`).
6. Export. No skinning, no weight painting. **All animation is then done in R3F by transforming named nodes** — which means clips are optional and you can iterate motion in TypeScript without re-exporting.

**Track B — Armature (~1–2 days, better result)**

1. Add an armature: `Root → Spine → Head`, plus `Arm_L`/`Arm_R` (2 bones each) and `Antenna` if present. **8 bones maximum** — anything more is wasted on a 500 px-tall element.
2. `Ctrl+P → With Automatic Weights`, then fix the shoulder/neck seams in Weight Paint mode. This is the step that takes the day.
3. Author clips in the Dope Sheet → Action Editor, one Action per clip, **stashed into NLA strips** so the glTF exporter picks them all up.
4. Export with `Animation → ✓`, `Optimize Animation Size → ✓`, `Always Sample Animations → ✗` (keeps keyframes sparse).

Track A gets 80% of the read for 20% of the effort, and its motion is tunable in code. Go with A unless you specifically want the rigging on your portfolio as a demonstrated skill — which, given this is a portfolio, is a legitimate reason to pick B.

### A.2 Clip specification (Track B, or optional polish clips for Track A)

| Clip | Frames @24fps | Loop | Motion |
|---|---|---|---|
| `Idle` | 96 (4 s) | yes | existing sine float, baked |
| `Think` | 48 (2 s) | yes | head tilt 12°, slow left-right scan, eye emissive pulse |
| `Point` | 29 (1.2 s) | no | torso rotate toward +X, arm raise, **0.4 s hold at frames 14–24** |
| `Nod` | 19 (0.8 s) | no | head pitch down 15° and back |
| `Wave` | 36 (1.5 s) | no | arm raise + 2 oscillations |
| `Shrug` | 29 (1.2 s) | no | both arms up, head tilt, settle |

Rules that matter for blending:
- Every clip **starts and ends on the `Idle` rest pose** except `Idle` itself. Otherwise crossfades pop.
- `Point` must hold, not snap back — the hold is what reads as "looking at that thing" while the page scrolls.
- Keep clips ≤ 2 s. Total animation data at 8 bones × 6 clips is a few KB; it is not the size problem. The geometry is.

### A.3 Export settings (both tracks)

```
Format:        glTF Binary (.glb)
Include:       Selected Objects ✓ (Root + children only)
Transform:     +Y Up ✓
Data → Mesh:   Apply Modifiers ✓, UVs ✓, Normals ✓, Tangents ✓ (needed for the normal map)
Data → Material: Export, Images: Automatic
Data → Animation: ✓ (Track B), Optimize Animation Size ✓, Always Sample ✗
Compression:   Draco, level 6   (or skip and use meshopt in post)
```

Then the budget check from the roadmap:

```bash
bunx @gltf-transform/cli inspect public/chat-robot.glb
# assert: ≤ 1.2 MB, ≤ 80k tris, 6 animations (Track B), ≤ 8 joints
```

Keep the `.blend` source in the repo? **No** — it will be tens of MB. Store it outside the repo and note its location in `docs/design/`; the `.glb` is the artifact.

---

## Part B — Code

### B.1 State machine (`lib/robot-state.ts`)

Pure, no React, fully unit-testable. This is where the feature's logic lives.

```ts
export interface AgentSignals {
  chatStatus: ChatStatus;
  panelOpen: boolean;
  hasStreamedText: boolean;
  pendingTarget?: AgentEntityId;
  lastActivityAt: number;
  isFirstOpen: boolean;
}

/** Pure reducer: signals + now → the state the companion should portray. */
export function deriveRobotState(signals: AgentSignals, now: number): RobotState;
```

Precedence (highest first), because signals overlap constantly:

```
ERROR              → APOLOGIZING
pendingTarget      → POINTING
panelOpen && isFirstOpen && idle → GREETING
streaming && !hasStreamedText    → THINKING
streaming && hasStreamedText     → SPEAKING
just completed (< 1.2 s)         → CONFIRMING
otherwise                        → IDLE
```

Plus a **minimum dwell time** of 600 ms per state. Without it, a fast turn (`thinking → tool → done` in under a second) makes the robot spasm through four clips. This is the single most important detail in the whole feature.

### B.2 Presence wiring

```
use-chat-store (zustand)
        │  useChatStore.subscribe(selector, cb)   ← non-reactive
        ▼
components/three/robot-bridge.tsx  (mounts once, renders null)
        │  deriveRobotState(...) + dwell guard
        ▼
lib/agent-presence.ts   (module-level mutable + listener set, from P0.4)
        │  read directly — NOT through React
        ▼
useFrame in robot-scene.tsx
```

**Never** put `RobotState` in React state and pass it as a prop into the `<Canvas>` subtree. A re-render per token is exactly the regression that `6dd9fae chore(performance): optimize robot render performance` fixed once already.

### B.3 Playback (`components/three/robot-scene.tsx`)

**Track B:**

```tsx
const { scene, animations } = useGLTF(MODEL_PATH);
const { actions, mixer } = useAnimations(animations, ref);

useFrame((_, delta) => {
  const p = readPresence();
  if (p.revision !== lastRevision.current) {
    lastRevision.current = p.revision;
    const next = actions[CLIP_FOR_STATE[p.state]];
    current.current?.fadeOut(CROSSFADE_SECONDS);
    next?.reset().fadeIn(CROSSFADE_SECONDS).play();
    current.current = next;
  }
  mixer.update(delta);
  // existing float + lookAt still layered on the root group
});
```

`CROSSFADE_SECONDS = 0.25`. One-shot clips (`Point`, `Nod`, `Wave`, `Shrug`) get `setLoop(THREE.LoopOnce)` + `clampWhenFinished = true`, and a `mixer.addEventListener("finished")` that returns presence to `IDLE`.

**Track A:** same structure, but instead of `actions` you lerp named node transforms toward per-state targets in `useFrame`. Keep a `POSE_FOR_STATE: Record<RobotState, PartPose>` table — declarative, and you can tune it live without Blender.

### B.4 Pointing at a DOM element

The genuinely interesting bit. Given a `pendingHighlight` agentId, orient the robot toward where that element actually is on screen.

```ts
// 1. DOM → viewport px
const el = resolveEntity(target);            // lib/chat/entity-dom.ts
const rect = el.getBoundingClientRect();
const screen = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

// 2. viewport px → canvas NDC  (the canvas is a fixed square at bottom-right)
const canvas = glRef.current.domElement.getBoundingClientRect();
const ndc = {
  x: ((screen.x - canvas.left) / canvas.width) * 2 - 1,
  y: -(((screen.y - canvas.top) / canvas.height) * 2 - 1),
};

// 3. NDC → world point on the robot's z=0 plane
const world = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera);
```

Then damp `rootRef.current.quaternion` toward `lookAt(world)` — do **not** snap. Clamp yaw to ±50° so the robot never turns its back to the visitor, and re-project every frame while `POINTING` so it tracks as the page scrolls.

The projection math (steps 2–3, minus the THREE call) goes in `lib/chat/geometry.ts` alongside P1's helpers and gets tested there.

### B.5 Frameloop

Currently `frameloop = active && tabVisible ? "always" : "never"`, where `active = isHome`. Extend so the docked robot on non-home routes wakes for agent states:

```ts
const frameloop = tabVisible && (isHome || presenceIsActive) ? "always" : "never";
```

`presenceIsActive` = state !== `IDLE`. Read it through `useSyncExternalStore` — this one *is* a render-rate decision, not per-frame, so React state is correct here. On non-home routes at 56 px, cap `dpr` to `1`.

---

## Tests

`lib/robot-state.test.ts` — the reducer is pure, so this is straightforward and it is where the real coverage lives:

1. **Reproduction** — signals `{ streaming, hasStreamedText: false }` yield `THINKING`, not `IDLE`. (RED before the reducer exists.)
2. Happy — a full turn sequence `idle → streaming(no text) → streaming(text) → done` maps to `IDLE → THINKING → SPEAKING → CONFIRMING`.
3. Precedence — `error` + `pendingTarget` set simultaneously yields `APOLOGIZING` (error wins).
4. Edge — `panelOpen` with `isFirstOpen: false` does not re-trigger `GREETING`.
5. **Boundary** — a state change arriving at exactly `MIN_DWELL_MS` is accepted; one at `MIN_DWELL_MS - 1` is suppressed.
6. Edge — `pendingTarget` pointing at an agentId not on the page falls through to the status-derived state rather than sticking in `POINTING`.

`lib/chat/geometry.test.ts` — add the projection cases:

7. Happy — a target at the exact canvas centre maps to NDC `(0, 0)`.
8. Boundary — a target at the canvas top-left corner maps to `(-1, 1)` exactly.
9. Edge — a zero-size canvas rect (canvas not yet laid out) returns `null` rather than dividing by zero.

Clip playback, crossfades and the Blender output are visual → manual browser check, per the TDD exceptions list.

---

## Pitfalls

- **The dwell timer is not optional.** Without it the robot flickers between clips on every fast turn and the whole feature reads as broken rather than alive.
- **Clips that don't return to rest pose pop on crossfade.** Check this in Blender before exporting, not in the browser after.
- **Re-render per token kills the frame budget.** The presence bus exists for exactly this reason. If you find yourself writing `const [robotState, setRobotState] = useState(...)` above the `<Canvas>`, stop.
- **`useGLTF` caches by path.** If you ship `chat-robot-v2.glb` alongside the old one during development, you will hold two 7 MB models in memory. Replace the file in place and hard-reload.
- **WebGL context loss is already handled** (`canvasKey` bump on `webglcontextlost`) — but a remount resets the mixer. Re-read presence and re-enter the current state after remount, or the robot freezes in whatever clip it was in.
- **Desktop-only.** `getIsDesktop()` gates on `≥1024px` + the WebGL probe. Mobile visitors get none of this, so the *chat UI itself* must still communicate status on its own — `thinking-checklist.tsx` stays the source of truth, the robot is enrichment. Never move information exclusively into the 3D layer.
- **Reduced motion:** hold the first frame of each clip (set the action's `time = 0`, `paused = true`) and skip the damped lookAt. The state still changes; the motion doesn't.
- **Pointing while the target is off-screen** looks like the robot staring at nothing. Either clamp to the viewport edge (reads as "it's over there") or fall back to `THINKING`. Pick one; clamping is better.
