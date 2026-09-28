"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

import {
  anchorPoint,
  clampRectIntoViewport,
  type RectLike,
  type Viewport,
} from "@/lib/chat/geometry";
import type { OffscreenDirection } from "@/lib/chat/geometry";

/** Applied to the cited element while previewed — quieter than the agent's own
 *  `.agent-highlighted`, which means "the agent acted on this". */
const PREVIEW_CLASS = "agent-previewed";

/** How far inside the viewport an off-screen target's marker is pinned. */
const EDGE_MARGIN_PX = 28;

const OFFSCREEN_LABEL: Record<OffscreenDirection, string> = {
  up: "above",
  down: "below",
  left: "left of view",
  right: "right of view",
};

interface CitationConnectorProps {
  /** The hovered citation row, in viewport pixels. */
  source: RectLike;
  /** The cited element, in viewport pixels. */
  target: RectLike;
  viewport: Viewport;
  direction: OffscreenDirection | null;
  /** The cited element, so it can be ringed while previewed. */
  element: HTMLElement | null;
}

/**
 * Draws a curve from a hovered citation to the thing it cites, when that thing
 * is on the current page.
 *
 * Sits at z-[57], one below the desktop chat panel (z-[58]) on purpose: the
 * line tucks under the panel's edge rather than crossing the conversation.
 */
export function CitationConnector({
  source,
  target,
  viewport,
  direction,
  element,
}: CitationConnectorProps) {
  const reducedMotion = useReducedMotion();

  // Ring the cited element for as long as the connector is up. Done here (not
  // in the parent) so mount/unmount of the overlay and the ring stay in step.
  useEffect(() => {
    if (!element) return;
    element.classList.add(PREVIEW_CLASS);
    return () => element.classList.remove(PREVIEW_CLASS);
  }, [element]);

  // An off-screen target's centre lies outside the overlay, so the curve would
  // run to a point nobody can see. Ending it at the viewport edge, labelled,
  // says "it is that way" instead.
  const visualTarget = direction
    ? clampRectIntoViewport(target, viewport, EDGE_MARGIN_PX)
    : target;

  const path = anchorPoint(source, visualTarget, viewport);
  if (!path) return null;

  const d = `M ${path.from.x} ${path.from.y} Q ${path.control.x} ${path.control.y} ${path.to.x} ${path.to.y}`;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[57]"
      width={viewport.width}
      height={viewport.height}
      aria-hidden
    >
      <motion.path
        d={d}
        fill="none"
        stroke="hsl(var(--ring))"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="4 4"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }
        }
      />
      <motion.circle
        cx={path.to.x}
        cy={path.to.y}
        r={3.5}
        fill="hsl(var(--ring))"
        initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reducedMotion ? { duration: 0 } : { delay: 0.22, duration: 0.16 }
        }
      />
      {direction && (
        <text
          x={path.to.x}
          y={path.to.y - 10}
          textAnchor="middle"
          fontSize={11}
          fill="hsl(var(--ring))"
        >
          {OFFSCREEN_LABEL[direction]}
        </text>
      )}
    </svg>
  );
}
