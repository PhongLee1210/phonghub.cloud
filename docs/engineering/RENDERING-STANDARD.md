# Rendering Standard: The Donut Pattern (Cache Components)

Reference: [Next.js 16 Cache Components / donut pattern](https://www.buildmvpfast.com/blog/nextjs-16-caching-cache-components-donut-pattern-2026), [Next.js `cacheComponents` docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents).

## Problem

Two related failure modes show up on this site today:

1. **SSR/client mismatch** — a value computed on the server (from headers, cookies, or non-deterministic logic) is rendered into HTML, then recomputed differently on the client during hydration. React throws a hydration mismatch, or silently reconciles and repaints, causing flicker.
2. **Browser extension DOM interference** — extensions (password managers, Grammarly, dark-mode injectors, ad blockers) mutate the DOM *before* React hydrates. If the whole page hydrates as one tree, that mutation can trigger a mismatch warning anywhere, and today's fix has been to blanket-suppress it with `suppressHydrationWarning` on `<html>`/`<body>` in `app/layout.tsx` — which also hides *real* mismatches.

Both problems share a root cause: **too much of the page is one hydration unit.** The donut pattern fixes this by structurally separating what's static from what's dynamic, instead of suppressing the symptom.

## Concrete example already in this repo

`app/layout.tsx` calls `getDeviceHint()` (`lib/device.ts`), which UA-sniffs the `headers()` on the server, and threads the result (`isMobile`) as a prop into `GlobalChatWidgetLoader` → `ChatWidget`. This is exactly the shape the donut pattern targets: a request-derived, non-deterministic value computed on the server and mixed into the same hydration pass as static content. Server UA sniffing can disagree with the client's actual viewport (resize, devtools, extensions changing `navigator.userAgent`), and it forces that slice of the tree to be dynamic-per-request even though most of the page around it is static.

## The pattern

- **Dough (static shell)** — layout chrome, nav, hero copy, SEO/schema `<Script>` tags, and anything derived only from `config/*.ts` or `content/blog/*`. This is prerendered once, cached, and served instantly. It never depends on `headers()`, `cookies()`, `Date.now()`, `Math.random()`, or client-only APIs.
- **Hole (dynamic island)** — anything that legitimately depends on the request or the client: viewport/UA detection, the chat widget, R3F/three.js canvases, scroll-driven animation state, third-party/analytics scripts. Each hole is wrapped in its own `<Suspense>` boundary (or `next/dynamic` with `ssr: false`) so it streams and hydrates independently, and a hydration mismatch inside one hole can't cascade to the rest of the page.

## Rules

1. Enable `cacheComponents: true` in `next.config.ts` (Node runtime only — no `edge` route segments). This turns on Partial Prerendering: Next prerenders the static shell and streams holes in around it.
2. Data derived purely from `config/*.ts` or `content/blog/*` (e.g. `listPublishedPosts`, `EXPERIENCES`) should be wrapped with the `"use cache"` directive and tagged with `cacheTag`/`cacheLife`, not refetched per request.
3. Anything reading `headers()`/`cookies()`, or otherwise non-deterministic, must not be threaded as a prop into components that also render statically. Either:
   - move the decision to the client (e.g. `matchMedia` / `useEffect` instead of server UA sniffing for `isMobile`), or
   - isolate it behind its own `<Suspense>` boundary so only that island is dynamic.
4. Client-only/interactive islands (`ChatWidget`, `components/three/*`, `DevTools`/Agentation, third-party scripts) each get their own `next/dynamic(..., { ssr: false })` or `<Suspense>` leaf — this repo already does this correctly for `ChatWidget` via `GlobalChatWidgetLoader`; use it as the template for new islands.
5. `suppressHydrationWarning` is scoped to the specific leaf that legitimately diverges (e.g. a theme-dependent class), never applied blanket to `<html>`/`<body>`. If the root layout needs it today, that's a signal something dynamic is leaking into the static shell — fix the leak, don't widen the suppression.
6. `Suspense` `fallback` must match the static shell's layout dimensions (skeleton, not spinner-that-shifts-layout) to avoid CLS during the swap.
7. When adding a new page or component, state which tier it belongs to — static shell, cached, or dynamic hole — in the PR description if it's not obvious from the code.

## Migration checklist for this repo

- `app/layout.tsx`: stop passing server-computed `isMobile` into the client tree; detect on the client, or wrap `GlobalChatWidgetLoader` in its own `Suspense` boundary.
- `app/(root)/page.tsx`: `CareerTimeline` and `AnimatedBlogGrid` are already `next/dynamic`-imported; give them explicit `Suspense` boundaries with skeleton fallbacks instead of relying on `next/dynamic`'s implicit loading behavior.
- `components/three/*`: confirm all R3F/canvas usage is `ssr: false` and boundary-isolated.
- Root layout: remove blanket `suppressHydrationWarning` once the above leaks are fixed; re-add narrowly if a specific, understood divergence remains (e.g. theme class from `next-themes`).

Treat this as an incremental migration, not a rewrite — apply it whenever you touch a page/component, don't do a big-bang pass.
