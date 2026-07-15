"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CITATION_KIND_ICON } from "@/config/chat";
import { cn } from "@/lib/utils";
import { AgentCitation } from "@/types/chat";

interface ResourceCitationChipsProps {
  citations: AgentCitation[];
  className?: string;
}

/**
 * Renders every resource the assistant cited this turn as a chip. Hovering
 * previews title/type/description; clicking navigates to the resource's
 * page. Uses the existing Tooltip primitive (Radix HoverCard isn't an
 * installed dependency, despite the original plan assuming otherwise) — a
 * hover-triggered Tooltip gives the same preview UX without adding one.
 */
export const ResourceCitationChips = ({
  citations,
  className,
}: ResourceCitationChipsProps) => {
  const reducedMotion = useReducedMotion();

  if (citations.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {citations.map((citation, index) => {
          const Icon = Icons[CITATION_KIND_ICON[citation.type]];
          return (
            <Tooltip key={`${citation.type}:${citation.id}`}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.18,
                    delay: reducedMotion ? 0 : index * 0.04,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={citation.href}
                    className="inline-flex items-center gap-1 rounded-pill border border-chat-border bg-chat-bubble-ai px-2.5 py-1 text-xs text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="max-w-[10rem] truncate">{citation.title}</span>
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[16rem]">
                <p className="text-xs font-semibold capitalize text-foreground">
                  {citation.title}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    · {citation.type}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {citation.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
