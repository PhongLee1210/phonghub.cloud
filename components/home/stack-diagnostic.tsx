"use client";

import { motion } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";

interface StackDiagnosticProps {
  skillCount: number;
}

export function StackDiagnostic({ skillCount }: StackDiagnosticProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="font-mono text-sm space-y-1"
    >
      <p className="text-muted-foreground/50">{`> scanning tech stack...`}</p>
      <p className="text-muted-foreground/50">{`> npm list --depth=0 | grep -E 'ai|react|node'`}</p>
      <p className="text-green-500/70">{`✓ ${skillCount} packages loaded`}</p>
    </motion.div>
  );
}
