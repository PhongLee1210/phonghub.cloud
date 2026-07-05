# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio and blog site for Le Thanh Phong (phonghub.cloud) — a single Next.js App Router application, statically rendered where possible, with a Markdown-based blog. There is no database and no separate backend service.

## Commands

```bash
bun install        # install dependencies
cp .env.example .env.local
bun dev             # start dev server (http://localhost:3000)
bun run build       # production build
bun run start       # run production build
bun run lint        # ESLint (next/core-web-vitals)
bunx tsc --noEmit   # type check
```

There is no automated test suite configured. Before considering any change done: run `bun run lint` and `bunx tsc --noEmit`, and manually verify the affected pages/components in the browser — there is no substitute for a visual check on this project.

## Architecture

- **Routing**: `app/(root)/` holds the public pages (home, experience, projects, skills, resume, contact, blogs, list100); `app/api/` holds route handlers (`projects`, `experiences`, `skills`, `blog/search`).
- **Content-driven pages**: `projects`, `experience`, and `skills` are backed by static data in `config/*.ts`, exposed through their respective `app/api/*/route.ts` handlers, and fetched via `lib/api.ts#getApiBaseUrl()`. That function matters at build time: `next build` prerenders pages with no local server running, so a relative/localhost fetch would fail — `NEXT_PUBLIC_APP_URL` must be set in the build environment (falls back to `siteConfig.url`).
- **Blog**: Markdown files live in `content/blog/`. `lib/blog/parser.ts` parses a single file's frontmatter + content (via `gray-matter`/`remark`); `lib/blog/service.ts` walks `content/blog/` recursively and exposes list/filter/lookup operations (by slug, category, tag, published status). Blog pages and the `blog/search` API route consume `lib/blog/service.ts` — they must not read or parse Markdown directly.
- **Config layer**: `config/` centralizes structured content and metadata — `site.ts` (site metadata), `routes.ts` / `pages.ts` (route + page metadata), `projects.ts`, `experience.ts`, `skills.ts`, `socials.ts`, `constants.ts`. Changing displayed content (projects, skills, experience entries, nav) usually means editing these files, not components.
- **Components**: organized by feature to mirror `app/` sections (`blog`, `contact`, `experience`, `projects`, `skills`, `list100`, `modals`, `common`), plus `components/ui/` for base primitives (Radix UI + `class-variance-authority` + Tailwind). Reuse `components/ui/` primitives instead of building new base elements.
- **State/data rule**: business logic (content loading, formatting, filtering) belongs in `lib/`; UI components consume `lib/` and `config/`, never `fs`/Markdown parsing directly.

## Conventions

- Formatting is enforced by Prettier (`.prettierrc`, with `prettier-plugin-organize-imports`) and the `eslint-config-next` ESLint config.
- Prefer explicit types over `any`; avoid adding dependencies to this otherwise static site unless clearly justified.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Branch naming, commit message, and PR rules are defined in [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) (Conventional Commits, `feature/...`/`fix/...`/`refactor/...`/`docs/...` prefixes, small PRs).
