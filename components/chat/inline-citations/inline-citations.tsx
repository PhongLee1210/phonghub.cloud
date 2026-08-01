"use client";

import Link from "next/link";

import { AgentCitation } from "@/types/chat";

import styles from "./inline-citations.module.css";

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
  if (citations.length === 0) return null;
  return (
    <div className={styles.citeFooter}>
      {citations.map((citation, i) => (
        <Link key={citation.id} href={citation.href} className={styles.citeRef}>
          <span className={styles.citeMark}>{i + 1}</span>
          <span className={styles.citeRefLabel}>{citation.title}</span>
          <span className={styles.citeSep}>·</span>
          <span className={styles.citeRefKind}>{citation.type}</span>
          <span className={styles.citeArrow} aria-hidden>
            <CiteArrow />
          </span>
        </Link>
      ))}
    </div>
  );
}
