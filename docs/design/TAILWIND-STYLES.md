# Tailwind CSS Style Guide

Authoritative patterns for styling in this repo. Follow these so the design system stays consistent and theme-aware. Trust the code in `tailwind.config.ts` and `app/globals.css` as the source of truth.

## Core Principle: Tokens Before Utilities, Utilities Before Arbitrary Values

Every color, radius, shadow, and font must resolve through a registered token. The precedence ladder:

1. **Semantic token** (`bg-card`, `text-muted-foreground`, `border-chat-border`) — always preferred
2. **Tailwind scale utility** (`gap-4`, `h-8`, `rounded-lg`) — for spacing/sizing/radius
3. **Arbitrary value** (`gap-[18px]`, `text-[clamp(...)]`) — **last resort only**, permitted for layout math, fluid type, or truly one-off measurements (see "When Arbitrary Is OK" below)

Never bypass a token that already exists.

## Color Tokens

All colors are HSL-channel CSS variables in `app/globals.css`, mapped to Tailwind in `tailwind.config.ts`. Always use the Tailwind utility name, never the raw variable.

| Token group | Utilities | Use for |
|-------------|-----------|---------|
| `background` / `foreground` | `bg-background`, `text-foreground` | Page surface + base text |
| `card` / `card-foreground` | `bg-card`, `text-card-foreground` | Card surfaces (`<Card>`) |
| `primary` / `secondary` / `accent` | `bg-primary`, `text-accent` | Brand actions, emphasis |
| `muted` / `muted-foreground` | `bg-muted`, `text-muted-foreground` | De-emphasized text, subtle fills |
| `destructive` | `text-destructive`, `bg-destructive` | Errors, danger |
| `border` / `input` / `ring` | `border-border`, `ring-ring` | Borders, inputs, focus rings |
| `lavender` (+ `soft`) | `bg-lavender`, `text-lavender-foreground` | Accent brand color |
| **`chat.*`** | `bg-chat-bg`, `border-chat-border`, `bg-chat-header`, `bg-chat-input`, `bg-chat-bubble-ai`, `bg-chat-bubble-user`, `bg-chat-bubble-user-border`, `bg-chat-thinking`, `bg-chat-launcher`, `text-chat-placeholder` | All chat widget surfaces |
| **`success`** | `bg-success`, `text-success` | Online status, positive state |
| **`warning`** | `text-warning`, `bg-warning/10` | Stars, ratings, highlights |

### Rules
- **Never** write `bg-[hsl(var(--chat-bg))]`. Write `bg-chat-bg`.
- **Never** hardcode palette colors (`bg-emerald-500`, `text-amber-400`, `text-zinc-500`). Use the semantic token (`bg-success`, `text-warning`, `text-muted-foreground`).
- **Never** inline hex in className (`text-[#b7b9cb]`). Add a theme-aware CSS variable + token mapping if you need a new semantic color.
- Opacity modifiers on tokens are fine: `bg-warning/10`, `text-foreground/80`.

## Radius Scale

Named radii — use these, not arbitrary `[Npx]`:

| Utility | Value | Use |
|--------|-------|-----|
| `rounded-sm` / `rounded-md` | `radius - 4px` / `- 2px` | Small controls, pills |
| `rounded-lg` | `--radius` (0.5rem) | Cards, default surface |
| `rounded-xl` / `rounded-2xl` | 36px / 22px | Large panels |
| `rounded-pill` | 999px | Avatars, FABs |
| `rounded-chat` | 16px | Chat bubbles, suggestion items |
| `rounded-chat-lg` | 22px | Chat panels, input shells |

## Spacing & Sizing

Prefer the Tailwind scale (`gap-2`, `p-4`, `h-8`). The scale is sufficient for nearly all needs.

- Icon-button sizes: use `h-7 w-7`, `h-8 w-8`, `h-14 w-14` — **not** `h-[28px]`, `h-[30px]`, `h-[32px]`.
- Gaps: `gap-1.5` / `gap-2` / `gap-3` / `gap-4`. Avoid `gap-[8px]`, `gap-[12px]`, `gap-[18px]`.

### When Arbitrary Values Are OK
- **Fluid typography**: `text-[clamp(4rem,7vw,5.25rem)]`
- **Viewport-relative layout**: `h-[100dvh]`, `min-h-[440px]`
- **Computed heights**: `h-[calc(100dvh-120px)]`
- **Pixel-positioned collage** (in `config/home.ts`): `left-[215px] top-[170px]`
- **Dynamic animations**: `hover:scale-[1.05]`

These are justified because the scale cannot express them. Document *why* in a comment if non-obvious.

## Component Utilities (`@layer components`)

Defined in `app/globals.css`. Prefer these over inline styles.

- `.text-gradient-animated` — animated multi-color gradient text (used by the `list100` nav link). Never hand-roll the `backgroundImage` / `WebkitBackgroundClip` / `animation` block inline.

## Primitives Over Raw Elements

| Need | Use | Don't use |
|------|-----|-----------|
| Card surface | `<Card>` (`components/ui/card.tsx`) | `<div className="rounded-lg border bg-card ...">` |
| Pill / tag | `<Badge>` (`components/ui/badge.tsx`) | `<span className="inline-flex ... bg-muted">` |
| Action button | `<Button>` (`components/ui/button.tsx`) | `<button className="...">` (unless building the Button itself) |
| Image | `<ResponsiveImage>` | raw `<Image>` + shimmer classes |

## Focus Rings (Accessibility)

Every interactive element must have the canonical ring:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

Use `focus-visible:` (not `focus:`) so mouse clicks don't show a ring but keyboard nav does. The `Button`, `Input`, `SocialButton`, and chat icon buttons already apply this — match their pattern.

## Themes

Seven themes exist: `:root` (light), `.dark`, `.retro`, `.cyberpunk`, `.aurora`, `.synthwave`, `.paper`. Each overrides the CSS variables above. **To keep themes working:**
- Every color must go through a token (hardcoded hex breaks theme switching).
- `bg-card` and `bg-background` diverge in some themes — use `bg-card` for card surfaces, `bg-background` for page-level fills.

## Dead Code Policy

Do not leave unused CSS classes in `app/globals.css`. If a class has zero references in `components/` or `app/`, delete it. The legacy `.card`/`.content`/`.title`/`.copy`/`.btn` block was removed for this reason.
