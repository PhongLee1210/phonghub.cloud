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
