"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { Icons } from "@/components/common/icons";
import { CITATION_KIND_ICON } from "@/config/chat";
import { tiltFromPointer, type RectLike } from "@/lib/chat/geometry";
import { SPRING_SHOWCASE } from "@/lib/motion";
import type { AgentCitation } from "@/types/chat";

/** Maximum lean, in degrees. Past ~8° the text edges start to read as blurry. */
const MAX_TILT_DEG = 8;
const CARD_WIDTH_PX = 260;
/** Bounds the vertical clamp; the card is short, this is the worst case. */
const CARD_MAX_HEIGHT_PX = 150;
const GAP_PX = 10;

interface CitationPreviewCardProps {
  citation: AgentCitation;
  /** The hovered row, in viewport pixels — the card anchors beside it. */
  anchor: RectLike;
  viewport: { width: number; height: number };
}

/**
 * Shown when a cited resource is NOT on the current page, so there is nothing
 * to point at. Gives the visitor the substance instead: what it is, and a lean
 * toward the pointer so the card reads as a physical object rather than a
 * second tooltip.
 *
 * CSS 3D on purpose — the site already runs two WebGL contexts (the particle
 * field and the robot). A third canvas for a hover effect is not worth a
 * context, a render loop, and the mobile risk that comes with them.
 */
export function CitationPreviewCard({
  citation,
  anchor,
  viewport,
}: CitationPreviewCardProps) {
  const reducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const Icon = Icons[CITATION_KIND_ICON[citation.type]];

  // Beside the row, not above it: the citation list runs upward from the
  // hovered row, so anchoring above would bury the very citations the visitor
  // is scanning. Sitting to the left of the panel keeps the whole list legible.
  const left = Math.max(GAP_PX, anchor.left - GAP_PX - CARD_WIDTH_PX);
  const top = Math.max(
    GAP_PX,
    Math.min(
      anchor.top - CARD_MAX_HEIGHT_PX / 3,
      viewport.height - CARD_MAX_HEIGHT_PX - GAP_PX
    )
  );

  return (
    <motion.div
      className="pointer-events-none fixed z-[57] rounded-chat border border-chat-border bg-chat-bubble-ai p-3 shadow-lg"
      style={{
        left,
        top,
        width: CARD_WIDTH_PX,
        maxHeight: CARD_MAX_HEIGHT_PX,
        transformPerspective: 800,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : SPRING_SHOWCASE}
      onPointerMove={(event) => {
        if (reducedMotion) return;
        const box = event.currentTarget.getBoundingClientRect();
        setTilt(
          tiltFromPointer({ x: event.clientX, y: event.clientY }, box, MAX_TILT_DEG)
        );
      }}
      aria-hidden
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <p className="truncate text-xs font-semibold text-card-foreground">
          {citation.title}
        </p>
        <span className="ml-auto text-[10px] capitalize text-muted-foreground">
          {citation.type}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">
        {citation.description}
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Not on this page — open to view
      </p>
    </motion.div>
  );
}
