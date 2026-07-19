import * as React from "react";

import { SHOWCASE_TAGLINE } from "@/config/showcase";
import { cn } from "@/lib/utils";

/**
 * ShowcaseTagline — the hero text above the showcase composition
 * (Figma node `20:5`: "Let's build something amazing").
 *
 * Uses the existing `.text-gradient-animated` component class
 * (`@layer components` in `app/globals.css`) so the gradient resolves
 * through theme tokens and the keyframe respects `prefers-reduced-motion`.
 *
 * Server component — T2.2 wraps the words in a `motion.h2` for the
 * per-word stagger entrance.
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
  return (
    <h2
      className={cn(
        "font-heading font-bold tracking-tight",
        "text-gradient-animated",
        "text-[clamp(2rem,5vw,3.5rem)]",
        "leading-[1.1]",
        className,
      )}
    >
      {tagline}
    </h2>
  );
}

export default ShowcaseTagline;
