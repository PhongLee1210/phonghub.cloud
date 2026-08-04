"use client";

import { type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

export interface MagneticButtonProps
  extends NativeButtonProps,
    VariantProps<typeof buttonVariants> {
  /** Distance (px) from center at which the magnetic pull engages. */
  range?: number;
  /** Fraction of cursor offset the button travels toward. */
  strength?: number;
}

/**
 * Drop-in replacement for `Button` that adds a magnetic cursor-follow effect.
 * Reuses `buttonVariants` so it stays visually identical to `Button`.
 */
export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className, variant, size, range = 60, strength = 0.35, ...props }, ref) => {
    const localRef = React.useRef<HTMLButtonElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const springConfig = { stiffness: 150, damping: 15, mass: 0.6 };
    const x = useSpring(0, springConfig);
    const y = useSpring(0, springConfig);

    React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

    const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion || !localRef.current) return;
      const { clientX, clientY } = event;
      const { left, top, width, height } = localRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);

      if (dist < range) {
        x.set((clientX - centerX) * strength);
        y.set((clientY - centerY) * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.button
        ref={localRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={prefersReducedMotion ? undefined : { x, y }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
MagneticButton.displayName = "MagneticButton";
