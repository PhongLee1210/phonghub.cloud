# P4 — Guided Tour Agent

_Effort: L. Depends on P2 (retrieval quality) and P3 (robot narration). Do this last._

## Problem

The agent can already do each step of a tour: `navigate_to` moves the visitor, `reveal` highlights a card, `open_detail` opens a modal. What it cannot do is **chain them into a narrated sequence**, for two reasons:

1. **The step cap.** Every provider adapter sets `stopWhen: req.tools ? stepCountIs(3) : undefined` (`lib/llm/providers/*.ts:25`). A tour of even three stops needs far more than three model steps.
2. **No sequencing primitive.** `tool_effect` events fire immediately and independently. Nothing waits for a route change to finish painting before highlighting an element that doesn't exist yet.

## Goal

> "Give me the 2-minute tour of his AI work."

The agent plans a 3–5 stop route, then the client executes it: navigate → wait for paint → robot points → narration streams into chat → pause → next. With visible progress, and a stop button that actually stops it.

This is the feature that turns the portfolio from a site with a chatbot into a site the agent *operates* — and it's the one worth demoing in an interview.

## Design

### Plan-then-execute, not step-by-step

Do **not** let the model drive the tour turn by turn. That multiplies latency by the number of stops and makes every stop a chance to hallucinate. Instead: one tool call returns the whole plan, the client executes it deterministically.

```
visitor: "give me a tour of his AI work"
   │
   ▼
model calls search_projects({ query: "AI" })      ← P2 makes this actually work
   │
   ▼
model calls start_tour({ stops: [...] })          ← one call, whole plan
   │
   ▼ server validates every stop, drops invalid ones, caps at MAX_TOUR_STOPS
   │
   ▼ emits ChatEventType.Tour { stops }
   │
   ▼ client useTourRunner executes sequentially — no further LLM calls
```

Narration text comes **from the tool arguments**, authored by the model at plan time. One generation, no per-stop round trip.

### The tool (`lib/chat/tools.ts`)

```ts
const startTourTool = tool({
  description:
    "Take the visitor on a short guided tour of the site: 2-5 stops, each " +
    "navigating to a page and pointing out one resource with a one-sentence " +
    "narration. Use when the visitor asks for a tour, an overview, or to be " +
    "walked through the work. Call only after searching, so every target is real.",
  inputSchema: z.object({
    intent: z.string().describe("What the tour is about, e.g. 'AI and agent work'."),
    stops: z.array(z.object({
      route: z.string().describe("Destination route, e.g. '/projects'."),
      target: z.string().describe("The exact agentId to point out at this stop."),
      narration: z.string().max(180).describe("One sentence, spoken as the tour guide."),
    })).min(2).max(5),
  }),
  execute: async ({ intent, stops }) => {
    const valid = stops.filter(
      (s) => isAllowedRoute(s.route) && (s.target === "resume" || Boolean(parseEntityId(s.target))),
    );
    return valid.length >= MIN_TOUR_STOPS
      ? { ok: true as const, intent, stops: valid.slice(0, MAX_TOUR_STOPS) }
      : { ok: false as const, reason: "not enough valid stops" };
  },
});
```

Validation reuses `isAllowedRoute` and `parseEntityId` — the same guards `navigate_to` and `reveal` already use. A hallucinated agentId drops the stop, it never fails the turn.

### Raising the step cap (`lib/llm`)

`stepCountIs(3)` is hardcoded in all five adapters. Thread it through properly rather than bumping a magic number five times:

```ts
// lib/llm/types.ts
export interface LLMRequest {
  // …
  /** Max tool-calling round trips. Defaults to DEFAULT_MAX_STEPS (3). */
  maxSteps?: number;
}

// each provider adapter
stopWhen: req.tools ? stepCountIs(req.maxSteps ?? DEFAULT_MAX_STEPS) : undefined,
```

`app/api/chat/route.ts` passes `maxSteps: 6`. Six covers search → refine search → start_tour → answer with headroom, and still bounds cost. Add it to `config/chat.ts` `limits` so it sits with the other budgets.

Note this also fixes a latent bug unrelated to tours: "show me his React projects and take me there" needs search + reveal + navigate + text = 4 steps, and silently truncates today.

### Stream protocol

New event, added to `types/chat.ts` and documented in `docs/architecture/AI-CHAT-ARCHITECTURE.md`:

| Event | Fields |
|---|---|
| `tour` | `intent: string`, `stops: TourStop[]` |

`TourStop = { route: InternalRoute; target: CitationTarget; narration: string }`.

Emitted from the `tool_result` branch in `route.ts` alongside the existing `reveal` / `navigate_to` handling. It is a plan, not an effect — the client decides when each part happens.

### Client runner (`hooks/use-tour-runner.ts`)

State machine per stop:

```
NAVIGATING → AWAITING_PAINT → POINTING → NARRATING → DWELL → (next | COMPLETE)
```

| Phase | What happens | Exit condition |
|---|---|---|
| `NAVIGATING` | `router.push(stop.route)` (skipped if already there) | `pathname === stop.route` |
| `AWAITING_PAINT` | poll `resolveEntity(stop.target)` on `rAF` | element found, **or `TOUR_PAINT_TIMEOUT_MS` (2500) elapses → skip stop** |
| `POINTING` | write `{ state: POINTING, lookAt }` to the presence bus (P3); scroll element into view if off-screen | 400 ms |
| `NARRATING` | push `stop.narration` into the message list as an assistant message | text rendered |
| `DWELL` | let the visitor actually look at it | `TOUR_DWELL_MS` (2800), or "Next" clicked |

Cancellation, in priority order — any of these ends the tour immediately:
- visitor sends a message
- visitor clicks Stop on the HUD
- visitor navigates manually (`pathname` changes to something not in the plan)
- `Escape`

### Tour HUD (`components/chat/tour-hud.tsx`)

Fixed, `z-[61]` (above the chat launcher at `z-[60]`, below the nav at `z-[100]`) — **add it to the z-stack table in `docs/design/MOBILE-FIRST.md` §3**.

```
┌──────────────────────────────────────────┐
│  ●━━━●━━━○━━━○      Stop 2 of 4          │
│  Enrollment Platform                     │
│  [ ⏸ Pause ]  [ ⏭ Next ]  [ ✕ Stop ]     │
└──────────────────────────────────────────┘
```

Touch targets ≥ 44 px (§5), bottom-anchored above the mobile tab bar with safe-area insets (§2).

### Mobile

The tour works without the robot — pointing degrades to scroll + `.agent-highlighted`, which is the existing `reveal` behaviour. On mobile the chat panel is a fullscreen takeover (`z-[100]`), so the runner must **collapse the panel to the launcher** before `NAVIGATING` and reopen it for `NARRATING`. Decide this explicitly; a tour behind an opaque panel is the obvious failure mode.

## Tests

`lib/chat/tour-plan.test.ts` — extract plan validation into a pure `validateTourPlan(stops)` so it is testable without the tool wrapper:

1. **Reproduction** — a plan containing an invalid route (`/admin`) drops that stop and keeps the rest.
2. Happy — 4 valid stops pass through in order, unchanged.
3. Edge — a stop whose `target` is an unparseable agentId is dropped; a `"resume"` target is kept.
4. **Boundary** — exactly `MIN_TOUR_STOPS` valid stops → `ok: true`; one fewer → `ok: false`.
5. **Boundary** — `MAX_TOUR_STOPS + 1` stops are truncated to `MAX_TOUR_STOPS`.
6. Edge — duplicate consecutive routes collapse into one `NAVIGATING` phase (no redundant `router.push`).

`lib/chat/protocol.test.ts` — extend: a `tour` event round-trips through `encodeEvent` / the client reader without loss.

`lib/llm/index.test.ts` — extend: `maxSteps` is forwarded to the provider; omitting it uses `DEFAULT_MAX_STEPS`.

`scripts/eval-chat.ts` — add a live case:

```ts
{ label: "Guided tour", prompt: "Give me a quick tour of Phong's AI work.", type: "tour" }
```

with a `runTourAssertions` set in `lib/chat/eval-assertions.ts`:
- a `tour` event was emitted
- `2 ≤ stops.length ≤ 5`
- every `stop.route` passes `assertNoInventedRoutes`
- every `stop.target` resolves via `resolveCitation`
- every `narration` is ≤ 180 chars

The runner itself is DOM/timing-bound → manual browser check.

## Pitfalls

- **`router.push` unmounts the target page.** The element for stop N+1 does not exist at the moment you navigate. `AWAITING_PAINT` with a hard timeout is mandatory — and the timeout must *skip the stop*, not hang the tour.
- **Next.js App Router transitions are async.** `pathname` from `usePathname()` updates before the new page's DOM is necessarily painted. Poll for the element, don't trust the pathname alone.
- **The chat panel persists across navigation, the highlighted element doesn't.** Clear any pending highlight when a stop is skipped, or a stale ring lights up on the next page.
- **Narration as fake streaming.** The text was generated at plan time. Typing it out character-by-character to look "live" is a lie that costs nothing but reads badly if the visitor notices the timing is too even. Fade it in as a complete message instead.
- **Token cost.** Five narrations at ~40 tokens each plus the plan structure runs ~400 output tokens on top of the answer. `chatConfig.limits.maxOutputTokens` is **960** — a tour plus a normal reply can hit the ceiling and truncate mid-JSON. Either raise the cap for turns that call `start_tour`, or cap narration at 120 chars. Verify against a real 5-stop tour before shipping.
- **Scroll fighting.** `robot-companion.tsx` drives its position from `scrollY` via waypoints. A programmatic `scrollIntoView` during `POINTING` moves the robot mid-gesture. Either suppress waypoint updates while a tour is running, or accept the drift — test it before deciding; it may look fine.
- **Reduced motion:** instant scroll (`behavior: "auto"`), no pointing animation, longer `TOUR_DWELL_MS` since there's no motion to signal the transition.
- **Don't let the model narrate facts.** Narration must paraphrase what the search tools returned for that exact `target`. The persona's grounding rules already say this; restate it in the `start_tour` description, because a "tour guide" framing is exactly the kind of prompt that invites embellishment.
