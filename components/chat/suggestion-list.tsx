"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { cn } from "@/lib/utils";

interface SuggestionListProps {
  onSelect: (prompt: string) => void;
  className?: string;
  showLabel?: boolean;
}

export const SuggestionList = ({
  onSelect,
  className,
  showLabel = true,
}: SuggestionListProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("flex flex-col gap-[6px]", className)}>
      {showLabel && (
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          Suggested for you
        </span>
      )}
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
            className="group flex items-center gap-[8px] rounded-[12px] border border-chat-border bg-chat-bubble-ai p-[8px] text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-lavender-soft text-lavender-soft-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">
                {card.title}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {card.subtitle}
              </span>
            </span>
            <Icons.chevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
          </motion.button>
        );
      })}
    </div>
  );
};
