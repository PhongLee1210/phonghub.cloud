import * as React from "react";

import { tokenizeLine } from "@/lib/code-tokenizer";
import { cn } from "@/lib/utils";

/**
 * CodeListing — static, token-driven code renderer used inside the
 * showcase's editor panel.
 *
 * Replaces the ad-hoc palette classes (`text-purple-400` etc.) used by
 * `components/projects/code-terminal.tsx` with theme-token-driven classes
 * (`.tok-keyword`, `.tok-string`, ...) defined in `app/globals.css` under
 * `.showcase`. That keeps the standalone code-terminal.tsx untouched (it
 * still renders the projects page) while the showcase editor becomes
 * theme-aware.
 *
 * Pure / server-component safe — no hooks, no motion. The typewriter
 * reveal lives in T2.1's CodeEditorPanel; this primitive just renders
 * whatever lines it's given.
 */
export type CodeListingLanguage = "typescript" | "python";

export interface CodeListingProps {
  lines: readonly string[];
  language: CodeListingLanguage;
  /**
   * Number of lines rendered so far (1-indexed count). Used by the
   * typewriter reveal in T2.1 — defaults to `lines.length` (all lines).
   */
  visibleCount?: number;
  /**
   * Optional renderer invoked per token type. Defaults to a `<span>` with
   * the matching `.tok-*` class.
   */
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
  { lines, language, visibleCount, renderToken, className },
  ref,
) {
  const count = Math.max(0, Math.min(visibleCount ?? lines.length, lines.length));

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-x-auto font-mono text-[13px] leading-[1.6]",
        className,
      )}
    >
      <div className="min-w-max px-4 py-3">
        {lines.slice(0, count).map((line, lineIdx) => {
          const tokens = tokenizeLine(line, language);
          return (
            <div key={lineIdx} className="flex min-h-[1.6em]">
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
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CodeListing.displayName = "CodeListing";

export default CodeListing;
