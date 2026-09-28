"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

import { CitationConnector } from "@/components/chat/citation-connector";
import { CitationPreviewCard } from "@/components/chat/citation-preview-card";
import { useEntityViewport } from "@/hooks/use-entity-viewport";
import { resolveEntity } from "@/lib/chat/entity-dom";
import { buildEntityId } from "@/lib/chat/protocol";
import { AgentCitation, AgentEntityId } from "@/types/chat";

import styles from "./inline-citations.module.css";

/** Below this width the chat panel is a fullscreen takeover (see
 *  docs/design/MOBILE-FIRST.md §3), so an overlay pointing at the page behind
 *  it would be drawn under an opaque sheet. */
const CONNECTOR_MIN_VIEWPORT_PX = 1024;

/** The resume has no `kind:id` entity on the page, so it never has a target. */
function entityIdFor(citation: AgentCitation): AgentEntityId | undefined {
  if (citation.type === "resume") return undefined;
  return buildEntityId(citation.type, citation.id);
}

/** Arrow icon shown on footer row hover. */
function CiteArrow() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* diagonal up-right = "go to page" */}
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

/**
 * Inline [n] badge rendered by MessageMarkdown's `a` component override
 * when the remark-cite plugin converts [n] text → a #cite:n link.
 */
export function CitationMark({
  n,
  citation,
}: {
  n: number;
  citation?: AgentCitation;
}) {
  if (!citation) {
    // Citation not resolved yet (streaming) — plain badge, no link
    return <span className={styles.citeMark}>{n}</span>;
  }
  return (
    <span className={styles.citeTip}>
      <Link href={citation.href} className={styles.citeMark}>
        {n}
      </Link>
      <span className={styles.citeTipBox} role="tooltip">
        {citation.title}
      </span>
    </span>
  );
}

/**
 * Numbered footer reference list rendered below the message body.
 * Each row shows: [n] badge · title · type · arrow.
 */
export function CitationFooter({
  citations,
}: {
  citations: AgentCitation[];
}) {
  const [hovered, setHovered] = useState<
    { citation: AgentCitation; anchor: DOMRect } | undefined
  >();

  const entityId = hovered ? entityIdFor(hovered.citation) : undefined;
  const entity = useEntityViewport(entityId, Boolean(hovered));

  if (citations.length === 0) return null;

  const preview = (() => {
    if (!hovered) return null;
    const { viewport } = entity;
    const tooNarrow =
      viewport.width > 0 && viewport.width < CONNECTOR_MIN_VIEWPORT_PX;
    if (tooNarrow) return null;

    // On this page → draw the line to it. Anywhere else → show what it is.
    if (entity.onPage && entity.rect && entityId) {
      return (
        <CitationConnector
          source={hovered.anchor}
          target={entity.rect}
          viewport={viewport}
          direction={entity.direction}
          element={resolveEntity(entityId)}
        />
      );
    }
    // Still pre-measurement (viewport 0×0) — wait a frame rather than
    // anchoring the card against a viewport we do not know yet.
    if (viewport.width === 0) return null;
    return (
      <CitationPreviewCard
        citation={hovered.citation}
        anchor={hovered.anchor}
        viewport={viewport}
      />
    );
  })();

  return (
    <div className={styles.citeFooter}>
      {citations.map((citation, i) => {
        const show = (event: { currentTarget: HTMLElement }) =>
          setHovered({
            citation,
            anchor: event.currentTarget.getBoundingClientRect(),
          });
        const hide = () => setHovered(undefined);

        return (
          <Link
            key={citation.id}
            href={citation.href}
            className={styles.citeRef}
            onPointerEnter={show}
            onPointerLeave={hide}
            // Keyboard users get the same preview: the row is already
            // focusable, so focus/blur mirror hover exactly.
            onFocus={show}
            onBlur={hide}
          >
            <span className={styles.citeMark}>{i + 1}</span>
            <span className={styles.citeRefLabel}>{citation.title}</span>
            <span className={styles.citeSep}>·</span>
            <span className={styles.citeRefKind}>{citation.type}</span>
            <span className={styles.citeArrow} aria-hidden>
              <CiteArrow />
            </span>
          </Link>
        );
      })}
      {/* Portalled: the chat panel animates with transforms, and a transformed
          ancestor would make `position: fixed` resolve against it instead of
          the viewport. */}
      {preview && typeof document !== "undefined"
        ? createPortal(preview, document.body)
        : null}
    </div>
  );
}
