"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CodeListing, type CodeListingLanguage } from "./code-listing";
import { LanguageChip } from "./language-chip";
import { WindowChrome } from "./window-chrome";

/**
 * CodeEditorPanel — static composition of the showcase's editor pane.
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
 * Phase 1 ships this as a pure composition (no motion, no AI wiring).
 * T2.1 adds the typewriter reveal (`visibleCount` driven by useInView);
 * T5.6 appends streamed deltas.
 */
export interface CodeEditorPanelProps {
  /** Filename shown in the window chrome title (e.g. "app/page.tsx"). */
  filename: string;
  language: CodeListingLanguage;
  lines: readonly string[];
  /**
   * Number of lines currently visible. Forwarded to `CodeListing`. Used
   * by T2.1's typewriter reveal; defaults to `lines.length` (all visible).
   */
  visibleCount?: number;
  /**
   * When `true`, shows a "✓ compiled" status in the chrome's right slot
   * next to the language chip. T2.1 flips this on after the typewriter
   * finishes; T1.3 leaves it `false` by default.
   */
  compiled?: boolean;
  className?: string;
}

export function CodeEditorPanel({
  filename,
  language,
  lines,
  visibleCount,
  compiled = false,
  className,
}: CodeEditorPanelProps) {
  return (
    <WindowChrome
      title={filename}
      className={cn("shadow-[var(--shadow-1)]", className)}
      right={
        <>
          {compiled ? (
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
        lines={lines}
        language={language}
        visibleCount={visibleCount}
      />
    </WindowChrome>
  );
}

export default CodeEditorPanel;
