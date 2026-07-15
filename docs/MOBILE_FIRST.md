# Mobile-First Design Patterns

Reusable patterns for phonghub.cloud. Applies to every new component or feature touching mobile layout, gestures, or animation. Grounded in Apple's *Designing Fluid Interfaces* (WWDC 2018) principles.

---

## 1. Breakpoints

| Token | Value | Meaning |
|---|---|---|
| _(base)_ | `< 481px` | Mobile (phone portrait) |
| `min-[481px]:` | `≥ 481px` | Wide mobile / small tablet |
| `md:` | `≥ 768px` | Tablet landscape / desktop |
| `lg:` | `≥ 1024px` | Full desktop |

**Rule:** write base styles for mobile, override upward with `md:` / `lg:`.
Never add `sm:` overrides that assume desktop-first — it breaks the cascade.

---

## 2. Safe Area Insets

CSS variables are set globally in `globals.css`:

```css
--safe-top:    env(safe-area-inset-top,    0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left:   env(safe-area-inset-left,   0px);
--safe-right:  env(safe-area-inset-right,  0px);
```

Tailwind spacing aliases (`tailwind.config.ts`): `safe-top`, `safe-bottom`, `safe-left`, `safe-right`.

**Use in class strings:**

```tsx
// Clear nav (nav bottom ≈ safe-top + 72px)
pt-[calc(var(--safe-top,0px)+4.5rem)]

// Clear bottom tab bar (tab bar ≈ safe-bottom + 72px)
pb-[calc(var(--safe-bottom,0px)+4.5rem)]

// Floating element above tab bar
bottom-[calc(var(--safe-bottom,0px)+5rem)]
```

**Never hard-code pixel offsets for fixed chrome.** Always compose with `--safe-top` / `--safe-bottom`.

---

## 3. Fixed Chrome Z-Index Stack

| Layer | Z | Component |
|---|---|---|
| Nav | `z-[100]` | `MainNav` |
| Bottom tab bar | `z-[90]` | `BottomTabBar` |
| Chat launcher FAB | `z-[60]` | `ChatLauncher` |
| Chat panel | `z-[59]` | `ChatPanel` |
| Overlay / modal | `z-[80]` | dialogs |

New fixed components must fit explicitly in this stack. Never use arbitrary z values without placing them in the table.

---

## 4. Visibility: CSS over Server Logic

**Rule: never conditionally render mobile-specific elements server-side based on User-Agent.**
Next.js caching will serve the wrong variant to the wrong device.

```tsx
// WRONG — cache can serve mobile render to desktop
{isMobile && <BottomTabBar />}

// CORRECT — CSS handles it, always correct
<BottomTabBar />  // component has `md:hidden` inside
```

Use `md:hidden` / `md:flex` / `hidden md:block` in the component itself.
Server UA detection (`getDeviceHint`) is only valid for **animation hints** (spring variant, not DOM structure).

---

## 5. Touch Targets

Apple HIG minimum: **44 × 44 pt**.

```tsx
// Buttons, icon buttons, nav links
className="min-h-[44px] min-w-[44px]"

// Tab bar items — give extra tap padding
className="min-h-[48px] min-w-[48px] px-3 py-2"
```

Never rely on icon size alone. Wrap with a `<button>` that has the minimum size, add padding to meet 44px.

---

## 6. Spring Animation Defaults

Based on Apple's parameters from *Designing Fluid Interfaces*:

```ts
// Default UI spring — no overshoot, smooth settle
{ type: "spring", damping: 28, stiffness: 240 }

// Bottom sheet / drawer — slight bounce (momentum-driven)
{ type: "spring", damping: 32, stiffness: 320, mass: 0.8 }

// Card / repositioned element
{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }
```

**Rules:**
- Bounce only when a gesture carried momentum (drag release, flick). Never on a button tap.
- All gesture-driven animations must be interruptible — use springs, not `transition-duration`.
- `useReducedMotion()` from Framer Motion: if true, set `duration: 0` (instant), never skip the state change.

```ts
const reducedMotion = useReducedMotion();
const spring = reducedMotion
  ? { duration: 0 }
  : { type: "spring", damping: 28, stiffness: 240 };
```

---

## 7. Momentum Projection

Apple's exact formula (implemented in `lib/physics.ts`):

```ts
import { project } from "@/lib/physics";

// On drag end: project where the gesture is going, snap to nearest target
const projected = currentX + project(info.velocity.x);
const targetIndex = Math.round(-projected / ITEM_WIDTH);
animate(x, -(targetIndex * ITEM_WIDTH), {
  type: "spring",
  velocity: info.velocity.x,  // hand off velocity — no seam
  damping: 28,
  stiffness: 180,
});
```

Always pass `velocity: info.velocity.x/y` to the spring — this continues the gesture seamlessly.
Never snap from the release point alone; project momentum first.

---

## 8. Bottom Sheet Pattern

Used by `ChatPanel` on mobile. Apply to any mobile drawer/sheet:

```tsx
// Position: between nav and tab bar, full width
className="
  fixed inset-x-0
  top-[calc(var(--safe-top,0px)+4.5rem)]
  bottom-[calc(var(--safe-bottom,0px)+4.5rem)]
  z-[59]
  flex flex-col overflow-hidden
  bg-chat-bg
  // Reset for desktop card variant:
  min-[481px]:inset-x-auto min-[481px]:left-auto
  min-[481px]:top-auto min-[481px]:bottom-20 min-[481px]:right-6
  min-[481px]:h-[440px] min-[481px]:w-[300px] min-[481px]:rounded-2xl min-[481px]:border
"

// Animation
initial={{ y: "100%" }}
animate={{ y: 0 }}
exit={{ y: "100%" }}
transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.8 }}
```

Drag handle on mobile:
```tsx
{isMobile && (
  <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
    <div className="h-1 w-10 rounded-full bg-foreground/20" />
  </div>
)}
```

Lock body scroll only on mobile full-screen sheets:
```ts
useLockBody(isOpen && isMobile);
```

---

## 9. Infinite Carousel Pattern

Used by `PhotoCollage` mobile carousel. Triple-clone approach:

```ts
const loopedItems = [...items, ...items, ...items];
const LOOP_OFFSET = items.length * ITEM_WIDTH;
const x = useMotionValue(-LOOP_OFFSET); // start at center clone
const isDragging = useRef(false);

// Teleport during drag only (invisible — clones look identical)
useMotionValueEvent(x, "change", (latest) => {
  if (!isDragging.current) return;
  if (latest > -ITEM_WIDTH)                         x.set(latest - LOOP_OFFSET);
  else if (latest < -(LOOP_OFFSET * 2 - ITEM_WIDTH)) x.set(latest + LOOP_OFFSET);
});
```

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -(LOOP_OFFSET * 3), right: LOOP_OFFSET }}
  dragElastic={0}
  onDragStart={() => { isDragging.current = true; }}
  onDragEnd={handleDragEnd}
>
```

---

## 10. Floating Button Above Tab Bar

Any FAB or fixed CTA on mobile must clear the tab bar:

```tsx
className="
  fixed
  bottom-[calc(var(--safe-bottom,0px)+5rem)]  /* ≥ tab bar height */
  right-4
  z-[60]
  // Desktop reset:
  md:bottom-[max(1.5rem,calc(var(--safe-bottom,0px)+0.75rem))]
  md:right-6
"
```

---

## 11. Nav Overlap Clearance

Content that scrolls under the fixed nav needs top padding:

```tsx
// Page-level containers
className="px-4 pb-4 pt-[calc(var(--safe-top,0px)+4.5rem)]"

// Main element in layout (mobile only, reset on desktop)
className="flex-1 pb-[calc(var(--safe-bottom,0px)+4rem)] md:pb-0"
```

`4.5rem` (72px) = nav height approximation with safe buffer. Don't change without measuring the nav.

---

## 12. Translucent Chrome (Materials)

Nav, tab bar, and floating panels use Apple-style vibrancy:

```css
background: hsl(var(--background) / 0.8);
backdrop-filter: blur(20px) saturate(180%);
border-top: 1px solid hsl(var(--border) / 0.5);
```

In Tailwind: `bg-background/80 backdrop-blur-xl backdrop-saturate-[180%] border-t border-border/50`

Rules:
- Never stack two translucent surfaces — legibility collapses.
- Overlay modals use a solid scrim (non-translucent) behind the sheet.
- The translucent layer must have higher z than scrolling content.

---

## 13. Reduced Motion

Two places to handle:

**CSS (global):** Tailwind's `animate-bounce`, `animate-spin` etc. are already suppressed by:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
```

**Framer Motion (per-component):**
```ts
const reducedMotion = useReducedMotion();
const transition = reducedMotion ? { duration: 0 } : { type: "spring", ... };
```

Never use a JS conditional class like `reducedMotion ? "" : "animate-bounce"` — causes SSR hydration mismatch. Use CSS `@media` for CSS animations, Framer Motion's hook for JS-driven springs.

---

## 14. Device Detection: When to Use

`getDeviceHint()` reads UA server-side. Use **only** for:
- Choosing animation variant (bottom-sheet vs. card spring)
- Hints that don't affect DOM structure

**Never use for:**
- Conditional DOM rendering (use CSS breakpoints instead)
- Layout structure decisions (caching will break it)

```ts
// OK — animation variant only
const { isMobile } = await getDeviceHint();
// Pass isMobile to child as prop, child uses it only for spring config
```

---

## 15. Checklist: New Mobile Component

- [ ] Base styles are mobile, `md:` overrides for desktop
- [ ] All touch targets ≥ 44px
- [ ] Fixed elements clear nav (`+4.5rem`) and tab bar (`+4.5rem` / `+5rem` for FABs)
- [ ] Z-index placed explicitly in the stack table (§3)
- [ ] Visibility controlled by CSS (`md:hidden`), not server JS
- [ ] Gesture animations: spring + velocity handoff, not CSS transitions
- [ ] `useReducedMotion()` handled for all Framer Motion springs
- [ ] No JS-conditional Tailwind classes that differ between SSR and client
- [ ] Safe area insets via `var(--safe-top/bottom)`, never hard-coded px
