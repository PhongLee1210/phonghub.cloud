"use client";

import * as React from "react";
import { motion, MotionConfig } from "framer-motion";

import type { AiCommandId } from "@/config/showcase";
import { fadeUpStagger, scaleIn, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { AiCommandToolbar } from "./ai-command-toolbar";
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
 *                                          ╭──────────╮
 *                                          │ AI pill  │  ← floating toolbar (fixed, z-60)
 *                                          ╰──────────╯
 *
 * `editor` / `preview` / `terminal` are passed in as ReactNodes so Phase 3/4
 * sections (Skills/Projects) can swap their own bodies (e.g.
 * `<SkillPreviewBody>` instead of `<LivePreviewFrame>`). The toolbar
 * defaults to `<AiCommandToolbar>`.
 *
 * Wraps everything in `<div className="showcase">` so the navy theme
 * tokens (defined in `app/globals.css`) are locally scoped — does NOT
 * touch the global theme.
 *
 * T2.2 adds the entrance cascade: top-level `motion.div` with
 * `staggerContainer(0.12)` drives variant-keyed children
 * (`fadeUpStagger`/`scaleIn`) — every showcase sub-component is variant-only
 * so the orchestrator owns `initial`/`animate`. `<MotionConfig
 * reducedMotion="user">` makes the whole composition auto-respect the OS
 * setting without per-component `useReducedMotion()` checks.
 */
export interface BuilderShowcaseProps {
  tagline?: string;
  editor: React.ReactNode;
  preview: React.ReactNode;
  terminal: React.ReactNode;
  /** Override the default `<AiCommandToolbar>`. */
  toolbar?: React.ReactNode;
  /** Passed to the default AiCommandToolbar when `toolbar` is not provided. */
  activeCommandId?: AiCommandId | null;
  /** Passed to the default AiCommandToolbar when `toolbar` is not provided. */
  onCommandSelect?: (id: AiCommandId) => void;
  className?: string;
}

export function BuilderShowcase({
  tagline,
  editor,
  preview,
  terminal,
  toolbar,
  activeCommandId,
  onCommandSelect,
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

      {/* Floating AI toolbar — outside the stagger container so its own
          FAB/expand animation (T2.2) is decoupled from the entrance cascade. */}
      <div
        className={cn(
          "pointer-events-none fixed z-[60]",
          // Mobile: FAB pinned bottom-right per docs/MOBILE_FIRST.md §10
          "bottom-[calc(var(--safe-bottom,0px)+1.5rem)] right-4",
          // Desktop: pill pinned bottom-right
          "md:bottom-6 md:right-6",
        )}
      >
        <div className="pointer-events-auto">
          {toolbar ?? (
            <AiCommandToolbar activeId={activeCommandId} onSelect={onCommandSelect} />
          )}
        </div>
      </div>
    </div>
  );
}

export default BuilderShowcase;
