"use client";

import { motion } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";

interface BlogDispatchProps {
  postCount: number;
}

export function BlogDispatch({ postCount }: BlogDispatchProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="font-mono text-sm space-y-1"
    >
      <p className="text-muted-foreground/50">{`> cat content/blog/*.md | grep "^title" | head -${postCount}`}</p>
      <p className="text-green-500/70">{`✓ ${postCount} posts indexed`}</p>
    </motion.div>
  );
}
