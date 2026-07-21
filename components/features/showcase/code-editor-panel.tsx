"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

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
 *   - `"static"` (default) — renders all lines instantly; `visibleCount`
 *     and `compiled` are passed straight through. SSR-safe.
 *   - `"reveal"` — types lines one-by-one on `useInView` (margin `-80px`),
 *     shows a blinking cursor on the active line, flips `compiled` 200ms
 *     after the last line, then fires `onComplete`. Behaviour ported from
 *     `components/projects/code-terminal.tsx` (kept untouched — still used
 *     by the standalone projects page).
 *
 * Accessibility:
 *   - `useReducedMotion()` short-circuits the timer cascade — all lines
 *     paint instantly, `compiled` is set, and `onComplete` fires once.
 *   - The blinking cursor itself respects `prefers-reduced-motion` via
 *     the `.code-cursor` CSS rule in `app/globals.css`.
 */
export type CodeEditorMode = "static" | "reveal";

export interface CodeEditorPanelProps {
  /** Filename shown in the window chrome title (e.g. "app/page.tsx"). */
  filename: string;
  language: CodeListingLanguage;
  lines: readonly string[];
  /**
   * Number of lines currently visible in `"static"` mode. Ignored when
   * `mode === "reveal"` (panel drives its own count). Defaults to
   * `lines.length` (all visible).
   */
  visibleCount?: number;
  /**
   * Shows the "✓ compiled" badge in the chrome right slot. In `"static"`
   * mode this is the parent-controlled value; in `"reveal"` mode the
   * prop is ignored and the badge appears 200ms after the last line.
   */
  compiled?: boolean;
  /**
   * `"static"` (default) renders instantly; `"reveal"` drives a
   * typewriter cascade via `useInView`.
   */
  mode?: CodeEditorMode;
  /** Fired exactly once when the reveal completes (last line + 200ms). */
  onComplete?: () => void;
  /** Per-line delay in ms (default 120). */
  lineDelayMs?: number;
  /**
   * AI-streamed code appended live. Split into lines on `\n` and
   * rendered after the snippet lines.
   */
  streamedCode?: string;
  /**
   * When `true`, short-circuit the reveal cascade and show all snippet
   * lines + `streamedCode` instantly. Used while a stream is in flight
   * so the streamed text shows up alongside the snippet.
   */
  streaming?: boolean;
  className?: string;
}

export function CodeEditorPanel({
  filename,
  language,
  lines,
  visibleCount,
  compiled: compiledProp = false,
  mode = "static",
  onComplete,
  lineDelayMs = 120,
  streamedCode,
  streaming = false,
  className,
}: CodeEditorPanelProps) {
  const reveal = mode === "reveal" && !streaming;

  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const [revealedCount, setRevealedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [compiledState, setCompiledState] = useState(false);

  // Keep latest onComplete without retriggering the cascade effect.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (reveal && inView && !started) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot transition flag reacting to external scroll state from framer-motion's useInView
      setStarted(true);
    }
  }, [reveal, inView, started]);

  useEffect(() => {
    if (reveal && prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion short-circuit: paint final state once
      setRevealedCount(lines.length);
      setCompiledState(true);
      onCompleteRef.current?.();
      return;
    }

    if (!reveal || !started || prefersReducedMotion) return;

    let count = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const revealNext = () => {
      count += 1;
      setRevealedCount(count);
      if (count < lines.length) {
        timers.push(setTimeout(revealNext, lineDelayMs));
      } else {
        timers.push(
          setTimeout(() => {
            setCompiledState(true);
            onCompleteRef.current?.();
          }, 200),
        );
      }
    };

    timers.push(setTimeout(revealNext, lineDelayMs));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [reveal, started, prefersReducedMotion, lines.length, lineDelayMs]);

  const effectiveVisibleCount = reveal ? revealedCount : visibleCount;
  const effectiveCompiled = reveal ? compiledState : compiledProp;
  const cursorActive = reveal && !compiledState && revealedCount > 0;

  // Append streamed code as additional lines when provided.
  const streamedLines =
    streamedCode && streamedCode.length > 0
      ? streamedCode.split("\n")
      : [];
  const allLines =
    streamedLines.length > 0 ? [...lines, ...streamedLines] : lines;
  const allVisibleCount =
    streaming || streamedLines.length > 0
      ? allLines.length
      : effectiveVisibleCount;

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
      <CodeListing
        lines={allLines}
        language={language}
        visibleCount={allVisibleCount}
        cursorOnLastLine={cursorActive || streaming}
      />
    </WindowChrome>
  );

  // The `useInView` ref has to sit on a stable parent in `"reveal"` mode
  // so the cascade triggers as the panel scrolls into view.
  return reveal ? <div ref={containerRef}>{content}</div> : content;
}

export default CodeEditorPanel;
