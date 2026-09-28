# 3D Agent UX — Roadmap

_Master plan. Four features, ordered easy → hard, plus the asset/perf foundation they all sit on._

## Scope

| # | Feature | Spec | Effort | Blender? |
|---|---|---|---|---|
| P0 | Foundation: asset pipeline + presence bus + label gaps | this doc | S | yes (bake/decimate) |
| P1 | Citation chip → spatial preview | [CITATION_SPATIAL_PREVIEW.md](CITATION_SPATIAL_PREVIEW.md) | S–M | no |
| P2 | Hybrid retrieval layer | [HYBRID_RETRIEVAL.md](HYBRID_RETRIEVAL.md) | M | no |
| P3 | Robot as agent avatar | [ROBOT_AGENT_AVATAR.md](ROBOT_AGENT_AVATAR.md) | M–L | yes (rig + clips) |
| P4 | Guided tour agent | [GUIDED_TOUR_AGENT.md](GUIDED_TOUR_AGENT.md) | L | no (consumes P3) |

Dependency graph:

```
P0 ──┬─► P1 (needs presence bus for chip↔robot glance; degrades fine without)
     ├─► P3 (needs optimized + rigged GLB)
     └─► P2 ──┐
               ├─► P4  (tour quality depends on retrieval; narration depends on robot)
         P3 ──┘
```

Do them in order. P1 and P2 are independent of each other and can run in parallel if you want two fronts.

---

## P0 — Foundation

### P0.1 Asset audit (measured, not estimated)

`public/chat-robot.glb` as it ships today:

| Property | Value | Verdict |
|---|---|---|
| File size | **7,365,644 bytes (7.4 MB)** | 5–6× over budget for a decorative element |
| Vertices | **746,033** | ~12× over budget |
| Meshes / primitives | 1 / 1 (fused, single material) | no addressable parts |
| Skins | **0** | no skeleton |
| Animations | **[]** | no clips — all motion is procedural in `useFrame` |
| Textures | 3 × JPEG (Color, ORM, NormalGL) | not KTX2 |
| Extensions | `EXT_meshopt_compression`, `KHR_mesh_quantization`, `KHR_texture_transform` | already compressed — the size is geometry + texture, not container |

Consequences to understand before planning P3:

1. **7.4 MB is the single largest asset on the site** (`me.JPG` 8.4 MB is second, `logo.png` 1.4 MB third). It downloads on the home route for every desktop visitor.
2. **`skins: 0, animations: []` means the robot physically cannot gesture today.** Nothing in code is wrong — there is no rig to drive. P3 is gated on Blender work, not on React work.
3. The mesh is a fused export from a third-party tool (`threedium_material_…`), so "just animate the arm" is not available either; the geometry must be split or rigged first.
4. `<Environment preset="apartment" />` in `components/three/robot-scene.tsx` fetches an HDR from the drei CDN at runtime — an uncontrolled third-party request plus ~1 MB on top of the GLB.

### P0.2 Blender pass — optimize (do this before any rigging)

Target budget: **≤ 1.2 MB, ≤ 80k triangles, 3 × 1024² KTX2 textures.**

1. Import: `File → Import → glTF 2.0`, `public/chat-robot.glb`.
2. Duplicate the object; keep the original as the hi-poly bake source in a hidden collection.
3. On the working copy: `Decimate` modifier, mode `Collapse`, ratio ≈ `0.08` → ~60k tris. Check the silhouette from the three camera angles the site actually uses (hero large-left, mid-scroll small-right, docked 56 px).
4. Bake surface detail back: Cycles → Bake → `Normals`, `Selected to Active` (hi-poly selected, lo-poly active), Extrusion `0.02 m`, Cage on. Save as `NormalGL_1k.png`.
5. Resize Color and ORM to 1024² (`Image → Scale`); they are viewed at ≤ 500 px on screen at the largest waypoint.
6. Export: glTF Binary `.glb`, `+Y Up`, `Apply Modifiers` on, `Compression` = Draco (or leave meshopt and run step 7), Materials `Export`, Images `Automatic`.
7. Post-process (no new repo dependency — run with `bunx`):
   ```bash
   bunx @gltf-transform/cli optimize public/chat-robot.glb public/chat-robot.glb \
     --texture-compress ktx2 --compress meshopt
   bunx @gltf-transform/cli inspect public/chat-robot.glb   # verify the budget
   ```
8. KTX2 requires a loader: `useGLTF` needs `KTX2Loader` wired via drei's `useGLTF(path, true)` (Draco) or an explicit `extendLoader`. If wiring KTX2 is more friction than it's worth, stop at step 6 with 1024² JPEGs — still lands ~1.5–2 MB.

**Do not skip the measurement step.** Record before/after in the PR body: bytes, triangles, and Lighthouse LCP on `/`.

### P0.3 Replace the CDN environment

Swap `<Environment preset="apartment" />` for local lights — the robot is small on screen and a 3-light rig is visually indistinguishable at that size:

```tsx
<ambientLight intensity={0.6} />
<directionalLight position={[2, 3, 2]} intensity={1.2} />
<directionalLight position={[-2, 1, -1]} intensity={0.4} color="#a78bfa" />
```

Removes a third-party runtime fetch and ~1 MB. If the material reads flat afterwards, use drei `<Lightformer>` inside `<Environment resolution={64}>` (generated, not fetched) instead.

### P0.4 Agent presence bus (shared by P1, P3, P4)

The one architectural decision that keeps everything after it cheap.

**Rule: per-frame 3D state never goes through React state.** `robot-companion.tsx` already does this correctly with `lookDirRef`. Formalize it:

`lib/agent-presence.ts` (client-safe, no React):

```ts
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

export interface AgentPresence {
  state: RobotState;
  /** Screen-space point the companion should orient toward, in CSS px. */
  lookAt?: { x: number; y: number };
  /** Bumped on every write so useFrame can cheaply detect a change. */
  revision: number;
}
```

- A module-level mutable object + a `Set<() => void>` of listeners (no zustand — this is read in `useFrame`, not in render).
- Writers: `hooks/use-chat-store.ts` via a **non-reactive** `useChatStore.subscribe(selector, cb)` in one mount-once bridge component, plus P1's chip hover handler.
- Readers: `useFrame` inside `components/three/robot-scene.tsx` reads `presence.current` directly; `<CitationConnector>` subscribes with `useSyncExternalStore` (render-rate is fine there).

Naming follows `docs/engineering/CODING-STANDARD.md` §Constants and Enum Definition Standards.

**Tests** (pure module, `lib/agent-presence.test.ts` — floor is happy path + one edge per `docs/engineering/TDD.md`):
1. `setPresence` bumps `revision` and notifies every subscriber.
2. Unsubscribe stops delivery.
3. Setting an identical state does not bump `revision` (guards against per-frame churn).
4. `lookAt` clears when state returns to `IDLE`.

### P0.5 Fix the visible label gap (15 minutes, ship it first)

`config/chat.ts:111` `THINKING_STEP_LABELS` has no entry for `search_contact`, `capture_lead`, or the client tool `get_page_context`. `components/chat/thinking-checklist.tsx` falls back to the raw key, so visitors currently read `capture_lead` in the UI.

```ts
search_contact: "Looking up contact details",
capture_lead: "Opening the contact form",
get_page_context: "Checking this page",
```

Also correct `docs/architecture/AI-CHAT-ARCHITECTURE.md`: it documents 13 tools and the pre-consolidation names (`highlight_resource`, `focus`, `select_skill`, `open_modal`, `expand_section`). `lib/chat/tools.ts` exports **10**, with `reveal` / `open_detail` in their place.

---

## Cross-cutting constraints

Every feature below must satisfy these or it does not ship.

| Constraint | Source | Rule |
|---|---|---|
| Z-index | `docs/design/MOBILE-FIRST.md` §3 | New fixed layers go in the table. Reserved here: connector overlay `z-[57]`, tour HUD `z-[61]`. |
| Reduced motion | §13 | `useReducedMotion()` for JS springs; never a conditional class. 3D: clips still play but at `timeScale 0`-equivalent (hold first frame), no scroll animation, no camera drift. |
| Mobile | §1, §14 | The robot is desktop-only (`≥1024px` + WebGL probe). Every feature needs a defined non-3D fallback, not a blank space. |
| Canvas count | perf | The site already runs two WebGL contexts (`particle-constellation`, `robot-scene`). **Do not add a third.** P1 uses CSS 3D transforms, not WebGL. |
| Verification | `AGENTS.md` | `bun run lint` → `bunx tsc --noEmit` → `bun run test` → manual browser check. No component/e2e suite exists. |
| TDD | `docs/engineering/TDD.md` | Pure logic (retrieval, presence bus, tour planner, projection math) gets reproduction + happy + edge + boundary. Presentational 3D is the documented exception → manual browser check. |

## Performance budget (assert before each merge)

| Metric | Budget | How to check |
|---|---|---|
| `chat-robot.glb` | ≤ 1.2 MB | `bunx @gltf-transform/cli inspect` |
| Triangles | ≤ 80k | same |
| Animation clips | 6, ≤ 2 s each | same |
| Home LCP (desktop) | no regression vs. today | Lighthouse, 2 runs |
| Frame time while streaming | ≤ 8 ms on the robot canvas | Chrome DevTools → Performance, filter to the canvas |
| Extra WebGL contexts | 0 | `canWebGL` probe already caps this; don't add a `<Canvas>` |

## Suggested sequencing

1. **Week 1** — P0.5 (labels + doc fix), P0.1–P0.3 (asset pass), P0.4 (presence bus + tests).
2. **Week 2** — P1 citation spatial preview. Shippable on its own, highest visible polish per hour.
3. **Week 3** — P2 hybrid retrieval. Backend only, fully unit-testable, fixes real wrong answers.
4. **Week 4–5** — P3 robot avatar. Blender rig is the long pole; start it during week 3 in parallel.
5. **Week 6** — P4 guided tour, once P2 and P3 are both merged.
