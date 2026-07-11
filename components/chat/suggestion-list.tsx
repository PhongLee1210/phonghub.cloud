"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { cn } from "@/lib/utils";

interface SuggestionListProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export const SuggestionList = ({ onSelect, className }: SuggestionListProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn("flex flex-shrink-0 flex-col gap-1.5 px-4 pb-3", className)}
    >
      {chatConfig.seedSuggestionCards.map((card, index) => {
        const Icon = Icons[card.icon];
        return (
          <motion.button
            key={card.title}
            type="button"
            onClick={() => onSelect(card.prompt)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.22,
              delay: reducedMotion ? 0 : index * 0.04,
              ease: "easeOut",
            }}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-lavender-soft text-lavender-soft-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {card.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {card.subtitle}
              </span>
            </span>
            <Icons.chevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
          </motion.button>
        );
      })}
    </div>
  );
};
