"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  /** Depth (px) content is lifted along the Z axis on hover. */
  liftDepth?: number;
}

/**
 * Behavior-only 3D tilt wrapper. Ships no background/border/shadow so it can
 * wrap existing primitives (e.g. `Card`) without fighting their styling.
 */
export const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ children, className, maxTilt = 12, liftDepth = 24, style, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      x.set((event.clientX - rect.left) / rect.width - 0.5);
      y.set((event.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} style={style} {...props}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn("relative", className)}
        style={{ perspective: "800px", ...style }}
        {...props}
      >
        <motion.div
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="h-full w-full"
        >
          <div
            style={{ transform: `translateZ(${liftDepth}px)`, transformStyle: "preserve-3d" }}
            className="h-full w-full"
          >
            {children}
          </div>
        </motion.div>
      </div>
    );
  }
);
TiltCard.displayName = "TiltCard";
