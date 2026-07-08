# CLAUDE.md

This document provides guidelines for Claude Code (claude.ai/code) and other AI coding agents working in this repository.

## Project Overview

phonghub.cloud is a personal portfolio and blog site built with Next.js (App Router), React, and TypeScript. All content is data-driven, not database-backed: projects, experience, and skills are in `config/*.ts` and exposed via `app/api/*` routes; blog posts are Markdown files in `content/blog/`, parsed through `lib/blog/`. Styling uses Tailwind CSS and Radix UI primitives. Refer to the architecture summary in `README.md#project-structure`; there is no `docs/ARCHITECTURE.md`.

## Documentation

Before making changes, review:

- [README.md](README.md): Project overview, tech stack, structure
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md): Branch naming, commit message, and PR protocols

## Verification & Testing

- This repo uses Bun scripts, not `make`.
- **Example usage of `rtk` for logs or test runs:**
  - To view logs for a test session:
    ```bash
    rtk log --tail 50
    ```
  - To run tests and aggregate output (assumes tasks managed via Bun):
    ```bash
    rtk run -- bun run test
    ```

- Before calling a change complete, always run:

```bash
bun run lint        # ESLint (eslint-config-next)
bunx tsc --noEmit   # type check
bun run test        # bun:test — covers lib/llm/* and lib/chat/*
```

- `bun run test` requires `--conditions react-server` (see scripts).
- There is no universal component/integration/e2e test suite yet. For UI or route-handler changes, verify in the browser in addition to lint, type-check, and unit tests.

### Validation Hierarchy for Feature Development

When developing features from the feature list, always validate by this hierarchy:

- **Level 1: Unit tests** (Must pass)
- **Level 2: Integration tests** (Must pass)
- **Level 3: End-to-end tests** (Must pass when cross-component changes are involved)
- _Skipping any required level = Not Complete_

## Development Workflow

1. Read `README.md` and existing code in `app/`, `components/`, `lib/`, or `config/` relevant to your change.
2. Plan the smallest possible change.
3. Implement, following directory/feature conventions and leveraging RTK for state/log aggregation where applicable.
4. Run full verification (lint + typecheck + RTK-backed tests) and resolve any failures.
5. Update `README.md` or add a `docs/` note if any behavior, setup, or routes changed.

## Coding Conventions

- Match patterns found in `app/`, `components/`, `lib/`, and `config/`.
- Put business logic (content loading, formatting, filtering) in `lib/` — components must not access the filesystem or parse Markdown directly (use `lib/blog` and `lib/api.ts`).
- Reuse UI primitives from `components/ui/`.
- Prefer explicit types, avoid `any`.
- Keep components/functions small and focused; avoid duplication.
- Don’t introduce unnecessary dependencies — this is a static portfolio.
- Let Prettier handle formatting (`.prettierrc`).
- Minimize scope of changes — don’t bundle unrelated refactors.

## Logging and Error Handling (Server Side)

- **When logging on the server side to trace errors, always follow this failure message pattern:**
  - What failed (Where: file & line)
  - Why it failed (technical reason)
  - How to fix it (one-line remediation)
  - Example:

    ```
    ERROR: Found direct import of 'fs' in src/renderer/App.tsx:12
    WHY: Renderer process has no access to Node.js APIs for security
    FIX: Move file operations to src/preload/file-ops.ts and call via window.api.readFile()
    ```

## Hard Constraints

- Never skip verification (lint + typecheck + RTK-based tests) before marking work as done.
- Never modify generated files (`.next/`, `next-env.d.ts`).
- Never change public routes or API contracts (`app/api/*`) without updating `README.md`.
- Preserve the config-driven, Markdown-based, no-database architecture unless requested otherwise.
- Update documentation for any behavioral, setup, or environment changes.
- Ask before destructive actions (force-push, deleting content/branches, resetting env files).
