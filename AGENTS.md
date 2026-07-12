# AGENTS.md

High-signal instructions for AI coding agents working in this repo. Verify everything against the code; if docs and code disagree, trust the code.

## Project Overview
- Personal portfolio + blog site for Le Thanh Phong (phonghub.cloud): experience, projects, skills, résumé, Markdown blog, and an AI chat widget.
- Single Next.js App Router site, statically prerendered where possible. **No database, no separate backend.** Content lives in Markdown (`content/blog`) and static modules (`config/*.ts`); server actions live in `app/api/*` route handlers.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict; `@/*` → repo root)
- **Runtime & package manager**: Bun (`bun.lock`). Node 22+ also works; lockfile is Bun's.
- **Styling**: Tailwind CSS, Radix UI primitives, `class-variance-authority`, Framer Motion, `next-themes`
- **Forms/state**: `react-hook-form` + `zod`, `zustand`
- **LLM gateway**: provider-agnostic internal layer in `lib/llm/` over the Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/mistral`)
- **Rate limiting**: `@upstash/ratelimit` + `@upstash/redis`
- **Content**: Markdown parsed with `gray-matter` / `remark` / `remark-html` / `marked`
- **Lint/format**: ESLint flat config (`eslint.config.mjs`, `eslint-config-next/core-web-vitals`), Prettier (`.prettierrc`)
- **Deploy**: Vercel (`vercel.json`: `bun install` / `bun run build`, output `.next`)

There is **no email backend** — the `/contact` page is a static `ProfileCard`, not a form-to-email service.

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
3. `bun run test` — covers `lib/llm/*` and `lib/chat/*` pure logic (gateway routing, fallback, token budget/quota, concurrency limiter, Redis guards). Uses a local `FakeProvider`; no real API keys or network.
4. There is **no component/integration/e2e suite** — for UI or route-handler changes, also verify the affected page in the browser.

## The `bun:test` quirk
Every file in `lib/llm` and `lib/chat` imports the `server-only` package, which throws outside Next's bundler. Tests therefore require `--conditions react-server` (already baked into the `test` script). Module mocks were found to leak across `bun:test` files in this Bun version, so tests inject a fake provider via the test-only `__setProvidersForTests()` export in `lib/llm/registry.ts` instead of `mock.module`.

## Architecture boundaries (easy to break)
- **`lib/llm` is the only import surface for LLM calls.** App code imports `lib/llm` (the public `index.ts` → `streamLLM`); it must **not** import `@ai-sdk/*`, `ai`, or `lib/llm/providers/*`. This is enforced by an ESLint `no-restricted-imports` rule in `eslint.config.mjs`.
- **`lib/llm/**` is ESLint-ignored** (so the provider adapters can legitimately import `@ai-sdk/*`). If you add lint rules, keep that ignore or the build breaks.
- **`lib/llm` is guarded by `server-only`** — an accidental client import fails the build.
- **Business logic (content loading, formatting, filtering) belongs in `lib/`** — UI components must not read the filesystem or parse Markdown directly; go through `lib/blog` and `lib/api.ts`.
- **Server-only code (LLM keys, GitHub starring, email if ever added) belongs in `app/api/*` or `lib/llm` / `lib/github`.** Never prefix a secret env var with `NEXT_PUBLIC_`.

## Repository Structure
```
app/
  (root)/         # Public pages: home, experience, projects, skills, resume, contact, blogs, list100
  api/            # Route handlers: blog, chat (NDJSON stream), experiences, github, projects, skills
components/        # UI grouped by feature (blog, chat, contact, experience, projects, skills, ui, ...)
config/            # Static content/metadata: site, routes, pages, projects, experience, skills, socials, constants, chat
content/blog/      # Markdown posts
lib/
  blog/            # Markdown parsing/service
  llm/             # Provider-agnostic LLM gateway (see lib/llm/README.md)
  chat/            # System prompt, token budget/quota, concurrency limiter, rate limit, client stream reader
  github/          # GitHub "star" client
  content/         # Content helpers
  api.ts, utils.ts
hooks/, providers/ # Shared hooks + context providers (incl. chat zustand store)
types/             # Client-safe shared types (chat wire protocol)
public/, assets/   # Static assets and fonts
docs/              # GIT_WORKFLOW.md, chat-widget plans
```

## Operational gotchas (hard-earned)
- **`NEXT_PUBLIC_APP_URL` must be a reachable URL at build time.** `next build` prerenders pages that fetch this app's own API routes (`/api/projects`, `/api/skills`, …) with **no local server running** — set it to your deployed URL (e.g. `https://phonghub.cloud`) or the build fails.
- **Rate limiting is env-gated with split behavior.** If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are unset, `/api/chat` and `/api/github/star` **reject in production** but **allow through in development** (with a console warning). Always set Upstash before deploy.
- **No provider spend caps are enforced by this repo.** Rate limiting bounds request volume, not $ per request. Set a spend/usage cap in each configured provider's console before public deploy (see `lib/llm/README.md`).
- **Model routing env overrides** (`provider:model` format): `LLM_CHAT_MODEL`, `LLM_CHEAP_MODEL` override alias defaults in `lib/llm/config.ts`; `LLM_CHAT_FALLBACKS` (comma-separated) enables a pre-token-only fallback chain for the `chat` alias (off by default).
- **Never modify generated files**: `.next/`, `next-env.d.ts`.

## Coding Conventions
- Match existing patterns in `app/`, `components/`, `lib/`, `config/`. Reuse UI primitives in `components/ui`.
- Formatting is Prettier-enforced (`.prettierrc`); ESLint is `next/core-web-vitals` plus the `lib/llm` import boundary.
- Don't introduce unnecessary dependencies — this is a static portfolio with a single LLM gateway.

### Tailwind CSS Design System
Full guide: [docs/TAILWIND-STYLES.md](docs/TAILWIND-STYLES.md). Key rules:
- **Tokens before arbitrary values.** Use semantic tokens (`bg-card`, `text-muted-foreground`, `border-chat-border`, `bg-success`, `text-warning`) registered in `tailwind.config.ts` + `app/globals.css`. Never write `bg-[hsl(var(--token))]` or hardcode palette colors (`bg-emerald-500`) or hex (`text-[#b7b9cb]`).
- **Scale before `[px]`.** Use `h-8`/`gap-4`/`rounded-lg`, not `h-[32px]`/`gap-[18px]`. Arbitrary values are reserved for fluid type (`clamp()`), viewport math (`100dvh`), and pixel-positioned layout.
- **Primitives before raw elements.** `<Card>`, `<Button>`, `<Badge>` over hand-rolled `<div>`/`<button>`/`<span>` with the same class string.
- **Accessibility: canonical focus ring** on every interactive element: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- **No dead CSS.** Unused classes in `globals.css` get deleted. Reusable static styles go in `@layer components` (e.g. `.text-gradient-animated`), not inline `style={{}}`.

## Hard Constraints
- Never skip verification (lint + typecheck + test) before declaring work done.
- Never mark work complete with failing checks.
- Never change public routes or API contracts (`app/api/*`) without updating `README.md`.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Preserve the config-driven, Markdown-based, no-database architecture unless asked otherwise.
- Ask before destructive operations (force-push, deleting content, resetting env files).

## Git Workflow
See [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md): branch prefixes `feature/`, `fix/`, `refactor/`, `docs/`; Conventional Commits subjects (≤72 chars, imperative). Keep PRs small and explain *why*.

## Important Documents
- [README.md](README.md) — project overview, full feature list, env var table
- [.env.example](.env.example) — all env vars (annotated, server vs. public)
- [lib/llm/README.md](lib/llm/README.md) — LLM gateway internals, adding a provider, env keys, test setup
- [implementation-notes.md](implementation-notes.md) — build log + documented deviations (chat widget, rate limiting)
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — branch/commit/PR rules
