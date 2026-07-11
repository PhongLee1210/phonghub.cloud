# CLAUDE.md

This document details coding standards and protocols for Claude Code (claude.ai/code) and other AI coding agents contributing to this repository.

## Project Overview

phonghub.cloud is a personal portfolio and blog project utilizing Next.js (App Router), React, and TypeScript. All data (e.g., projects, experience, skills) is managed in `config/*.ts` and exposed via `app/api/*` routes; blog posts are Markdown files in `content/blog/`, processed by `lib/blog/`. Styling leverages Tailwind CSS and Radix UI. See `README.md#project-structure` for architecture notes.

## Documentation and Onboarding

Always review:

- [README.md](README.md): Project structure, stack, and onboarding
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md): Branch, commit, and PR workflow

## Verification & Testing

- Use Bun scripts for all local automation (not `make`).
- **Example RTK usage for logs/testing:**
  - Print logs for a session:
    ```bash
    rtk log --tail 50
    ```
  - Run and track tests:
    ```bash
    rtk run -- bun run test
    ```
- Before considering any change complete, always execute:
  ```bash
  bun run lint        # Lint (eslint-config-next)
  bunx tsc --noEmit   # Type check (TypeScript)
  bun run test        # bun:test — covers lib/llm/* and lib/chat/*
  ```
- Note: `bun run test` requires `--conditions react-server`.
- No global integration/e2e suite yet. For UI or API route changes, manual browser verification is required alongside code checks.

### Validation Hierarchy

When developing features, always ensure:

- **Level 1: Unit tests** — Must pass
- **Level 2: Integration tests** — Must pass (if applicable)
- **Level 3: End-to-end tests** — Must pass for multi-component changes
- Skipping levels = **Not Complete**

## Development Workflow

1. Review `README.md` and relevant code in `app/`, `components/`, `lib/`, or `config/`.
2. Design the smallest possible change.
3. Implement, following conventions and using RTK where appropriate.
4. Run full verification (lint, typecheck, and tests) and resolve all issues.
5. Update `README.md` or add to `docs/` if behavior/setup/routes change.

## Coding Conventions

- Follow conventions present in `app/`, `components/`, `lib/`, and `config/`.
- Business logic (content loading/transformation/filtering) belongs in `lib/`. **UI components must not directly access filesystem/Markdown — always use `lib/blog` and `lib/api.ts`.**
- Reuse UI primitives from `components/ui/`.
- Favor explicit types; do not use `any`.
- Keep all functions and components focused and minimal; avoid duplication.
- Do not add unnecessary dependencies — this is a static site.
- Formatting is managed by Prettier (`.prettierrc`).
- Keep changes focused; do not combine unrelated refactoring.

### Constants and Enum Definition Standards

- **Always define constants and status/priority enums using clear, context-neutral, and descriptive naming.**
- Use UPPER_SNAKE_CASE for constants (e.g., `DEFAULT_TIMEOUT_MS`).
- Status and priority enums must be named to reflect their semantic meaning in a universal and unbiased way (e.g., `TaskStatus`, not `GoodBadStatus`; `PriorityLevel`, not `HighLowEnum`).
- When implementing such constants or enums, prefer values that make code intention obvious (e.g., `PENDING`, `IN_PROGRESS`, `COMPLETED`; or `LOW`, `MEDIUM`, `HIGH`).
- Avoid domain-irrelevant, culturally-biased, or ambiguous terms.
- Maintain documentation or inline comments for all non-trivial constants/enums to clarify purpose, valid values, and expected usage.

**Example:**

```ts
// Correct:
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
export const DEFAULT_TASK_PAGE_SIZE = 10;

// Avoid (biased/unclear naming):
// enum GoodBadStatus { GOOD, BAD }
```

## Logging and Error Handling (Server Side)

- When reporting errors on the server, use the following pattern:
  - What failed (with location: file & line)
  - Why it failed (technical reason)
  - How to fix (clear remediation)
  - Example:
    ```
    ERROR: Found direct import of 'fs' in src/renderer/App.tsx:12
    WHY: Renderer process cannot access Node.js APIs for security reasons
    FIX: Move file operations to src/preload/file-ops.ts and call via window.api.readFile()
    ```

## Hard Constraints

- Never skip verification (lint, typecheck, test) prior to marking work as done.
- Never modify generated/codegen files (`.next/`, `next-env.d.ts`).
- Never change public routes or API contracts (`app/api/*`) without updating `README.md`.
- Maintain config-driven/Markdown-based, no-database architecture unless requested otherwise.
- Always document behavioral, setup, or environment changes.
- Confirm before destructive actions (force-push, branch/content deletion, env resets).
