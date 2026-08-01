# phonghub.cloud

## Overview

- **What**: Personal portfolio and blog of Le Thanh Phong (Phong Lee), a software engineer. This Next.js site showcases professional experience, projects, skills, résumé, and includes a Markdown-driven blog.
- **Why**: To present Phong's work publicly and publish long-form content, all via a statically-optimized site with no server-side database.
- **Primary users**: Recruiters and visitors browsing the portfolio, plus the site owner managing content via Markdown and config files.

## Features

- Project showcase (with detail pages): `/projects`, `/projects/[projectId]`
- Experience timeline & details: `/experience`, `/experience/[experienceId]`
- Skills page with proficiency indicators: `/skills`
- Résumé download/view: `/resume`
- Contact page: `/contact`
- Markdown blog with categories, tags & search: `/blogs`, `/blogs/[slug]`, `/blogs/category/[category]`, `/blogs/tag/[tag]`
- **AI chat widget:** (floating launcher, all pages) — answers questions about Phong’s portfolio, projects, skills, experience; uses a provider-agnostic LLM gateway backend (see [Chat integration section below](#local-ai-integration-for-better-dev-experience))
- “Star on GitHub” action: star the repo directly from the chat widget
- Theme switching (dark/light): via `next-themes`
- Framer Motion animations
- SEO metadata, sitemap & manifest

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI, `class-variance-authority`, Framer Motion
- **Content**: Markdown posts (`content/blog`), using `gray-matter` & `remark`
- **Forms/validation**: `react-hook-form`, `zod`
- **State**: `zustand`
- **LLM gateway**: Internal abstraction over Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/groq`), rate-limited via Upstash Redis.
- **Runtime/PM:** Bun (`bun.lock`)
- **Lint/format:** ESLint + Prettier
- **Deploy:** Vercel

No database — content is Markdown files and static config only.

---

## Quick Start

### Prerequisites

- Node.js 22+
- Bun 1.0+ (preferred; npm/yarn also work)

### Installation

```bash
git clone git@github.com:PhongLee1210/phonghub.cloud.git
cd phonghub.cloud
bun install
```

### Environment Variables

Copy `.env.example` and configure values as needed:

```bash
cp .env.example .env.local
```

| Variable                                              | Purpose                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`                   | Google Analytics measurement ID.                                   |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION`                     | Google Search Console verification.                                |
| `NEXT_PUBLIC_RESUME_LINK`                             | Link used for résumé page and download.                            |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / etc.         | LLM provider keys — set those used (see `lib/llm/README.md`).      |
| `LLM_CHAT_MODEL`, `LLM_CHEAP_MODEL`                   | Optionally override default/generic LLM models by alias.           |
| `LLM_CHAT_FALLBACKS`                                  | Optional comma-separated fallback chain for LLM provider failover. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | For chat/GitHub star rate limiting with Upstash.                   |
| `GITHUB_TOKEN`                                        | PAT for `/api/github/star` from server-side. Never sent to client. |

See `.env.example` for details.

---

## Running Locally

### 1. Launch the dev server

```bash
bun dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

### 2. (Recommended) Local AI Integration for Better Dev Experience

For the best developer experience, especially when using the built-in AI chat widget, run local agentation and Serena MCP servers:

#### a. Start Agentation MCP Server

```bash
npx agentation-mcp server --port 9122
```

#### b. Start Serena MCP Server

This bridges to local language models or MCP providers for fast, cost-free prototyping:

```bash
serena start-mcp-server --transport streamable-http --port 9121
```

> **Note:**
>
> - You may need to install [`agentation-mcp`](https://www.npmjs.com/package/agentation-mcp) and [`serena`](https://github.com/serena-ai/serena) globally or run with `npx`.
> - These steps are optional but greatly improve your ability to test the AI chat and LLM features locally and with real streaming responses.

## Project Structure

```
app/                  # Next.js App Router
├── (root)/           # Public pages: home, experience, projects, skills, resume, contact, blogs, list100
├── api/              # Route handlers: projects/experiences/skills/blog/search/chat/github/star
├── sitemap.ts, manifest.ts, layout.tsx, globals.css
components/           # UI grouped by major feature
config/               # Static site meta/config, social/profiles, projects/skills, chat config, etc
content/blog/         # Markdown blog posts (autodiscovered)
lib/                  # Business logic/services: blog parsing, LLM gateway, chat, GitHub, etc
hooks/, providers/    # Shared React hooks and contexts
types/                # Shared TS types
public/, assets/      # Static files
docs/                 # Design docs and repo notes
```

## Development

```bash
bun dev             # dev server
bun run build       # production build
bun run start       # run production build locally
bun run lint        # lint
bunx tsc --noEmit   # type-check
bun run test        # Bun unit tests
```

Business logic lives in `lib/`. UI components should _never_ read Markdown/config or the filesystem directly; use services in `lib/` or `config/`. See `docs/GIT_WORKFLOW.md` for commit/branch conventions.

## Testing

Unit test coverage of chat/LLM logic via Bun (see `lib/llm/*.test.ts`, `lib/chat/*.test.ts`). No e2e tests: verify UI changes in-browser, and always run static checks.

## Deployment

Ready for Vercel using Bun (`bun install`, `bun run build`, output: `.next`). Set environment variables as above in your Vercel project.

## Documentation

- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — branch, commit, PR conventions
- [CLAUDE.md](CLAUDE.md) — for AI code agents
- [docs/chat-widget-implementation-plan.html](docs/chat-widget-implementation-plan.html) — design & plan for LLM chat gateway
- [implementation-notes.md](implementation-notes.md) — chat build notes
- [lib/llm/README.md](lib/llm/README.md) — LLM gateway usage, internal docs, env keys

## Contributing

This is a personal project. If you wish to contribute:

1. Use branches with [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) conventions (`feature/...`, `fix/...`, etc).
2. Run `bun run lint` & `bunx tsc --noEmit` before committing.
3. Keep PRs tightly scoped, and explain _why_ your change is needed.

## License

No license file is published in this repo. Contact [phonglee1210@gmail.com](mailto:phonglee1210@gmail.com) for any usage requests.
