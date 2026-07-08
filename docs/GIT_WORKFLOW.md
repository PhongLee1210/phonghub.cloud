# Git Workflow

Repository-level Git rules for phonghub.cloud.

## Branch Naming

| Prefix | Use for |
|---|---|
| `feature/...` | New functionality |
| `fix/...` | Bug fixes |
| `refactor/...` | Code changes with no behavior change |
| `docs/...` | Documentation-only changes |

Examples: `feature/chat-sse-reconnect`, `fix/auth-expired-token`.

## Commit Rules

- One logical change per commit.
- Subject line 72 characters or fewer.
- Use imperative mood ("add", not "added"/"adds").
- Do not combine unrelated changes in a single commit.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) where appropriate: `type(scope): subject`.

```text
feat(chat): add SSE reconnect
fix(auth): handle expired token
refactor(search): simplify ranking pipeline
docs(readme): update setup instructions
```

## Pre-Commit Checklist

Run before every commit:

```bash
bun run lint
bunx tsc --noEmit
```

`format` and `test` scripts are not configured yet in this repo (see [AGENTS.md](../AGENTS.md)). Add them here once available:

```bash
bun run format
bun run test
```

## Pull Request Rules

- Keep PRs small — prefer under 500 changed lines.
- Explain **why** the change is needed in the description, not just what changed.
- Update documentation (`README.md`, `docs/`) when behavior or architecture changes.

## Repository Layout for Git/GitHub Config

GitHub-specific configuration lives in `.github/`; workflow rules live here in `docs/`.

```text
.github/
├── pull_request_template.md
├── ISSUE_TEMPLATE/
├── CODEOWNERS
└── workflows/

docs/
└── GIT_WORKFLOW.md
```
