/**
 * The retrieval layer's public surface.
 *
 * Callers import from `@/lib/retrieval` and nothing else: `normalize`,
 * `trigram` and `index-builder` are implementation detail, and keeping one
 * entry point is what makes the scoring ladder replaceable (a vector store,
 * if the corpus ever outgrows a few dozen entries) without touching callers.
 */

export {
  MatchKind,
  rankDocs,
  searchDocs,
  type SearchHit,
  type SearchOptions,
} from "./search";
export {
  blogDocsFrom,
  type DocKind,
  type SearchDoc,
} from "./index-builder";
