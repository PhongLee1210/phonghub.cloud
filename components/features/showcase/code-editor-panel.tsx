"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { CodeListing, type CodeListingLanguage } from "./code-listing";
import { LanguageChip } from "./language-chip";
import { WindowChrome } from "./window-chrome";

/**
 * CodeEditorPanel — composition of the showcase's editor pane.
 *
 * Layout (Figma node `20:5`):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ ● ● ●  app/page.tsx                 TSX      │  ← WindowChrome header
 *   ├──────────────────────────────────────────────┤
 *   │  1   import { ... } from "next"               │
 *   │  2                                            │  ← CodeListing body
 *   │  3   export default function Home() {        │
 *   │  ...                                          │
 *   └──────────────────────────────────────────────┘
 *
 * Modes:
 *   - `"static"` (default) — renders all lines instantly; `compiled`
 *     is passed straight through. SSR-safe.
 *   - `"reveal"` — per-line stagger driven by framer-motion variants
 *     (`whileInView` + `staggerChildren`). Zero React re-renders during
 *     the reveal — framer-motion animates via RAF. The "✓ compiled"
 *     badge flips on via a single `onViewportEnter` callback after the
 *     estimated total reveal duration.
 */
export type CodeEditorMode = "static" | "reveal";

export interface CodeEditorPanelProps {
  filename: string;
  language: CodeListingLanguage;
  lines: readonly string[];
  compiled?: boolean;
  mode?: CodeEditorMode;
  onComplete?: () => void;
  lineDelayMs?: number;
  className?: string;
}

export function CodeEditorPanel({
  filename,
  language,
  lines,
  compiled: compiledProp = false,
  mode = "static",
  onComplete,
  lineDelayMs = 120,
  className,
}: CodeEditorPanelProps) {
  const reveal = mode === "reveal";
  const prefersReducedMotion = useReducedMotion();

  const [compiledState, setCompiledState] = React.useState(false);
  const completedRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const handleViewportEnter = React.useCallback(() => {
    if (!reveal || completedRef.current) return;
    completedRef.current = true;
    const totalMs = prefersReducedMotion
      ? 100
      : lines.length * lineDelayMs + 300;
    timerRef.current = setTimeout(() => {
      setCompiledState(true);
      onComplete?.();
    }, totalMs);
  }, [reveal, prefersReducedMotion, lines.length, lineDelayMs, onComplete]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const effectiveCompiled = reveal ? compiledState : compiledProp;

  const content = (
    <WindowChrome
      title={filename}
      className={cn("shadow-[var(--shadow-1)]", className)}
      right={
        <>
          {effectiveCompiled ? (
            <span
              aria-label="Compiled successfully"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-success"
            >
              <span aria-hidden>✓</span>
              <span>compiled</span>
            </span>
          ) : null}
          <LanguageChip language={language} />
        </>
      }
    >
      <motion.div
        initial={reveal ? "hidden" : false}
        whileInView={reveal ? "visible" : undefined}
        viewport={{ once: true, margin: "-80px" }}
        onViewportEnter={handleViewportEnter}
      >
        <CodeListing
          lines={lines}
          language={language}
          cursorOnLastLine={reveal && !compiledState}
          staggerDelay={lineDelayMs / 1000}
        />
      </motion.div>
    </WindowChrome>
  );

  return content;
}

export default CodeEditorPanel;
