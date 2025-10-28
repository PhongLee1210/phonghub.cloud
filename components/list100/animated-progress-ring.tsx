"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface AnimatedProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  completed: number;
  total: number;
  reducedMotion?: boolean;
}

export function AnimatedProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  completed,
  total,
  reducedMotion = false,
}: AnimatedProgressRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="text-primary"
          initial={reducedMotion ? { strokeDashoffset: offset, opacity: 1 } : { strokeDashoffset: circumference, opacity: 0 }}
          animate={isInView ? { strokeDashoffset: offset, opacity: 1 } : { strokeDashoffset: circumference, opacity: 0 }}
          transition={
            reducedMotion
              ? {}
              : {
                  strokeDashoffset: {
                    duration: 2,
                    delay: 0.3,
                  },
                  opacity: { duration: 0.5 },
                }
          }
        />
      </svg>

      {/* Center content */}
      <div className="absolute text-center">
        <motion.div
          className="text-2xl font-bold text-primary"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={reducedMotion ? {} : { delay: 0.5, duration: 0.5 }}
        >
          {percentage.toFixed(0)}%
        </motion.div>
        <motion.div
          className="text-xs text-muted-foreground mt-1"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={reducedMotion ? {} : { delay: 0.6, duration: 0.5 }}
        >
          {completed} / {total}
        </motion.div>
      </div>
    </div>
  );
}
