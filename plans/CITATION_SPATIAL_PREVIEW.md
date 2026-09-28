# P1 — Citation Chip → Spatial Preview

_Effort: S–M. No Blender. No new WebGL context. Ships independently._

## Problem

`components/chat/resource-citation-chips.tsx` renders every cited resource as a chip with a Radix `Tooltip` showing title + type + description. It is correct and it is flat. Two things are lost:

1. **Spatial connection.** The site already knows where each entity lives in the DOM (`lib/chat/entity-dom.ts` → `resolveEntity()` via `[data-agent-id]`). A chip for a project that is *right there on the page* looks identical to a chip for one that is three routes away.
2. **Substance.** The tooltip shows `citation.description` — the same summary the assistant already said in prose. It adds nothing the visitor didn't just read.

## Goal

Hovering a citation chip answers "where is this, and what does it look like?" in one gesture:

- **On this page** → draw a connector from the chip to the live element, outline it, and scroll-hint if it's off-screen.
- **Not on this page** → show a rich preview card (cover image, tech chips, meta) with a tilt-on-pointer 3D feel, and a "take me there" affordance.

## Design

### Two states, one component

```
chip hovered
   │
   ├─ resolveEntity(agentId) !== null ──► CONNECTED
   │     • SVG connector: chip edge → element center, animated pathLength
   │     • element gets .agent-previewed (softer than .agent-highlighted)
   │     • if off-viewport: connector ends in an edge arrow + "↓ 2 sections below"
   │     • presence bus: { state: POINTING, lookAt: elementCenter }   ← robot glances (P3)
   │
   └─ null ────────────────────────────► DETACHED
         • CitationPreviewCard in a portal, anchored above the chip
         • cover image from public/projects/<id>/…, tech chips, dates
         • CSS 3D tilt (rotateX/rotateY from pointer offset, max 8°)
         • footer: "Open →" (the existing Link behaviour)
```

### Why CSS 3D and not a third `<Canvas>`

Two WebGL contexts already run (`particle-constellation`, `robot-scene`). A third costs a context, a render loop, and a mobile crash risk for a hover effect. `transform: perspective(800px) rotateX() rotateY()` on a GPU-composited layer gets the same read at ~0 cost. This is a deliberate constraint from the roadmap, not a shortcut.

## Implementation

### New files

| File | Role |
|---|---|
| `hooks/use-entity-viewport.ts` | `(agentId) → { onPage, rect, inViewport, direction }`. Measures on hover only (never per-frame), re-measures on scroll while hovered via a throttled `rAF` listener. |
| `components/chat/citation-connector.tsx` | Fixed-position SVG overlay, `z-[57]`, `pointer-events-none`. One cubic path, `pathLength` 0→1 via framer-motion. |
| `components/chat/citation-preview-card.tsx` | DETACHED-state card. Tilt via `useMotionValue` + `useTransform`, spring `SPRING_SHOWCASE` from `lib/motion.ts`. |
| `lib/chat/geometry.ts` | Pure math: `anchorPoint(chipRect, targetRect)`, `offscreenDirection(rect, viewport)`, `tiltFromPointer(pointer, cardRect, maxDeg)`. **This is the tested part.** |

### Changed files

| File | Change |
|---|---|
| `components/chat/resource-citation-chips.tsx` | Replace the `Tooltip` body with a hover-state dispatch to the two new components. Keep `Tooltip` as the reduced-motion / touch fallback — do not delete it. |
| `app/globals.css` (or wherever `agent-highlight-pulse` lives) | Add `.agent-previewed` — 1px ring, no pulse, 120 ms fade. Distinct from `.agent-highlighted` which the agent owns. |
| `docs/design/MOBILE-FIRST.md` §3 | Add `Citation connector overlay | z-[57] | CitationConnector` to the z-stack table. |
| `lib/agent-presence.ts` | Chip hover writes `{ state: POINTING, lookAt }`; blur restores previous state. No-op until P3 reads it. |

### Geometry contract (`lib/chat/geometry.ts`)

```ts
/** Where the connector leaves the chip and where it lands, in viewport px. */
export function anchorPoint(
  chip: DOMRect,
  target: DOMRect,
): { from: Point; to: Point; control: Point };

/** null when the target is fully visible; otherwise which edge it is past. */
export function offscreenDirection(
  target: DOMRect,
  viewport: { width: number; height: number },
): "up" | "down" | "left" | "right" | null;

/** Pointer offset → rotateX/rotateY degrees, clamped to ±maxDeg. */
export function tiltFromPointer(
  pointer: Point,
  card: DOMRect,
  maxDeg: number,
): { rotateX: number; rotateY: number };
```

All three are pure and synchronous — `bun:test` covers them without a DOM (pass plain rect literals).

### Tests (`lib/chat/geometry.test.ts`)

Per `docs/engineering/TDD.md` target breakdown:

1. **Reproduction** — a chip in the bottom-right panel and a target above it produces a control point that curves *away* from the panel, not through it.
2. **Happy path** — target centred in viewport → `offscreenDirection` returns `null`, `anchorPoint.to` is the target centre.
3. **Edge** — zero-area target rect (element present but `display:none`-adjacent) → treated as off-page, no NaN in the path.
4. **Boundary** — target exactly flush with the viewport bottom edge (`rect.bottom === viewport.height`) → `null`, not `"down"`; one pixel past → `"down"`.
5. **Boundary** — pointer exactly at a card corner → tilt clamps to exactly `±maxDeg`, never beyond.

`use-entity-viewport` and the two components are presentational/DOM-bound → manual browser check per the TDD exceptions list.

## Interaction rules

| Situation | Behaviour |
|---|---|
| Hover, target on page & visible | Connector + `.agent-previewed` ring. No scroll — the visitor didn't ask to move. |
| Hover, target on page & off-screen | Connector to viewport edge + arrow + distance label. Still no auto-scroll. |
| Click | Existing `Link` navigation, unchanged. |
| Touch (no hover) | Tap opens the preview card (DETACHED style) as a small sheet; second tap navigates. Targets ≥ 44 px per §5. |
| `prefers-reduced-motion` | Connector renders instantly at `pathLength: 1`, no tilt, no fade — or fall back to the existing `Tooltip` entirely. Both acceptable; pick one and note it in the component doc comment. |
| Keyboard focus | Same as hover. The chip is already a focusable `Link`; wire `onFocus`/`onBlur` alongside `onPointerEnter`/`onPointerLeave`. |
| Chat panel is a mobile fullscreen takeover (`z-[100]`) | Connector is meaningless — the page is covered. Skip CONNECTED entirely below `lg`. |

## Pitfalls

- **Measuring on scroll is a perf trap.** Only measure while a chip is hovered, throttle to `rAF`, and tear the listener down on blur. Never a `ResizeObserver` per chip.
- **`getBoundingClientRect` includes live transforms.** `robot-companion.tsx:documentOffsetTop` exists precisely because the home page animates `#experience`/`#blog` with y/scale. For the connector you *want* the transformed rect (it's a visual overlay) — but do not reuse this rect for anything layout-related.
- **Stale connector after a route change.** The chat panel persists across navigation; the target element does not. Clear on `pathname` change.
- **The connector must not cover the chat panel.** `z-[57]` sits below the desktop panel (`z-[58]`) deliberately — the line visually tucks under the panel edge, which reads better than crossing it.
- **Don't over-animate.** Three overlapping effects (connector draw + ring + card tilt) on one hover reads as noise. CONNECTED and DETACHED are mutually exclusive by design; never show both.
