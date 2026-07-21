"use client";

import * as React from "react";
import { motion, MotionConfig } from "framer-motion";

import { fadeUpStagger, scaleIn, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { ShowcaseTagline } from "./showcase-tagline";

/**
 * BuilderShowcase — orchestrates the Figma node `20:5` composition:
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │             Let's build something amazing        │  ← tagline
 *   │                                                  │
 *   │   ┌──────────────────┐   ┌──────────────────┐    │
 *   │   │   Code editor    │   │   Live preview   │    │  ← grid (1 col mobile, 2 col lg)
 *   │   └──────────────────┘   └──────────────────┘    │
 *   │   ┌──────────────────────────────────────────┐   │
 *   │   │   Terminal strip                         │   │  ← terminal
 *   │   └──────────────────────────────────────────┘   │
 *   └─────────────────────────────────────────────────┘
 *
 * `editor` / `preview` / `terminal` are passed in as ReactNodes so each
 * home-page section (Skills/Projects) can swap its own bodies (e.g.
 * `<SkillPreviewBody>` instead of `<LivePreviewFrame>`).
 *
 * Wraps everything in `<div className="showcase">` so the navy theme
 * tokens (defined in `app/globals.css`) are locally scoped — does NOT
 * touch the global theme.
 */
export interface BuilderShowcaseProps {
  tagline?: string;
  editor: React.ReactNode;
  preview: React.ReactNode;
  terminal: React.ReactNode;
  className?: string;
}

export function BuilderShowcase({
  tagline,
  editor,
  preview,
  terminal,
  className,
}: BuilderShowcaseProps) {
  return (
    <div className={cn("showcase w-full bg-background text-foreground", className)}>
      <MotionConfig reducedMotion="user">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
          className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-20"
        >
          <motion.div variants={fadeUpStagger}>
            <ShowcaseTagline tagline={tagline} className="text-center md:text-left" />
          </motion.div>

          <motion.div
            variants={staggerContainer(0.08, 0.24)}
            className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2"
          >
            <motion.div variants={fadeUpStagger} className="min-w-0">
              {editor}
            </motion.div>
            <motion.div variants={scaleIn} className="min-w-0">
              {preview}
            </motion.div>
          </motion.div>

          {terminal ? (
            <motion.div variants={fadeUpStagger} className="mt-6">
              {terminal}
            </motion.div>
          ) : null}
        </motion.div>
      </MotionConfig>
    </div>
  );
}

export default BuilderShowcase;
