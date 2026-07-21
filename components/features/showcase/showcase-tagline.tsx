"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { SHOWCASE_TAGLINE } from "@/config/showcase";
import { fadeUpStagger, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * ShowcaseTagline — the hero text above the showcase composition
 * (Figma node `20:5`: "Let's build something amazing").
 *
 * Uses `text-foreground` for a solid, always-readable heading that
 * adapts to every theme. The previous `.text-gradient-animated` used
 * `-webkit-text-fill-color: transparent` with a gradient through
 * `--accent` — which is near-white in light themes, making the text
 * invisible against the background.
 *
 * T2.2 wraps each word in a `motion.span` keyed to `fadeUpStagger` so the
 * parent `BuilderShowcase` cascade (`staggerContainer`) propagates a
 * per-word reveal. Local variants only — `initial`/`animate` come from
 * the orchestrator so the tagline composes with sibling entrances.
 */
export interface ShowcaseTaglineProps {
  /** Override the default `SHOWCASE_TAGLINE` from config. */
  tagline?: string;
  className?: string;
}

export function ShowcaseTagline({
  tagline = SHOWCASE_TAGLINE,
  className,
}: ShowcaseTaglineProps) {
  const words = React.useMemo(() => tagline.split(" "), [tagline]);

  return (
    <motion.h2
      variants={staggerContainer(0.06)}
      className={cn(
        "font-heading font-bold tracking-tight text-foreground",
        "text-[clamp(2rem,5vw,3.5rem)]",
        "leading-[1.1]",
        className,
      )}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={fadeUpStagger}
          className="inline-block will-change-[transform,opacity]"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.h2>
  );
}

export default ShowcaseTagline;
