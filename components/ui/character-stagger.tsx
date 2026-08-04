"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface CharacterStaggerProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  staggerDelay?: number;
  yOffset?: number;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay: number) => ({
    opacity: 1,
    transition: { staggerChildren: staggerDelay },
  }),
};

const charVariants: Variants = {
  hidden: (yOffset: number) => ({ opacity: 0, y: yOffset, scale: 0.8 }),
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 18, mass: 0.8 },
  },
};

/** Reveals text character-by-character on scroll into view. */
export function CharacterStagger({
  text,
  as = "span",
  staggerDelay = 0.015,
  yOffset = 15,
  className,
}: CharacterStaggerProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as];

  if (prefersReducedMotion) {
    const Static = as;
    return <Static className={className}>{text}</Static>;
  }

  const characters = Array.from(text);

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      custom={staggerDelay}
      className={cn("inline-block", className)}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          custom={yOffset}
          variants={charVariants}
          className="inline-block whitespace-pre"
        >
          {char}
        </motion.span>
      ))}
    </Component>
  );
}
