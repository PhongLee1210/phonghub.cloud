import type { Transition, Variants } from "framer-motion";

export const SPRING_GENTLE: Transition = {
  type: "spring",
  damping: 28,
  stiffness: 200,
  mass: 0.8,
};

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  damping: 20,
  stiffness: 300,
};

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_EXPRESS = [0.19, 1, 0.22, 1] as const;

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const fadeUpTransition: Transition = {
  duration: 0.6,
  ease: EASE_OUT,
};

export const scaleReveal: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

/**
 * Showcase composition variants.
 *
 * `SPRING_SHOWCASE` — default UI spring for the showcase composition
 *   (panels, chips, hover). Smooth settle, no overshoot.
 * `SPRING_SHEET` — bottom-sheet / drawer momentum (slight bounce).
 * `EASE_REVEAL` — cubic-bezier for typewriter + terminal line reveals.
 *
 * See `docs/MOBILE_FIRST.md` §6 (Spring Animation Defaults).
 */
export const SPRING_SHOWCASE: Transition = {
  type: "spring",
  damping: 28,
  stiffness: 240,
};

export const SPRING_SHEET: Transition = {
  type: "spring",
  damping: 32,
  stiffness: 320,
  mass: 0.8,
};

export const EASE_REVEAL = [0.22, 1, 0.36, 1] as const;

/**
 * Build a stagger container variant.
 *
 * Use with `framer-motion`'s `variants` + `initial="hidden" animate="visible"`
 * on a parent; children opt in via their own variants with `hidden`/`visible`
 * keys.
 */
export const staggerContainer = (stagger = 0.05, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

/**
 * Scale-in variant — distinct from `scaleReveal` so the existing contract
 * (initial/animate keys) stays untouched. Uses `hidden`/`visible` to compose
 * with `staggerContainer`.
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING_SHOWCASE,
  },
};

/**
 * Fade-up variant keyed to `hidden`/`visible` for stagger composition.
 * (Existing `fadeUp` keeps its `initial`/`animate` keys untouched.)
 */
export const fadeUpStagger: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SHOWCASE,
  },
};
