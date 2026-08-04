"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS color for the glow. Defaults to the theme's primary token. */
  glowColor?: string;
  glowSize?: number;
}

/**
 * Cursor-follow radial glow overlay. Renders no background/border of its own
 * so it can be layered inside existing surfaces (e.g. `Card`) without
 * changing their appearance.
 */
export const Spotlight = React.forwardRef<HTMLDivElement, SpotlightProps>(
  (
    { children, className, glowColor = "hsl(var(--primary) / 0.12)", glowSize = 250, ...props },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const [coords, setCoords] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => !prefersReducedMotion && setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              opacity,
              background: `radial-gradient(${glowSize}px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
Spotlight.displayName = "Spotlight";
