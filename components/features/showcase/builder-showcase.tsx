import * as React from "react";

import type { AiCommandId } from "@/config/showcase";
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
 * Phase 1 (this file): static composition. `editor` / `preview` / `terminal`
 * are passed in as ReactNodes so Phase 3/4 sections (Skills/Projects) can
 * swap their own bodies (e.g. `<SkillPreviewBody>` instead of
 * `<LivePreviewFrame>`). The toolbar defaults to `<AiCommandToolbar>`.
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
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-20">
        <ShowcaseTagline
          tagline={tagline}
          className="text-center md:text-left"
        />

        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <div className="min-w-0">{editor}</div>
          <div className="min-w-0">{preview}</div>
        </div>

        {terminal ? <div className="mt-6">{terminal}</div> : null}
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[60]",
          "bottom-[calc(var(--safe-bottom,0px)+1.5rem)]",
          "flex justify-center px-4",
          "md:inset-x-auto md:right-6 md:bottom-6 md:px-0 md:justify-end",
        )}
      >
        <div className="pointer-events-auto max-w-full overflow-x-auto md:max-w-none">
          {toolbar ?? (
            <AiCommandToolbar
              activeId={activeCommandId}
              onSelect={onCommandSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default BuilderShowcase;
