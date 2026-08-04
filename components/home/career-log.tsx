"use client";

import { motion } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";

interface CareerLogProps {
  experienceCount: number;
}

export function CareerLog({ experienceCount }: CareerLogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="font-mono text-sm space-y-1"
    >
      <p className="text-muted-foreground/50">{`> git log --author "Phong Lee" --oneline`}</p>
      <p className="text-success">{`✓ ${experienceCount} commits loaded`}</p>
    </motion.div>
  );
}
