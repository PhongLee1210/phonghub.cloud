import { normalizeTerm, resolveAlias } from "./normalize";
import { similarity } from "./trigram";
import { STATIC_INDEX, type DocKind, type SearchDoc } from "./index-builder";

/**
 * How a result was found. Surfaced to the model so it can say "the closest
 * thing is…" instead of presenting a near miss as a direct hit.
 */
export const MatchKind = {
  EXACT: "EXACT",
  ALIAS: "ALIAS",
  FUZZY: "FUZZY",
} as const;
export type MatchKind = (typeof MatchKind)[keyof typeof MatchKind];

/**
 * Dice-coefficient floor for a fuzzy match to count.
 *
 * Tuned against this corpus so that plausible misspellings land above it and
 * unrelated technologies land below. Lowering it trades honest empty results
 * for confident wrong ones, which is the worse failure in front of a visitor —
 * `searchDocs("cobol")` returning nothing is the test that guards this.
 */
export const FUZZY_MATCH_THRESHOLD = 0.45;

/** Shortest query allowed to match by containment; below this, single letters
 *  appear inside nearly every term and would return the whole corpus. */
const MIN_SUBSTRING_QUERY_LENGTH = 3;

const TITLE_WEIGHT = 1;
const TAG_WEIGHT = 0.9;
const SUBSTRING_SCORE = 0.8;
const BODY_SCORE = 0.5;

export interface SearchHit {
  agentId: SearchDoc["agentId"];
  kind: DocKind;
  score: number;
  matchedOn: MatchKind;
}

export interface SearchOptions {
  kind?: DocKind;
  limit?: number;
}

/** Kept separate so the comparison itself is testable at the boundary. */
export function passesThreshold(score: number): boolean {
  return score >= FUZZY_MATCH_THRESHOLD;
}

interface ScoredMatch {
  score: number;
  matchedOn: MatchKind;
}

function scoreDoc(
  doc: SearchDoc,
  normalizedQuery: string,
  normalizedAlias: string | undefined
): ScoredMatch | undefined {
  const fields: Array<{ text: string; weight: number }> = [
    { text: normalizeTerm(doc.title), weight: TITLE_WEIGHT },
    ...doc.tags.map((tag) => ({ text: normalizeTerm(tag), weight: TAG_WEIGHT })),
  ];

  // 1. EXACT — the spelling matches once punctuation and case are removed.
  if (fields.some((field) => field.text === normalizedQuery)) {
    return { score: 1, matchedOn: MatchKind.EXACT };
  }

  // 2. ALIAS — a curated shorthand ("ts", "postgres") for a real name.
  if (
    normalizedAlias &&
    fields.some((field) => field.text === normalizedAlias)
  ) {
    return { score: 0.95, matchedOn: MatchKind.ALIAS };
  }

  const longEnough = normalizedQuery.length >= MIN_SUBSTRING_QUERY_LENGTH;

  // 3. FUZZY by containment — "react" inside "reactnative".
  if (longEnough && fields.some((field) => field.text.includes(normalizedQuery))) {
    return { score: SUBSTRING_SCORE, matchedOn: MatchKind.FUZZY };
  }

  // 4. FUZZY by similarity — typos and near misses on short, high-signal text.
  let best = 0;
  for (const field of fields) {
    best = Math.max(best, similarity(normalizedQuery, field.text) * field.weight);
  }
  if (passesThreshold(best)) return { score: best, matchedOn: MatchKind.FUZZY };

  // 5. Prose containment, last and lowest: a term mentioned in a description
  //    is a real signal, but a weaker one than a name or a tag. Body text is
  //    never fuzzy-matched — trigram similarity against a paragraph is noise.
  if (longEnough && normalizeTerm(doc.body).includes(normalizedQuery)) {
    return { score: BODY_SCORE, matchedOn: MatchKind.FUZZY };
  }

  return undefined;
}

/** Ranks an arbitrary document set. Used directly for blog posts, which are
 *  loaded asynchronously and so live outside the static index. */
export function rankDocs(
  docs: readonly SearchDoc[],
  query: string,
  limit: number
): SearchHit[] {
  const normalizedQuery = normalizeTerm(query);
  if (!normalizedQuery) return [];

  const aliasTarget = resolveAlias(query);
  const normalizedAlias = aliasTarget ? normalizeTerm(aliasTarget) : undefined;

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const match = scoreDoc(doc, normalizedQuery, normalizedAlias);
    if (!match) continue;
    hits.push({
      agentId: doc.agentId,
      kind: doc.kind,
      score: match.score,
      matchedOn: match.matchedOn,
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

const DEFAULT_LIMIT = 5;

/** Searches the static corpus (projects, experience, skills). */
export function searchDocs(
  query: string,
  options: SearchOptions = {}
): SearchHit[] {
  const { kind, limit = DEFAULT_LIMIT } = options;
  const docs = kind
    ? STATIC_INDEX.filter((doc) => doc.kind === kind)
    : STATIC_INDEX;
  return rankDocs(docs, query, limit);
}
