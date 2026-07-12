"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export const SuggestionChips = ({
  suggestions,
  onSelect,
  className,
}: SuggestionChipsProps) => {
  const reducedMotion = useReducedMotion();

  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {suggestions.map((prompt, index) => (
        <motion.button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.18,
            delay: reducedMotion ? 0 : index * 0.04,
            ease: "easeOut",
          }}
          className="rounded-pill border border-chat-border bg-chat-bubble-ai px-3 py-1.5 text-xs text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
};
