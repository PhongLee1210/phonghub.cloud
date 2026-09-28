"use client";

import { useEffect, useState } from "react";

import { resolveEntity } from "@/lib/chat/entity-dom";
import {
  offscreenDirection,
  type OffscreenDirection,
  type RectLike,
  type Viewport,
} from "@/lib/chat/geometry";
import type { AgentEntityId } from "@/types/chat";

export interface EntityViewportState {
  /** True when the cited resource has a rendered element on this page. */
  onPage: boolean;
  rect?: RectLike;
  viewport: Viewport;
  /** null when fully visible; otherwise the edge it sits beyond. */
  direction: OffscreenDirection | null;
}

/** Pre-measurement state. A 0×0 viewport means "not measured yet", which is
 *  distinct from "measured, and the target isn't on this page". */
const ABSENT: EntityViewportState = {
  onPage: false,
  viewport: { width: 0, height: 0 },
  direction: null,
};

function measure(agentId: AgentEntityId | undefined): EntityViewportState {
  // The viewport is reported even when there is no target to find: a citation
  // that points somewhere else still needs somewhere to put its preview card.
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  const el = agentId ? resolveEntity(agentId) : null;
  if (!el) return { onPage: false, viewport, direction: null };

  const rect = el.getBoundingClientRect();
  return {
    onPage: true,
    // Deliberately the transformed rect: this drives a visual overlay, so the
    // element's painted position is the correct one. Do not reuse it for
    // layout maths (see documentOffsetTop in robot-companion.tsx).
    rect,
    viewport,
    direction: offscreenDirection(rect, viewport),
  };
}

/**
 * Locates the element a citation points at, while a citation is hovered.
 *
 * Measurement is deliberately hover-scoped: a ResizeObserver per citation, or
 * a standing scroll listener, would cost layout work on every frame of every
 * scroll for an overlay that is visible a fraction of the time. While a
 * citation IS hovered, scroll and resize re-measure on the next animation
 * frame so the connector tracks the page.
 */
export function useEntityViewport(
  agentId: AgentEntityId | undefined,
  enabled: boolean
): EntityViewportState {
  // The snapshot carries the id it was measured for. Returning it only on a
  // match means moving from one citation to another can't show the previous
  // target's position for a frame, and lets the no-citation case be derived
  // rather than written into state from an effect.
  const key = enabled ? `on|${agentId ?? ""}` : "off";
  const [snapshot, setSnapshot] = useState<{
    key: string;
    state: EntityViewportState;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let cancelled = false;

    const update = () => {
      frame = 0;
      if (!cancelled) setSnapshot({ key, state: measure(agentId) });
    };

    // Coalesce bursts of scroll events into one measurement per frame. The
    // first measurement goes through the same path, so nothing is written
    // synchronously during the effect.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      cancelled = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [agentId, enabled, key]);

  return enabled && snapshot?.key === key ? snapshot.state : ABSENT;
}
