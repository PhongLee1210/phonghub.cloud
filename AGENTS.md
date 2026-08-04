# AGENTS.md

High-signal instructions for AI coding agents working in this repo. Verify everything against the code; if docs and code disagree, trust the code.

**This file is the single index for all project documentation** — see the [Doc Index](#doc-index) at the bottom. For human-facing onboarding, features, and stack, see `README.md`.

## Commands
```bash
bun install
bun dev                  # dev server (http://localhost:3000)
bun run build            # next build
bun run start            # serve the production build
bun run lint             # eslint .
bunx tsc --noEmit        # type check
bun run test             # bun:test — IMPORTANT: resolves to `bun test --conditions react-server`
```

Run a single test file: `bun test lib/llm/index.test.ts` (still needs the `react-server` condition — invoke via `bun run test` or add `--conditions react-server`).

## Verification (do not skip)
1. `bun run lint`
2. `bunx tsc --noEmit`
3. `bun run test` — covers `lib/llm/*`, `lib/chat/*`, `lib/ai-tools/*`, `lib/data/*`, `lib/content/*`, `lib/device`, `lib/physics` pure logic (gateway routing, fallback, token budget/quota, concurrency limiter, Redis guards, citation postprocess). Uses a local `FakeProvider`; no real API keys or network.
4. There is **no component/integration/e2e suite** — for UI or route-handler changes, also verify the affected page in the browser.

### Validation Hierarchy

When developing features, always ensure:

- **Level 1: Unit tests** — Must pass
- **Level 2: Integration tests** — Must pass (if applicable)
- **Level 3: End-to-end tests** — Must pass for multi-component changes
- Skipping levels = **Not Complete**

### RTK Usage (logs & test tracking)

```bash
rtk log --tail 50              # print logs for a session
rtk run -- bun run test        # run and track tests
```

## The `bun:test` quirk
Every file in `lib/llm` and `lib/chat` imports the `server-only` package, which throws outside Next's bundler. Tests therefore require `--conditions react-server` (already baked into the `test` script). Module mocks were found to leak across `bun:test` files in this Bun version, so tests inject a fake provider via the test-only `__setProvidersForTests()` export in `lib/llm/registry.ts` instead of `mock.module`.

## Architecture boundaries (easy to break)
- **`lib/llm` is the only import surface for LLM calls.** App code imports `lib/llm` (the public `index.ts` → `streamLLM`); it must **not** import `@ai-sdk/*`, `ai`, or `lib/llm/providers/*`. This is enforced by an ESLint `no-restricted-imports` rule in `eslint.config.mjs`.
- **`lib/llm/**` is ESLint-ignored** (so the provider adapters can legitimately import `@ai-sdk/*`). If you add lint rules, keep that ignore or the build breaks.
- **`lib/llm` is guarded by `server-only`** — an accidental client import fails the build.
- **Business logic (content loading, formatting, filtering) belongs in `lib/`** — UI components must not read the filesystem or parse Markdown directly; go through `lib/blog` and `lib/api.ts`.
- **Server-only code (LLM keys, GitHub starring, Resend email) belongs in `app/api/*` or `lib/llm` / `lib/github` / `lib/lead`.** Never prefix a secret env var with `NEXT_PUBLIC_`.
- **Follow-up suggestions are not a tool call.** `suggest_followups` was removed from `lib/chat/tools.ts`; `lib/chat/suggestion-worker.ts` now fires a separate cheap/fast `streamLLM` call concurrently with the main chat stream (`Promise.all`'d with citation resolution in `app/api/chat/route.ts`) instead.

## Repository Structure
```
app/
  (root)/         # Public pages: home, experience, projects, skills, resume, contact, blogs, list100
  api/            # Route handlers: blog, chat (NDJSON stream), lead (Resend email), experiences, github (star), projects, skills
components/        # UI grouped by feature (ai, blog, chat, contact, experience, projects, skills, ui, ...)
config/            # Static content/metadata: site, routes, pages, projects, experience, skills, contact, socials, constants, chat
content/blog/      # Markdown posts
lib/
  ai-tools/        # Client-side AI tool registry (define/registry) + zustand store
  blog/            # Markdown parsing/service
  chat/            # System prompt, tools (13), citation postprocess, suggestion-worker, token budget/quota, concurrency limiter, rate limit, client stream reader
  content/         # Normalizers aggregating all content into ContentItem[]
  data/            # Query helpers over config (projects/experience/skills)
  github/          # GitHub "star" client
  lead/            # Lead schema (zod), email template (@react-email), lead rate limit
  llm/             # Provider-agnostic LLM gateway (see lib/llm/README.md)
  code-tokenizer.ts, device.ts, motion.ts, utils.ts
hooks/, providers/ # Shared hooks + context providers (incl. chat zustand store)
types/             # Client-safe shared types (chat wire protocol, content)
public/, assets/   # Static assets and fonts
docs/
  engineering/     # CODING-STANDARD, RENDERING-STANDARD (donut pattern)
  design/          # TAILWIND-STYLES, MOBILE-FIRST
  process/         # GIT-WORKFLOW
  architecture/    # AI-CHAT-ARCHITECTURE
```

## Operational gotchas (hard-earned)
- **`NEXT_PUBLIC_APP_URL` must be a reachable URL at build time.** `next build` prerenders pages that fetch this app's own API routes (`/api/projects`, `/api/skills`, …) with **no local server running** — set it to your deployed URL (e.g. `https://phonghub.cloud`) or the build fails.
- **Rate limiting is env-gated with split behavior.** If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are unset, `/api/chat`, `/api/lead`, and `/api/github/star` **reject in production** but **allow through in development** (with a console warning). Always set Upstash before deploy.
- **No provider spend caps are enforced by this repo.** Rate limiting bounds request volume, not $ per request. Set a spend/usage cap in each configured provider's console before public deploy (see `lib/llm/README.md`).
- **Model routing env overrides** (`provider:model` format): `LLM_CHAT_MODEL`, `LLM_CHEAP_MODEL` override alias defaults in `lib/llm/config.ts`; `LLM_CHAT_FALLBACKS` (comma-separated) enables a pre-token-only fallback chain for the `chat` alias (off by default).
- **Never modify generated files**: `.next/`, `next-env.d.ts`.

## Development Workflow

1. Review `README.md` and relevant code in `app/`, `components/`, `lib/`, or `config/`.
2. Design the smallest possible change.
3. Implement, following conventions and using RTK where appropriate.
4. Run full verification (lint, typecheck, and tests) and resolve all issues.
5. Update `README.md` or add to `docs/` if behavior/setup/routes change.

## Hard Constraints
- Never skip verification (lint + typecheck + test) before declaring work done.
- Never mark work complete with failing checks.
- Never change public routes or API contracts (`app/api/*`) without updating `README.md`.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Preserve the config-driven, Markdown-based, no-database architecture unless asked otherwise.
- Ask before destructive operations (force-push, deleting content, resetting env files).

---

## Doc Index

The only place that links to `docs/*`. Individual docs are self-contained (no cross-links).

| Document | Path | Scope |
|---|---|---|
| Coding Standard | [docs/engineering/CODING-STANDARD.md](docs/engineering/CODING-STANDARD.md) | Conventions, comments, constants/enums, runtime guards, logging |
| Rendering Standard | [docs/engineering/RENDERING-STANDARD.md](docs/engineering/RENDERING-STANDARD.md) | Donut pattern, `cacheComponents`, SSR/hydration, browser-extension isolation |
| Tailwind Styles | [docs/design/TAILWIND-STYLES.md](docs/design/TAILWIND-STYLES.md) | Tokens, primitives, focus rings, themes, dead-CSS policy |
| Mobile-First | [docs/design/MOBILE-FIRST.md](docs/design/MOBILE-FIRST.md) | Breakpoints, safe areas, z-stack, springs, sheets |
| Git Workflow | [docs/process/GIT-WORKFLOW.md](docs/process/GIT-WORKFLOW.md) | Branches, commits, PRs |
| AI Chat Architecture | [docs/architecture/AI-CHAT-ARCHITECTURE.md](docs/architecture/AI-CHAT-ARCHITECTURE.md) | Chat agent flow: guards, tools, citations, stream protocol, eval |
| LLM Gateway | [lib/llm/README.md](lib/llm/README.md) | Gateway internals, adding a provider, env keys, test setup |
| Env Vars | [.env.example](.env.example) | All env vars (annotated, server vs. public) |
