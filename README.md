# phonghub.cloud

## Overview

- **What**: The personal portfolio and blog website of Le Thanh Phong (Phong Lee), a software engineer. It presents professional experience, projects, skills, a résumé, and a Markdown-driven blog.
- **Why**: To showcase Phong's work and career history publicly and to publish long-form blog content, all served from a single statically-optimized Next.js site with no separate backend or database.
- **Primary users**: Recruiters and site visitors browsing the portfolio, and the site owner, who authors content via Markdown files and config data.

## Features

- Project showcase with detail pages (`/projects`, `/projects/[projectId]`)
- Experience timeline with detail pages (`/experience`, `/experience/[experienceId]`)
- Skills page with proficiency indicators (`/skills`)
- Résumé page (`/resume`)
- Contact page (`/contact`)
- Markdown-based blog with category, tag, and search support (`/blogs`, `/blogs/[slug]`, `/blogs/category/[category]`, `/blogs/tag/[tag]`)
- Dark/light theme switching (`next-themes`)
- Framer Motion animations
- SEO metadata, sitemap (`app/sitemap.ts`), and web manifest (`app/manifest.ts`)

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives, `class-variance-authority`, Framer Motion
- **Content**: Markdown blog posts (`content/blog`), parsed with `gray-matter` and `remark`
- **Forms/validation**: `react-hook-form`, `zod`
- **State**: `zustand` (client state, e.g. modals)
- **Runtime & package manager**: Bun (`bun.lock`)
- **Linting/formatting**: ESLint (`eslint-config-next`), Prettier
- **Deployment**: Vercel (see `vercel.json`)

There is no database — all content comes from Markdown files (`content/blog`) and static config modules (`config/*.ts`).

## Quick Start

### Prerequisites

- Node.js 22+
- Bun 1.0+ (recommended) — npm/yarn also work since dependencies are standard, but the repo is tracked with `bun.lock`

### Installation

```bash
git clone git@github.com:PhongLee1210/phonghub.cloud.git
cd phonghub.cloud
bun install
```

### Environment Variables

Copy the example file and fill in the values you need:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL used to call this app's own API routes (`/api/projects`, `/api/skills`, etc.) during build-time prerendering. Must be a reachable URL (e.g. your deployed URL) since no local server runs during `next build`. |
| `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` | Google Analytics measurement ID. |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Google Search Console site verification token. |
| `NEXT_PUBLIC_RESUME_LINK` | Link used by the résumé page/download action. |

### Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                  # Next.js App Router
├── (root)/           # Public pages: home, experience, projects, skills, resume, contact, blogs, list100
├── api/               # Route handlers: projects, experiences, skills, blog/search
├── sitemap.ts, manifest.ts, layout.tsx, globals.css
components/           # UI, grouped by feature (blog, contact, experience, projects, skills, list100, modals, common, ui)
config/               # Static site content and metadata (site, routes, pages, projects, experience, skills, socials, constants)
content/blog/         # Markdown blog posts
lib/                  # Business logic: lib/blog (Markdown parsing/service), api.ts, utils.ts
hooks/, providers/    # Shared React hooks and context providers
public/, assets/      # Static assets and fonts
docs/                 # Repository documentation (see below)
```

## Development

```bash
bun dev             # start dev server
bun run build       # production build
bun run start       # run production build locally
bun run lint        # ESLint
bunx tsc --noEmit   # type check
```

Business logic (content loading, formatting, filtering) lives in `lib/`; UI components should consume `lib/` and `config/` rather than reading Markdown or the filesystem directly. See `docs/GIT_WORKFLOW.md` for commit/branch conventions.

## Testing

No automated test suite is configured in this repository yet. Verify changes by running lint and type-checking, then manually checking the affected pages in the browser.

## Deployment

The project is configured for [Vercel](https://vercel.com) (`vercel.json`), using `bun install` / `bun run build` as the install/build commands and `.next` as the output directory. Set the environment variables listed above in your Vercel project settings before deploying.

## Documentation

- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — branch naming, commit message, and pull request rules
- [CLAUDE.md](CLAUDE.md) — guidance for AI coding agents working in this repository

## Contributing

This is a personal portfolio project. If you're contributing changes:

1. Create a branch following the naming convention in [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) (`feature/...`, `fix/...`, `refactor/...`, `docs/...`).
2. Run `bun run lint` and `bunx tsc --noEmit` before committing.
3. Keep pull requests small and explain *why* the change is needed.

## License

No license file is currently published in this repository. Contact the repository owner ([phonglee1210@gmail.com](mailto:phonglee1210@gmail.com)) regarding usage rights.
