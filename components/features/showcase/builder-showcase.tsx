"use client";

import * as React from "react";
import {
  motion,
  MotionConfig,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import {
  fadeUpStagger,
  scaleIn,
  SCROLL_THEATER,
  staggerContainer,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

import { ShowcaseTagline } from "./showcase-tagline";

export interface BuilderShowcaseProps {
  tagline?: string;
  editor: React.ReactNode;
  preview: React.ReactNode;
  terminal: React.ReactNode;
  className?: string;
  scrollDriven?: boolean;
  scrollProgress?: MotionValue<number>;
}

export function BuilderShowcase({
  tagline,
  editor,
  preview,
  terminal,
  className,
  scrollDriven,
  scrollProgress,
}: BuilderShowcaseProps) {
  const reducedMotion = useReducedMotion();
  const isScrollMode = scrollDriven && scrollProgress && !reducedMotion;
  const fallback = useMotionValue(0);
  const progress = scrollProgress ?? fallback;

  const editorOpacity = useTransform(
    progress,
    SCROLL_THEATER.editorRange,
    [0, 1]
  );
  const terminalOpacity = useTransform(
    progress,
    SCROLL_THEATER.terminalRange,
    [0, 1]
  );
  const previewOpacity = useTransform(
    progress,
    SCROLL_THEATER.previewRange,
    [0, 1]
  );
  const previewScale = useTransform(
    progress,
    SCROLL_THEATER.previewRange,
    SCROLL_THEATER.previewScaleRange
  );

  const [badgeVisible, setBadgeVisible] = React.useState(!scrollDriven);
  useMotionValueEvent(progress, "change", (v) => {
    if (isScrollMode) setBadgeVisible(v > 0.5);
  });

  if (isScrollMode) {
    return (
      <div className={cn("showcase w-full bg-background text-foreground", className)}>
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <ShowcaseTagline tagline={tagline} className="text-center md:text-left" />

          <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <motion.div style={{ opacity: editorOpacity }} className="min-w-0">
              {editor}
            </motion.div>
            <motion.div
              style={{ opacity: previewOpacity, scale: previewScale }}
              className="min-w-0"
            >
              {preview}
            </motion.div>
          </div>

          {terminal ? (
            <motion.div style={{ opacity: terminalOpacity }} className="mt-6">
              {terminal}
            </motion.div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("showcase w-full bg-background text-foreground", className)}>
      <MotionConfig reducedMotion="user">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
          className="mx-auto w-full max-w-7xl px-4 md:px-6"
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
