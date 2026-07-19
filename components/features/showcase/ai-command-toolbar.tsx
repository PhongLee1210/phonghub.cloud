"use client";

import * as React from "react";
import { useState } from "react";

import {
  SHOWCASE_COMMANDS,
  type AiCommand,
  type AiCommandId,
} from "@/config/showcase";
import { cn } from "@/lib/utils";

import { AiCommandButton } from "./ai-command-button";

/**
 * AiCommandToolbar — floating glassmorphic pill cluster containing the
 * six Figma-defined AI commands.
 *
 * Phase 1: renders all 6 buttons, manages active state via props
 * (controlled) or internally (uncontrolled), and provides arrow-key
 * navigation between segments (toolbar pattern). Buttons fire `onSelect`
 * but no real work happens yet — the wiring lands in T5.5.
 *
 * Mobile collapse-to-FAB: deferred to T2.2 (Phase 2 motion). In Phase 1
 * the toolbar renders the same horizontal pill on every viewport. The
 * T1.9 scratch route verifies the desktop composition; the mobile
 * collapse is verified in T2.2.
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

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Showcase actions"
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-chat border border-border/60 bg-card/80 px-1.5 py-1.5",
        "backdrop-blur-xl backdrop-saturate-[180%]",
        "shadow-[var(--shadow-1)]",
        className,
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
}

export default AiCommandToolbar;
