# AI chat widget + LLM gateway — implementation notes

Tracks progress implementing `docs/chat-widget-implementation-plan.html` (v2) against
`docs/chat-widget-mockup.html`. Updated as work lands; deviations recorded in the
[Deviations](#deviations) section below, most-conservative choice first, no stop-and-ask.

## Status

- [x] Phase 0 — scaffolding (types, config, env, component skeleton, store)
- [x] Phase 1a — widget shell (React port of mockup, mounted in root layout)
- [x] Phase 1b — LLM gateway (`lib/llm/*`, 4 provider adapters)
- [x] Phase 1c — chat endpoint wiring (context builder, route, client stream reader)
- [x] Phase 1d — hardening (rate limiting, a11y pass)
- [ ] Phase 2 — agent behaviors (explicitly deferred to a separate PR per plan D7)
- [x] §9 — mechanical refactoring / cleanup
- [x] Manual browser verification (dev server + preview tooling) — see Deviations #11, #12
- [x] Phase 1e — abuse/cost hardening (concurrency limit, token quota, hard context budget, test suite) — see below

## Bugs found and fixed during manual verification

Caught by actually running the app in a browser, per CLAUDE.md ("manually verify affected
pages/components in the browser — lint and type-check alone are not sufficient
confirmation"). Both were real defects, not environment noise — isolated with
`console.debug` instrumentation and confirmed via direct `document`/`localStorage`
inspection (screenshots/snapshots proved unreliable mid-session and are not what caught
these):

1. **Suggestion chips never appeared after the first-ever visit.** `hydrate()` in
   `hooks/use-chat-store.ts` only seeded `suggestions` in the "no persisted history" branch.
   Once a conversation exists in `localStorage` (i.e. on every reload after the very first),
   `hydrate()` took the "resume" branch and left `suggestions` at its initial `[]` forever —
   so a returning visitor would see zero suggestion chips, permanently. Fixed by re-seeding
   the default suggestions on resume too, except when the trailing message is a still-empty
   assistant message (mid-stream resume, where suggestions should stay empty until that
   response finishes).

2. **Panel used Tailwind's default `sm:` breakpoint (640px) instead of the plan's 480px
   mobile cutoff.** The JS-driven mobile check (`matchMedia("(max-width: 480px)")`, used for
   body-scroll-lock) was already correct, but the panel's own Tailwind classes switched at
   640px, so viewport widths between 480–640px got the full-screen mobile sheet instead of
   the floating 380×560 panel the plan specifies. Fixed by using Tailwind's arbitrary-value
   variant `min-[481px]:` in `components/chat/chat-panel.tsx` instead of `sm:`, aligned with
   the launcher's existing `max-[480px]:hidden` and the JS breakpoint.

## Phase notes

### Phase 0
- `types/chat.ts` — client-safe wire protocol, matches plan §3 exactly.
- `config/chat.ts` — greeting, suggestion chips, limits, rate-limit envelope. References
  models only by alias, per D2.
- `.env.example` — new server-only block, commented to explain `NEXT_PUBLIC_` vs
  server-only convention (repo's first server secrets).

### Phase 1a
- Ported mockup markup/CSS to Tailwind + existing HSL tokens (`app/globals.css`), Framer
  Motion for open/close (already a dependency).
- `components/chat/`: `chat-widget.tsx` (mount-gate, matches `ModalProvider` pattern),
  `chat-launcher.tsx`, `chat-panel.tsx`, `chat-message-list.tsx`, `chat-input.tsx`,
  `suggestion-chips.tsx`.
- Mounted in `app/layout.tsx` next to `ModalProvider`.
- `hooks/use-chat-store.ts` — zustand store mirroring `use-modal-store.ts`.

### Phase 1b — LLM gateway
- `lib/llm/types.ts`, `errors.ts`, `config.ts`, `registry.ts`, `index.ts`, `README.md`.
- `lib/llm/providers/{anthropic,openai,google,groq}.ts` — thin adapters over `@ai-sdk/*`
  (D6-A).
- Chose D2 defaults from the plan: `chat = anthropic:claude-haiku-4-5`,
  `cheap = groq:llama-3.1-8b-instant`.
- D8 fallback mechanism implemented but left dark (`LLM_CHAT_FALLBACKS` unset by default),
  per the plan's recommendation.

### Phase 1c
- `lib/chat/context.ts` — system prompt from config + blog frontmatter, cached per lambda
  instance, soft ~15k token budget assert (D3).
- `app/api/chat/route.ts` — validate → rate limit → `streamLLM("chat", …)` → NDJSON.
- `lib/chat/client.ts` — browser NDJSON reader, abort wiring.

### Phase 1d
- `lib/chat/rate-limit.ts` — Upstash-backed, D5 envelope (10/5min, 40/day, input/output
  caps).
- Focus trap, `role="dialog"`, `aria-live="polite"` region for streamed tokens, Escape to
  close, focus return to launcher.

### §9 cleanup
- Removed dead CORS header block in `next.config.js` for `/api/sb-contact`.
- Dropped `nodemailer`, `@types/nodemailer`, `@sendgrid/mail`, `types` from `package.json`
  (zero imports, confirmed via grep before removal).
- Deleted empty `AI Agent Porfolio/` directory.
- Moved `chat-widget-mockup.html` and `chat-widget-implementation-plan.html` into `docs/`.
- Typed `routesConfig` in `config/routes.ts` (`any` → `NavItem[]`).
- Migrated ESLint config from `.eslintrc.json` to flat config (`eslint.config.mjs`) and
  fixed `package.json`'s `lint` script — see Deviation 6, this was required to get
  verification working at all, not optional polish.
- `eslint.config.mjs` — `no-restricted-imports` blocking `lib/llm/providers/*` and
  `@ai-sdk/*`/`ai` imports outside the gateway.
- New chat icons (`send`, `chatBubble`, `reset`) added to `components/common/icons.tsx`
  via `lucide-react`, matching existing icon-map convention instead of inline SVGs.

## Deviations

Recorded as they came up during implementation; most conservative option chosen in each
case, then work continued without stopping.

1. **No live provider smoke tests.** The plan's Phase 1b step 7–8 and the verification
   checklist (§8) call for smoke-testing each configured provider end-to-end with real API
   keys. This environment has no provider keys configured (`.env` has none of
   `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` / `GROQ_API_KEY`
   set). Conservative choice: implement all four adapters faithfully against the
   `@ai-sdk/*` interfaces and verify with `tsc`/lint plus manual code review, but do not
   claim live end-to-end verification. Documented as an open item — whoever adds real keys
   must run the model-swap drill and golden-question set from §8 before public launch.

2. **No automated unit tests / `FakeProvider` harness.** `CLAUDE.md` states this repo has
   no test suite configured, and verification is lint + `tsc` only. The plan's step 6 asks
   for gateway unit tests against a `FakeProvider`. Conservative choice: did not introduce
   a new test runner/framework as a side effect of this feature (would violate "don't
   introduce unnecessary dependencies" and "minimize scope"). Instead, `lib/llm/README.md`
   documents the `FakeProvider` pattern and the gateway is structured (pure functions,
   dependency-injectable registry) so tests are trivial to add the moment a runner exists.

3. **Rate limiter fails closed in production when unconfigured, open in development.**
   The plan assumes Upstash is always configured before public deploy. Since
   `UPSTASH_REDIS_REST_URL`/`TOKEN` aren't set in this environment, a strict reading would
   make local dev of the chat feature impossible. Conservative choice given the plan's own
   HIGH-severity "cost abuse" risk (§7): if the env vars are missing, requests are allowed
   through in non-production (`NODE_ENV !== "production"`) with a one-time console warning,
   but rejected with 500 in production. This preserves "no accidental unlimited-cost
   endpoint in prod" while not hard-blocking local iteration.

4. **D2/D3/D5/D6/D8 (marked REVIEW in the plan) resolved using the plan's own stated
   recommendation, not left pending.** The user asked to implement without stopping for
   edge cases; these aren't edge cases but the plan explicitly flags them as the user's
   call. Conservative resolution: adopted each section's own recommended default verbatim
   (D2 defaults, D3 unchanged, D5 unchanged, D6-A over D6-B, D8 mechanism-in/env-unset).
   If any of these were meant to go the other way, they're single-line/env changes, not
   architectural rework — see the corresponding section in `lib/llm/README.md`.

5. **Upstash package added as a real dependency despite no credentials being available to
   test it.** Alternative would be a hand-rolled in-memory limiter. Conservative choice:
   followed the plan's explicit architecture decision (D5) rather than substituting an
   approach not in the plan; in-memory limiting is unsound across serverless instances
   anyway and would be a worse default to ship.

6. **`bun run lint` / `next lint` was already broken before this feature — fixed as a
   prerequisite, not scope creep.** This repo pins `eslint@^9.38` (flat-config-only) but
   shipped an old-style `.eslintrc.json`, and `next lint` no longer exists as a CLI command
   in Next 16 (confirmed via `npx next --help` and by reproducing the same failure on the
   pre-existing commit via `git stash`). CLAUDE.md hard-requires lint to pass before
   declaring work done, so this had to be fixed to verify anything in this PR. Conservative
   fix: migrated to `eslint.config.mjs` importing `eslint-config-next/core-web-vitals`
   directly (its native flat-config export), and pointed `package.json`'s `lint` script at
   `eslint .`. Deliberately did **not** use the `FlatCompat`/`compat.extends(...)` pattern
   from Next's docs — reproduced with a standalone `node -e` script and confirmed it throws
   `TypeError: Converting circular structure to JSON` on this exact dependency combination
   (`@eslint/eslintrc@3.3.3` + `eslint-plugin-react@7.37.5`'s self-referential flat config),
   independent of anything in this feature.

7. **Full-repo `bun run lint` still reports pre-existing findings in files this feature
   never touches.** Once lint actually ran (see #6), it surfaced 2 errors + 3 warnings in
   `app/(root)/projects/[projectId]/page.tsx`, `providers/modal-provider.tsx`,
   `components/common/intersection-observer-wrapper.tsx`, `components/ui/adaptive-image.tsx`,
   and `components/ui/responsive-image.tsx` — all pre-existing code, newly caught by
   `eslint-plugin-react-hooks`'s stricter v7 rules bundled in `eslint-config-next@16`.
   Conservative choice: left these untouched per CLAUDE.md ("do not refactor unrelated code
   in the same commit" / minimize diff scope) rather than opportunistically fixing them.
   Verified instead that lint is clean when scoped to every file this feature added or
   touched (`npx eslint app/api/chat components/chat lib/llm lib/chat hooks/use-chat-store.ts
   config/chat.ts types/chat.ts app/layout.tsx` → zero output). Whoever picks up those five
   pre-existing files should fix them in their own change.

8. **AI SDK version installed (`ai@7.0.15`) is materially newer than the plan's docs-era
   assumptions, so the provider adapters were written against the real installed
   `fullStream` part shapes, not guessed.** Verified via the installed `node_modules/ai`
   type declarations rather than trusting older documentation: text deltas arrive as
   `{ type: "text-delta", text }` (not `{ type: "text" }`), and `finish`/`abort`/`error`
   parts were cross-checked the same way. No behavior change to the plan's contract —
   `LLMStreamChunk` (our own interface) is unaffected — just noting the adapters were
   validated against the actual dependency, not an assumption.

9. **`ChatWidget` is a plain import in `app/layout.tsx`, not `next/dynamic(..., { ssr:
   false })` as the plan's Phase 1a step 4 suggests.** `bun run build` failed with
   `ssr: false is not allowed with next/dynamic in Server Components` (Next 16 forbids it
   — `app/layout.tsx` is a Server Component). Conservative fix: import the (already
   `"use client"`, already mount-gated) component directly, exactly like the existing
   `ModalProvider` is imported in the same file. Mount-gating alone already prevents any
   SSR/hydration mismatch; the only thing lost versus `next/dynamic` is a separate chunk
   for the chat widget, which is a minor bundle-size optimization, not a correctness
   requirement — `bun run build`'s route output confirms `/api/chat` and the rest of the
   site still build and prerender correctly with this change.

10. **Rate-limit UI shows a generic retry banner, not a live countdown timer.** The plan's
   §4/§8 describe "a rate-limit bubble with countdown." The server does return a computed
   `Retry-After` (seconds) on 429, but wiring a live-updating countdown through the NDJSON
   `error` event (which only carries `code`/`message`, per the plan's own `ChatStreamEvent`
   type in §3) would mean widening that wire protocol type — the plan explicitly scopes
   `types/chat.ts` as fixed contract. Conservative choice: surface the server's message in a
   static retry banner with a manual "Retry" button instead of extending the protocol
   speculatively. `Retry-After` is still sent as a response header for any future client
   that wants to read it.

11. **Suggestion chips missing after first visit (real bug, not a plan deviation) — fixed,
   not just documented.** See "Bugs found and fixed during manual verification" above.
   Called out separately here because it's the kind of defect lint/`tsc` cannot catch —
   this is the concrete reason CLAUDE.md requires manual browser verification for this repo.

12. **Panel breakpoint mismatch (`sm:` vs. the plan's 480px) — fixed, not just documented.**
   Same rationale as #11: a visual/responsive bug invisible to lint or type-check, only
   caught by actually opening the widget at several viewport widths.

## Phase 1e — abuse/cost hardening (2026-07-08)

Follow-up pass closing gaps found in a review of the shipped safeguards: hard
(not just dev-warning) token/context budgets, a per-IP concurrency limiter,
a per-IP daily token quota, a spend-cap visibility log, and fallback-chain
blast-radius documentation — plus this repo's first test suite. See
`/Users/phongmac/.claude/plans/plan-for-the-implementation-mossy-pebble.md`
for the full design; summary below.

**New files:** `lib/chat/redis.ts` (shared Redis client + fail-open/closed
policy, extracted from `rate-limit.ts`), `lib/chat/token-budget.ts` (pure
token estimation/trimming), `lib/chat/concurrency-limiter.ts` (atomic
Lua-script-backed per-IP slot acquire/release), `lib/chat/token-quota.ts`
(daily per-IP output-token budget, check/record split). Plus one test file
per new/existing-but-untested module (`lib/chat/*.test.ts`,
`lib/llm/config.test.ts`, `lib/llm/index.test.ts`, `lib/llm/registry.test.ts`
— 47 tests total).

**Changed:** `lib/chat/context.ts` (delegates prompt assembly + hard-budget
trimming to `token-budget.ts`; `buildSystemPrompt()` now returns
`{prompt, estimatedTokens}` instead of a bare string), `lib/chat/rate-limit.ts`
(uses the shared Redis client), `lib/llm/registry.ts` (startup log +
test-only `__setProvidersForTests`/`__resetRegistryForTests` hooks),
`lib/llm/index.ts` (fallback-chain visibility log), `app/api/chat/route.ts`
(full orchestration: history trim → parallel rate/concurrency/quota checks →
combined budget check → stream, with slot release + usage recording wired
through), `config/chat.ts` (`concurrency`, `contextBudget`,
`limits.dailyTokenBudget`), `types/chat.ts` (new `"concurrency_limited"`
`ChatErrorCode`), `package.json` (`test` script, `@types/bun` devDependency).

### Deviations (continued numbering)

13. **`mock.module` was replaced with a plain test-only injection hook after
   it caused real cross-file test pollution.** The plan explicitly called
   for `mock.module` in `lib/llm/index.test.ts` as "the one justified
   exception" to parameter injection (faking the provider registry without
   changing `streamLLM`'s public signature). In practice, `mock.module`
   patches Bun's module registry process-wide, and an `afterEach`/`afterAll`
   restore was not sufficient to prevent `lib/llm/registry.test.ts` (a
   separate file) from observing `index.test.ts`'s fake registry when the
   full suite ran together — confirmed by running `registry.test.ts` alone
   (passes) vs. as part of `bun run test` (failed, 0 log calls observed
   where 1 was expected). Conservative fix: added a tiny test-only export,
   `__setProvidersForTests(providers)`, to `registry.ts` (same pattern as
   the pre-existing-in-spirit `__resetRegistryForTests`), and rewrote
   `index.test.ts` to seed the real registry directly instead of mocking
   the module. This is less machinery than the `mock.module` approach, not
   more — the plan's stated tradeoff (avoid changing `streamLLM`'s
   signature) is preserved; only `registry.ts` gained two small,
   clearly-named test-only exports.

14. **`buildSystemPrompt()`'s return type changed from `Promise<string>` to
   `Promise<{prompt, estimatedTokens}>`.** Needed so `route.ts` can run
   `checkCombinedBudget()` without re-estimating the system prompt's token
   count a second time. `buildSystemPrompt` has exactly one caller
   (`app/api/chat/route.ts`), so this is a same-PR, fully-updated signature
   change, not a breaking change to any external contract.

15. **Live verification of the concurrency limiter and daily token quota
   rejecting real traffic was not possible in this environment** — same
   root cause as the original implementation's Deviation #1 (no
   `UPSTASH_REDIS_REST_URL`/`TOKEN` configured here), which makes both
   guards fail open in development by design. Verified instead via: (a) the
   full unit-test suite exercising both the atomic accept/reject logic and
   the fail-open/fail-closed policy against a fake in-memory Redis
   (`lib/chat/concurrency-limiter.test.ts`, `lib/chat/token-quota.test.ts`),
   and (b) a manual browser pass confirming the route doesn't regress or
   crash under parallel requests and that oversized-input validation still
   behaves identically to before this change. Whoever adds real Upstash
   credentials should re-run the manual burst/quota checks described in the
   plan's Verification section against live Redis before relying on these
   guards in production.

