"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SPRING_MAGNETIC } from "@/lib/motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  radius?: number;
  maxOffset?: number;
  className?: string;
}

export function MagneticButton({
  children,
  radius = 100,
  maxOffset = 7,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only activate after mount to avoid hydration mismatch from useReducedMotion
  const isActive = mounted && !reducedMotion;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_MAGNETIC);
  const y = useSpring(rawY, SPRING_MAGNETIC);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || !isActive) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX ** 2 + distY ** 2);
      if (dist > radius) return;
      const factor = (1 - dist / radius) * maxOffset;
      rawX.set((distX / dist) * factor);
      rawY.set((distY / dist) * factor);
    },
    [isActive, radius, maxOffset, rawX, rawY]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <motion.div
      ref={ref}
      style={isActive ? { x, y } : undefined}
      onMouseMove={isActive ? handleMouseMove : undefined}
      onMouseLeave={isActive ? handleMouseLeave : undefined}
      className={className}
      whileHover={isActive ? { scale: 1.05 } : undefined}
      whileTap={isActive ? { scale: 0.97 } : undefined}
      transition={isActive ? SPRING_MAGNETIC : undefined}
    >
      {children}
    </motion.div>
  );
}
