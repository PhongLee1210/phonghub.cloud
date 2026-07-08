# AGENTS.md

## Project Overview
- Personal portfolio and blog site for Le Thanh Phong (phonghub.cloud), showcasing experience, projects, skills, and blog posts.
- Primary users: recruiters, visitors, and the site owner (content author).
- High-level architecture: single Next.js App Router site, statically rendered where possible, with a Markdown-based blog (content/blog) and a contact form backed by SendGrid/Nodemailer. No separate backend service.

## Tech Stack
- Language: TypeScript
- Framework: Next.js 16 (App Router), React 19
- Runtime: Bun
- Package manager: Bun (`bun.lock`)
- Styling: Tailwind CSS, Radix UI primitives, Framer Motion
- Database: None — content is Markdown files in `content/blog`, parsed with `gray-matter` / `remark`
- AI/LLM libraries: None currently integrated in this repo
- Testing: Not configured yet — see "Hard Constraints" before adding a framework

## Repository Structure
- `app/` — routes, layouts, API routes (App Router)
- `components/` — UI and feature components (blog, contact, projects, skills, ui, ...)
- `config/` — static site config (routes, socials, skills, projects, constants)
- `content/blog/` — Markdown blog posts
- `lib/` — data access and utility helpers (`lib/blog`, `api.ts`, `utils.ts`)
- `hooks/`, `providers/` — shared React hooks and context providers
- `public/`, `assets/` — static assets and fonts

## First Run
```bash
bun install
cp .env.example .env.local
bun dev
bun run build
```

## Verification
```bash
bun run lint
bunx tsc --noEmit
```
There is no automated test suite yet. Manually verify affected pages/components in the browser before calling a change done.

## Development Workflow
1. Read `README.md` and relevant existing components first.
2. Make the smallest possible change.
3. Run verification (lint + typecheck).
4. Fix failures.
5. Update `README.md` or add a `docs/` note if behavior or setup changed.

## Coding Conventions
- Follow existing patterns in `app/`, `components/`, and `lib/`.
- Keep components and functions small and focused.
- Prefer explicit types over `any`.
- Avoid duplication; reuse existing UI primitives in `components/ui`.
- Do not introduce unnecessary dependencies — this is a static portfolio site.
- Formatting is enforced by Prettier (`.prettierrc`) and `next/core-web-vitals` ESLint config.

## Architecture Rules
- Business logic (content loading, formatting) belongs in `lib/`, not in components.
- UI components must not fetch or parse Markdown directly — go through `lib/blog` and `lib/api.ts`.
- There is no database; content changes go through Markdown files in `content/blog` or the `config/` files.
- Server-only code (e.g. email sending) belongs in `app/api/*` route handlers.

## Hard Constraints
- Never skip verification (lint + typecheck) before declaring work done.
- Never mark work complete without passing checks.
- Never change public routes or API contracts without updating `README.md`.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Ask before destructive operations (force-push, deleting content, resetting env files).

## Important Documents
- `README.md` — project overview, tech stack, feature list
- `.env.example` — required environment variables
- `docs/GIT_WORKFLOW.md` — branch naming, commit, and PR rules

## Git Workflow
See [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for branch naming, commit message, and pull request rules.

## Common Commands
```bash
bun install       # install dependencies
bun dev            # start dev server
bun run build      # production build
bun run start      # run production build
bun run lint       # ESLint
bunx tsc --noEmit  # type check
```

## Definition of Done
A task is complete only when:
- Code compiles (`bun run build` or `bunx tsc --noEmit`)
- Lint passes (`bun run lint`)
- Change was manually verified in the browser
- Documentation is updated if behavior or setup changed
