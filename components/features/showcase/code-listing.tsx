"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { tokenizeLine } from "@/lib/code-tokenizer";
import { fadeUpStagger, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * CodeListing — token-driven code renderer used inside the showcase's
 * editor panel.
 *
 * Each line is a `motion.div` keyed to `fadeUpStagger` so a parent
 * `motion.div` with `initial="hidden" whileInView="visible"` +
 * `variants={staggerContainer}` drives a per-line stagger reveal
 * WITHOUT React re-renders (framer-motion animates via RAF). If no
 * ancestor sets a variant label, lines render statically.
 */
export type CodeListingLanguage = "typescript" | "python";

export interface CodeListingProps {
  lines: readonly string[];
  language: CodeListingLanguage;
  /**
   * Number of lines rendered (1-indexed count). Defaults to
   * `lines.length` (all lines). Ignored when `staggerReveal` is true —
   * all lines always render so the stagger can animate each one.
   */
  visibleCount?: number;
  /**
   * When `true`, appends a blinking cursor (`.code-cursor`) after the
   * last line.
   */
  cursorOnLastLine?: boolean;
  /** Per-line stagger delay in seconds (default 0.14). */
  staggerDelay?: number;
  renderToken?: (
    token: { text: string; type: string },
    index: number,
  ) => React.ReactNode;
  className?: string;
}

const TOKEN_CLASS: Record<string, string> = {
  keyword: "tok-keyword",
  string: "tok-string",
  comment: "tok-comment",
  number: "tok-number",
  default: "tok-default",
};

export const CodeListing = React.forwardRef<
  HTMLDivElement,
  CodeListingProps
>(function CodeListing(
  {
    lines,
    language,
    visibleCount,
    cursorOnLastLine = false,
    staggerDelay = 0.14,
    renderToken,
    className,
  },
  ref,
) {
  const count = Math.max(0, Math.min(visibleCount ?? lines.length, lines.length));

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer(staggerDelay)}
      className={cn(
        "overflow-x-auto font-mono text-[13px] leading-[1.6]",
        className,
      )}
    >
      <div className="min-w-max px-4 py-3">
        {lines.slice(0, count).map((line, lineIdx) => {
          const tokens = tokenizeLine(line, language);
          const isLastLine = lineIdx === count - 1;
          return (
            <motion.div
              key={lineIdx}
              variants={fadeUpStagger}
              className="flex min-h-[1.6em]"
            >
              <span
                aria-hidden
                className="w-8 shrink-0 select-none pr-4 text-right text-muted-foreground/60"
              >
                {lineIdx + 1}
              </span>
              <code className="flex-1 whitespace-pre">
                {tokens.length === 0
                  ? null
                  : tokens.map((token, tIdx) => {
                      if (renderToken) {
                        return (
                          <React.Fragment key={tIdx}>
                            {renderToken(token, tIdx)}
                          </React.Fragment>
                        );
                      }
                      const cls = TOKEN_CLASS[token.type] ?? TOKEN_CLASS.default;
                      return (
                        <span key={tIdx} className={cls}>
                          {token.text}
                        </span>
                      );
                    })}
                {cursorOnLastLine && isLastLine ? (
                  <span className="code-cursor" aria-hidden />
                ) : null}
              </code>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

CodeListing.displayName = "CodeListing";

export default CodeListing;
