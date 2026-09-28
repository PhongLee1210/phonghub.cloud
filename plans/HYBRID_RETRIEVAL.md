# P2 — Hybrid Retrieval Layer

_Effort: M. Backend only. Fully unit-testable. No new dependency, no database — preserves the config-driven constraint in `AGENTS.md`._

## Problem

The tools in `lib/chat/tools.ts` are named `search_*` but none of them search. They are exact-enum filters:

```ts
// lib/data/projects.ts
export function filterProjectsByTechStack(skill: ValidSkills): ProjectInterface[] {
  return PROJECTS.filter((project) => project.techStack.includes(skill));
}
```

and the tool casts an arbitrary model-generated string into that enum:

```ts
// lib/chat/tools.ts
results = filterProjectsByTechStack(techStack as ValidSkills);
```

Failure modes this produces today:

| Visitor asks | Model passes | Result | What the agent says |
|---|---|---|---|
| "Does he know Next.js?" | `"Next.js"` | hit (exact) | correct |
| same | `"NextJS"` / `"next"` / `"Next"` | `[]` | **"I couldn't find anything"** — about a skill he has |
| "Any GraphQL work?" | `"graphql"` (lowercase) | `[]` | same false negative |
| "Show me his writing on RAG" | `search_blog(tag: "RAG")` | `[]` unless the tag string matches exactly | same |

Worse, **`search_blog` has no query parameter at all** — only `category` and `tag`. Asked about any blog *topic*, it returns the five most recent posts regardless of relevance, and the model then cites them as if they answered the question.

`app/api/blog/search/route.ts` has the same shape of gap: substring match on title and summary only, never the post body.

None of this is caught by the existing 180 tests, because they assert against known-exact strings (`filterProjectsByTechStack("GraphQL")`).

This is the only item on the roadmap where the agent is currently **wrong in front of a recruiter**, which is why it outranks the 3D work despite being less fun.

## Goal

Every `search_*` tool accepts free text and resolves it through a three-stage ladder, returning `[]` only when the corpus genuinely has nothing.

```
query "nextjs"
   │
   ├─ 1. EXACT      — normalized string === normalized enum value       → hit
   ├─ 2. ALIAS      — curated synonym map ("nextjs" → "Next.js")        → hit
   └─ 3. FUZZY      — trigram similarity ≥ THRESHOLD over the index     → ranked hits
                      below threshold → []  (and log the near-miss)
```

## Design

### New module: `lib/retrieval/`

| File | Contents |
|---|---|
| `normalize.ts` | `normalizeTerm(s)` — lowercase, strip `.`/`-`/`_`/spaces, collapse whitespace. `"Next.js"`, `"NextJS"`, `"next js"` all → `nextjs`. |
| `aliases.ts` | `SKILL_ALIASES: Record<string, ValidSkills>` — curated, derived from `config/constants.ts`. ~40 entries: `nextjs`, `next`, `ts`, `js`, `py`, `fastapi`, `rn`, `postgres`, `psql`, `gql`, `k8s`, … |
| `trigram.ts` | `trigrams(s): Set<string>`, `similarity(a, b): number` (Dice coefficient). ~35 lines, no dependency. |
| `index-builder.ts` | Builds a flat `SearchDoc[]` once at module load from `config/projects`, `config/experience`, `config/skills`, and `lib/blog/service` posts. Each doc: `{ agentId, kind, title, tags, body, weight }`. |
| `search.ts` | `searchDocs(query, { kind?, limit })` — runs the ladder, applies field weights (title ×3, tags ×2, body ×1), returns `{ agentId, score, matchedOn }[]`. |

Blog bodies are already parsed and cached (`lib/blog/service.ts` is `"use cache"` with `cacheLife("hours")`), so indexing post text costs nothing new at request time.

### Constants (`docs/engineering/CODING-STANDARD.md` §Constants)

```ts
/** Dice-coefficient floor for a fuzzy match to count. Tuned against the
 *  ~40-item corpus: below this, unrelated skills start scoring. */
export const FUZZY_MATCH_THRESHOLD = 0.45;

/** How a result was found — surfaced to the model so it can phrase
 *  "closest match" honestly instead of implying an exact hit. */
export const MatchKind = {
  EXACT: "EXACT",
  ALIAS: "ALIAS",
  FUZZY: "FUZZY",
} as const;
export type MatchKind = (typeof MatchKind)[keyof typeof MatchKind];
```

### Tool signature changes (`lib/chat/tools.ts`)

Add `query?: string` to `search_projects`, `search_experiences`, `search_skills`, `search_blog`. Resolution order inside each `execute()`:

1. Structured filter present (`category`, `techStack`, `tag`, `currentOnly`, `mostRecentOnly`) → existing path, unchanged.
2. `query` present → `searchDocs(query, { kind, limit: MAX_SEARCH_RESULTS })`.
3. Neither → existing default (featured / timeline / recent).

`ResourceSummary` gains one optional field:

```ts
interface ResourceSummary {
  agentId: CitationTarget;
  title: string;
  summary: string;
  rating?: number;
  /** Only set for ALIAS/FUZZY hits — lets the persona say "closest match". */
  matchedOn?: MatchKind;
}
```

**The citation pipeline needs zero changes** — `agentId` is untouched, so `normalizeCitationMarkers` and `resolveCitation` keep working exactly as they do now.

### Persona change (`lib/chat/prompt.ts`)

One paragraph under Grounding rules:

> Search results may include a `matchedOn` field. When it is `FUZZY`, the result is the closest thing in the portfolio rather than an exact match — say so ("the nearest thing is …") instead of presenting it as a direct hit.

### Also fix: `app/api/blog/search/route.ts`

Route it through `searchDocs(query, { kind: "blog" })` so the on-site blog search and the agent's blog search return the same thing. Two search implementations that disagree is a bug waiting to be demoed.

## Tests

`lib/retrieval/normalize.test.ts`
1. Happy — `"Next.js"`, `"NextJS"`, `"next js"`, `"NEXT.JS"` all normalize identically.
2. Edge — empty string and whitespace-only return `""` without throwing.

`lib/retrieval/trigram.test.ts`
3. Happy — identical strings score `1`.
4. Edge — disjoint strings score `0`, no division by zero on empty input.
5. Boundary — a string one character shorter than the trigram window (length 2) still produces a usable set.

`lib/retrieval/search.test.ts` (the important file)
6. **Reproduction (RED first)** — `searchDocs("nextjs")` returns the Next.js projects. Written *before* the implementation; it fails against today's code path.
7. Happy — `searchDocs("graphql")` returns the same three projects `filterProjectsByTechStack("GraphQL")` returns today (the existing test's expectations become the oracle).
8. Alias — `searchDocs("ts")` resolves to TypeScript, not to any string containing "ts".
9. Edge — `searchDocs("")` returns `[]`, not the whole corpus.
10. **Boundary** — a term scoring exactly `FUZZY_MATCH_THRESHOLD` is included; one scoring just below is excluded. Construct both with fixture strings, not real config values, so corpus edits don't break the test.
11. Negative — `searchDocs("cobol")` returns `[]`. This is the test that protects against over-eager fuzzy matching, and it is the one that will fail if you lower the threshold too far.

`lib/chat/tools.test.ts` — extend:
12. `search_projects({ query: "nextjs" })` returns `ResourceSummary[]` with `matchedOn: "ALIAS"` and valid `agentId`s that `resolveCitation` can resolve.
13. `search_blog({ query: "<term from a real post body>" })` returns that post — proves body indexing works.

## Pitfalls

- **False positives are worse than empty results.** An agent that cites an unrelated project is less trustworthy than one that says "nothing on that". Tune `FUZZY_MATCH_THRESHOLD` upward until test 11 passes comfortably, then leave it. Log near-threshold misses (`scope: "retrieval.near_miss"`) so you can see what visitors actually ask for.
- **Build the index at module load, not per call.** `searchDocs` runs inside the chat stream; rebuilding a 40-doc index per tool call is microseconds but it is also pointless. Module-level `const INDEX = buildIndex()`.
- **Blog bodies inflate the index.** Cap indexed body text at the first ~2000 characters per post. Full posts make trigram sets large and dilute title matches.
- **Do not reach for embeddings.** At ~40 items a vector store adds an API round trip inside your latency budget, a new secret, and a violation of the no-database constraint, for no measurable recall gain. Revisit only if the corpus passes a few hundred items.
- **`matchedOn` must not leak into the citation chip UI** — it is a model-facing hint. `AgentCitation` stays as it is.
- **Keep the enum-filter paths.** They are exact, fast, and already tested. The ladder is an addition, not a replacement; deleting `filterProjectsByTechStack` would break its existing tests for no benefit.
