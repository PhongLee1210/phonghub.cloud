# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI coding agents working in this repository.

## Project Summary

phonghub.cloud is a personal portfolio and blog site built with Next.js (App Router), React, and TypeScript. Content is data-driven rather than database-backed: projects, experience, and skills live in `config/*.ts` and are served through `app/api/*` route handlers; blog posts are Markdown files in `content/blog/`, parsed and served via `lib/blog/`. Styling uses Tailwind CSS and Radix UI primitives. There is no dedicated `docs/ARCHITECTURE.md` yet — the architecture summary above and in `README.md#project-structure` is the current source of truth.

## Documentation

Read these before making changes:

- [README.md](README.md) — project overview, tech stack, and project structure
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — branch naming, commit message, and PR rules

## Verification

This repo uses Bun scripts, not `make`. Run before considering any change done:

```bash
bun run lint        # ESLint (eslint-config-next)
bunx tsc --noEmit   # type check
```

There is no automated test suite configured yet. Manually verify affected pages/components in the browser — lint and type-check alone are not sufficient confirmation on this project.

## Development Workflow

1. Read `README.md` and the relevant existing code in `app/`, `components/`, `lib/`, or `config/` before changing it.
2. Plan the smallest possible change.
3. Implement it, following existing patterns in the touched directory.
4. Run verification (lint + type check) and fix any failures.
5. Update `README.md` or add/update a `docs/` file if behavior, setup, or routes changed.

## Coding Conventions

- Follow existing patterns in `app/`, `components/`, `lib/`, and `config/`.
- Business logic (content loading, formatting, filtering) belongs in `lib/`; components must not read the filesystem or parse Markdown directly — go through `lib/blog` and `lib/api.ts`.
- Reuse existing primitives in `components/ui/` instead of creating new base elements.
- Prefer explicit types over `any`.
- Keep components and functions small and focused; avoid duplication.
- Do not introduce unnecessary dependencies — this is a static portfolio site.
- Formatting is enforced by Prettier (`.prettierrc`) — do not hand-format around it.
- Minimize the scope of each change; do not refactor unrelated code in the same commit.

## Hard Constraints

- Never skip verification (lint + type check) before declaring work done.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Never change public routes or API contracts (`app/api/*`) without updating `README.md`.
- Preserve the existing architecture (config-driven content, Markdown-based blog, no database) unless the user explicitly requests a change to it.
- Update documentation when behavior, setup, or environment variables change.
- Ask before destructive operations (force-push, deleting content, resetting env files).
