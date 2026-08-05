# Test-Driven Development (TDD)

This is the WORKFLOW rule for writing code with logic in this repo. It sits on top of the coding conventions (naming, comments, structure) and the actual test suite under `lib/**/*.test.ts` run via `bun run test`. Where those state how code should look and how the suite runs, this rule states the order: test first, then the minimal code, then cleanup.

## Mandatory for code changes with logic

Code changes with behavior/logic follow the Red-Green-Refactor cycle.

"With logic" means: a new behavior, a changed code path, a condition, a calculation, a data transformation, a validation, a mapping. Pure mechanics without behavior change fall under the exceptions below.

This repo is config-driven and Markdown-based with no database — "logic" concentrates in `lib/` (content normalizers, LLM gateway, chat tools/guards, data query helpers, device/physics utilities) and in `app/api/*` route handlers. UI components in `components/` are largely presentational (RSC/client split); use that split to decide whether a change needs a test.

### Phase 1: RED (test first)

Write a test in a co-located `*.test.ts` file next to the module under test (e.g. `lib/data/skills.ts` → `lib/data/skills.test.ts`, matching `lib/llm/config.test.ts`, `lib/chat/tools.test.ts`, `lib/ai-tools/registry.test.ts`).

The test MUST fail (proves the feature/fix does not yet exist).

No production code before the failing test.

### Phase 2: GREEN (minimal implementation)

Write only the code that makes the test green.

YAGNI: no premature optimization, no code "for later."

Must pass, in order:

```bash
bun run lint
bunx tsc --noEmit
bun run test             # bun:test, runs with --conditions react-server
```

Run a single file while iterating: `bun test path/to/file.test.ts` (still needs `--conditions react-server` — use `bun run test <file>` or pass the flag explicitly).

If the module under test (or anything it imports) pulls in `server-only` — most of `lib/llm` and `lib/chat` — do not reach for `mock.module`; module mocks leak across `bun:test` files in this Bun version. Use the test-only seams already in place, e.g. `__setProvidersForTests()` in `lib/llm/registry.ts`, and follow the pattern in `lib/llm/index.test.ts`.

### Phase 3: REFACTOR (cleanup)

Improve code smells, duplication, naming per the project's coding conventions.

Tests stay green.

## Test count per feature/fix

Minimum floor for any new function/module with logic: at least a happy path + one error/empty case.

For a real feature or fix, the TARGET is the following breakdown — at least four tests that together secure the behavior:

1. **Reproduction test** — the Red test before the fix/feature.
2. **Happy path** — the expected normal case.
3. **Edge cases** — empty/missing/unexpected inputs (e.g. an empty `content/blog/` post, a config entry missing an optional field, an unset env var falling back per `lib/llm/config.ts`).
4. **Boundary values** — the edges of a valid range (e.g. token budget/quota limits in `lib/chat/token-budget.ts` / `token-quota.ts`, concurrency limiter caps in `lib/chat/concurrency-limiter.ts`).

Floor and target are not contradictory: the floor applies to trivial helpers, the target to features and fixes. More tests are allowed, fewer than the floor are not.

No artificial tests just for counting — every test checks a real behavior property.

## Bug fixes

ALWAYS write a test that reproduces the bug first (RED, proves the bug), co-located with the module in its `*.test.ts` file.

Then fix until GREEN.

The reproduction test stays in the repo as a regression guard.

## Exceptions (established project practice)

TDD is NOT enforced for:

- Pure documentation changes (`docs/`, `README.md`, `AGENTS.md`, no code).
- Pure configuration without logic (`eslint.config.mjs`, `next.config.js`, `.prettierrc`, `components.json`, static entries in `config/*` that only add data, not behavior).
- Mechanical refactors with existing test coverage: file splits, re-export moves, renames within `lib/`. Here the existing suite MUST stay green (proves nothing broke), but no new behavior tests are enforced.
- Presentational UI in `components/` with no branching logic (pure layout/markup). If a component contains a condition, formatting logic, or derived state, it counts as logic and needs a test or a manual browser check (there is currently no component/integration/e2e suite in this repo).
- Visual/responsive-only aspects that aren't testable via `bun:test` remain a manual browser check — TDD does not replace verifying the affected page in a browser.

The exceptions do not exempt from the hard rule: lint + typecheck + `bun run test` must stay green after every change, and UI/route changes must be verified in the browser.
