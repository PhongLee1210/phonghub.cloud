"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode, useRef, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  id?: string;
  crossfade?: boolean;
}

export const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  id,
  crossfade,
}: AnimatedSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const crossfadeOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6, 0.85],
    [0, 1, 1, 0.6]
  );
  const crossfadeY = useTransform(scrollYProgress, [0, 0.25], [24, 0]);
  const crossfadeScale = useTransform(scrollYProgress, [0.6, 0.85], [1, 0.98]);

  const directionOffset = {
    up: { y: 16 },
    down: { y: -16 },
    left: { x: 16 },
    right: { x: -16 },
  };

  const initialOffset = directionOffset[direction];
  const useCrossfade = mounted && crossfade;

  if (useCrossfade) {
    return (
      <motion.div
        ref={ref}
        id={id}
        className={className}
        style={{
          opacity: crossfadeOpacity,
          y: crossfadeY,
          scale: crossfadeScale,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      viewport={{ once: true, margin: "-100px" }}
    >
      {children}
    </motion.div>
  );
};
