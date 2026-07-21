"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import Rating from "@/components/skills/rating";
import { ISkill } from "@/config/skills";
import { fadeUpStagger, scaleIn, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * SkillPreviewBody — preview-slot body for the Skills showcase composition.
 * Replaces `LivePreviewFrame`'s screenshot body with a skills-adapted panel:
 * a header line + a grid of skill chips (icon + name + rating).
 *
 * Slot contract:
 *   - Occupies the same grid cell as `LivePreviewFrame` in `BuilderShowcase`.
 *   - Top-level element is `motion.div` keyed to `scaleIn` so it inherits
 *     the orchestrator's entrance cascade (no local `initial`/`animate`).
 *   - Inner chip list uses its own `staggerContainer(0.04)` for a tight
 *     ripple as the panel reveals. Variant inheritance propagates through.
 *
 * Highlight semantics (wired in T5.6 from AI command responses):
 *   - `highlightedKeys` empty  → all chips render at full opacity (default).
 *   - `highlightedKeys` set    → matching chips get `ring-2 ring-ring`;
 *     others dimmed to `opacity-40` to draw focus.
 */
export interface SkillPreviewBodyProps {
  skills: ISkill[];
  /**
   * Skill keys to highlight. When non-empty, non-matching chips dim out.
   * Wired in T5.6 from AI "Modify & See Changes" / "Add Feature" responses.
   */
  highlightedKeys?: string[];
  /** Max number of skills to render. Defaults to 8. */
  limit?: number;
  className?: string;
}

function getSkillIcon(iconName: string) {
  const key = iconName as keyof typeof Icons;
  return Icons[key] ?? Icons.settings;
}

export function SkillPreviewBody({
  skills,
  highlightedKeys,
  limit = 8,
  className,
}: SkillPreviewBodyProps) {
  const top = skills.slice(0, limit);
  const highlightSet =
    highlightedKeys && highlightedKeys.length > 0
      ? new Set(highlightedKeys)
      : null;
  const activeCount = highlightSet
    ? top.filter((s) => highlightSet.has(s.key)).length
    : top.length;

  return (
    <motion.div
      variants={scaleIn}
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border/60 bg-card-2 p-5 shadow-[var(--shadow-2)]",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Top Skills
        </span>
        <span
          aria-live="polite"
          className="font-mono text-[11px] tabular-nums text-muted-foreground/70"
        >
          {activeCount} of {top.length}
        </span>
      </header>

      <motion.ul
        variants={staggerContainer(0.04)}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {top.map((skill) => {
          const Icon = getSkillIcon(skill.icon);
          const isHighlighted = highlightSet?.has(skill.key) ?? false;
          const dimmed = highlightSet !== null && !isHighlighted;
          return (
            <motion.li
              key={skill.key}
              data-agent-id={`skill:${skill.key}`}
              variants={fadeUpStagger}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/60 px-2.5 py-2 will-change-[transform,opacity]",
                isHighlighted &&
                  "ring-2 ring-ring ring-offset-2 ring-offset-card-2",
                dimmed && "opacity-40",
              )}
            >
              <Icon
                aria-hidden
                className="h-4 w-4 flex-shrink-0 text-primary"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-foreground">
                  {skill.name}
                </div>
                <Rating stars={skill.rating} />
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}

export default SkillPreviewBody;
