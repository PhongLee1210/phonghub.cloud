# CLAUDE.md

Protocols for Claude Code (claude.ai/code) and other AI coding agents contributing to this repository.

> **`AGENTS.md` is the hub** for commands, verification, architecture boundaries, repo structure, operational gotchas, and the doc index. This file covers only agent-session behavior and task isolation.

## Project

phonghub.cloud — a personal portfolio and blog (Next.js App Router, React, TypeScript). Config-driven, Markdown-based, no database. See `README.md` for onboarding, features, and stack.

## What NOT to Do

- **Never commit unless explicitly asked.** Stage changes only when requested.
- **Never force-push**, delete branches/content, or reset env files without confirmation.
- **Never run `ai session remove`** — it uses interactive prompts; leave cleanup to the user.
- **Never modify generated files**: `.next/`, `next-env.d.ts`.

## Task Isolation with `ai session` (Worktrees)

One task = one session = one branch. Each feature/fix with a small, self-contained scope gets its own worktree; never develop directly on `main`.

```bash
ai session new feature/<name>   # or fix/<name>, refactor/<name>, docs/<name>
cd worktrees/<name>
bun install                     # deps are NOT installed automatically
```

- All work and verification happens inside `worktrees/<name>`.
- `ai session list` / `resume <branch>` — inspect or reopen sessions.
- `worktrees/` is gitignored; skip sessions for trivial doc/typo changes.

## Watch Mode

When I say "watch mode", call `agentation_watch_annotations` in a loop.
For each annotation: acknowledge it, make the fix, then resolve it with a summary.
Continue watching until I say stop or timeout is reached.
