"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import {
  SHOWCASE_COMMANDS,
  type AiCommand,
  type AiCommandId,
} from "@/config/showcase";
import { SPRING_SHEET } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { AiCommandButton } from "./ai-command-button";

/**
 * AiCommandToolbar — floating glassmorphic pill cluster containing the
 * six Figma-defined AI commands.
 *
 * Phase 1: renders all 6 buttons in a horizontal pill on every viewport,
 *   manages active state via props (controlled) or internally (uncontrolled),
 *   and provides arrow-key navigation between segments (toolbar pattern).
 *   Buttons fire `onSelect` but no real work happens yet — wiring in T5.5.
 *
 * T2.2 adds the mobile collapse-to-FAB pattern:
 *   - `md:` and up: full horizontal pill (unchanged).
 *   - mobile (`md:hidden`): a single round FAB that expands upward into a
 *     vertically-stacked toolbar on tap. Closes on outside-click, Escape,
 *     or after a command fires. Spring animation via `SPRING_SHEET`.
 *
 * Variant-only motion — no local `initial`/`animate`; the FAB/expand panel
 * manage their own `AnimatePresence` independently of the orchestrator's
 * cascade because they're user-driven, not entrance-driven.
 */
export interface AiCommandToolbarProps {
  commands?: readonly AiCommand[];
  activeId?: AiCommandId | null;
  defaultActiveId?: AiCommandId | null;
  onSelect?: (id: AiCommandId) => void;
  className?: string;
}

export function AiCommandToolbar({
  commands = SHOWCASE_COMMANDS,
  activeId,
  defaultActiveId = null,
  onSelect,
  className,
}: AiCommandToolbarProps) {
  const isControlled = activeId !== undefined;
  const [internalActive, setInternalActive] =
    useState<AiCommandId | null>(defaultActiveId);
  const active = isControlled ? activeId : internalActive;

  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const handleSelect = (id: AiCommandId) => {
    if (!isControlled) setInternalActive(id);
    onSelect?.(id);
    setExpanded(false);
  };

  const focusAt = (idx: number) => {
    const safe = ((idx % commands.length) + commands.length) % commands.length;
    const node = refs.current[safe];
    node?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = commands.findIndex((c) => c.id === active);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAt(currentIdx === -1 ? 0 : currentIdx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAt(currentIdx === -1 ? commands.length - 1 : currentIdx - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(commands.length - 1);
        break;
      default:
        return;
    }
  };

  // ---- Mobile FAB state ----
  const [expanded, setExpanded] = useState(false);
  const mobileRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!mobileRootRef.current) return;
      if (!mobileRootRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const buttonList = (
    handleKey: (e: React.KeyboardEvent<HTMLDivElement>) => void,
  ) => (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Showcase actions"
      onKeyDown={handleKey}
      className={cn(
        "inline-flex items-center gap-1 rounded-chat border border-border/60 bg-card/80 px-1.5 py-1.5",
        "backdrop-blur-xl backdrop-saturate-[180%]",
        "shadow-[var(--shadow-1)]",
      )}
    >
      {commands.map((command, idx) => (
        <AiCommandButton
          key={command.id}
          ref={(node) => {
            refs.current[idx] = node;
          }}
          command={command}
          active={command.id === active}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop: full horizontal pill */}
      <div className={cn("hidden md:block", className)}>
        <div
          role="toolbar"
          aria-orientation="horizontal"
          aria-label="Showcase actions"
          onKeyDown={handleKeyDown}
          className={cn(
            "inline-flex items-center gap-1 rounded-chat border border-border/60 bg-card/80 px-1.5 py-1.5",
            "backdrop-blur-xl backdrop-saturate-[180%]",
            "shadow-[var(--shadow-1)]",
          )}
        >
          {commands.map((command, idx) => (
            <AiCommandButton
              key={command.id}
              ref={(node) => {
                refs.current[idx] = node;
              }}
              command={command}
              active={command.id === active}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Mobile: FAB with vertical expand */}
      <div ref={mobileRootRef} className={cn("relative md:hidden", className)}>
        <AnimatePresence>
          {expanded ? (
            <motion.div
              key="expanded-panel"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={SPRING_SHEET}
              className="absolute bottom-full right-0 mb-3 flex flex-col gap-1 rounded-chat border border-border/60 bg-card/90 p-1.5 backdrop-blur-xl backdrop-saturate-[180%] shadow-[var(--shadow-2)]"
              role="toolbar"
              aria-orientation="vertical"
              aria-label="Showcase actions"
              onKeyDown={handleKeyDown}
            >
              {commands.map((command, idx) => (
                <AiCommandButton
                  key={command.id}
                  ref={(node) => {
                    refs.current[idx] = node;
                  }}
                  command={command}
                  active={command.id === active}
                  onSelect={handleSelect}
                  className="w-full justify-start"
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-expanded={expanded}
          aria-haspopup="menu"
          aria-label={expanded ? "Close showcase actions" : "Open showcase actions"}
          onClick={() => setExpanded((e) => !e)}
          whileTap={{ scale: 0.92 }}
          transition={SPRING_SHEET}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center",
            "rounded-pill border border-border/60 bg-card/90 text-foreground",
            "backdrop-blur-xl backdrop-saturate-[180%]",
            "shadow-[var(--shadow-2)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {expanded ? (
              <motion.span
                key="x"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={SPRING_SHEET}
              >
                <X className="h-5 w-5" aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="sparkles"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={SPRING_SHEET}
              >
                <Sparkles className="h-5 w-5" aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

export default AiCommandToolbar;
