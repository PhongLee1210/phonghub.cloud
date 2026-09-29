import { describe, expect, test } from "bun:test";

import { filterProjectsByTechStack } from "@/lib/data/projects";
import {
  FUZZY_MATCH_THRESHOLD,
  MatchKind,
  passesThreshold,
  rankDocs,
  searchDocs,
  type SearchDoc,
} from "./search";

function doc(partial: Partial<SearchDoc> & { title: string }): SearchDoc {
  return {
    agentId: `skill:${partial.title.toLowerCase()}`,
    kind: "skill",
    tags: [],
    body: "",
    ...partial,
  } as SearchDoc;
}

describe("searchDocs — the failure this layer exists to fix", () => {
  test("a spelling the config does not use still finds the work", () => {
    // Reproduction: filterProjectsByTechStack("nextjs") is an exact enum
    // compare against "Next.js", so it returned nothing and the assistant
    // said Phong had no Next.js work.
    const hits = searchDocs("nextjs", { kind: "project" });
    expect(hits.length).toBeGreaterThan(0);

    const viaEnum = filterProjectsByTechStack("Next.js").map(
      (p) => `project:${p.id}` as const
    );
    expect([...hits.map((h) => h.agentId)].sort()).toEqual([...viaEnum].sort());
  });

  test("agrees with the exact enum filter it replaces", () => {
    const hits = searchDocs("graphql", { kind: "project" });
    const viaEnum = filterProjectsByTechStack("GraphQL").map(
      (p) => `project:${p.id}` as const
    );
    expect([...hits.map((h) => h.agentId)].sort()).toEqual([...viaEnum].sort());
  });

  test("a shorthand resolves through the alias table", () => {
    const hits = searchDocs("ts", { kind: "skill" });
    const typescript = hits.find((h) => h.agentId === "skill:typescript");
    expect(typescript).toBeDefined();
    expect(typescript!.matchedOn).toBe(MatchKind.ALIAS);
  });

  test("an unrelated term returns nothing rather than a loose guess", () => {
    // The guard against over-eager fuzzy matching. If the threshold is ever
    // lowered too far, this is the test that fails — and a confidently wrong
    // citation is worse for a visitor than an honest "nothing on that".
    expect(searchDocs("cobol")).toEqual([]);
    expect(searchDocs("haskell")).toEqual([]);
  });

  test("an empty query returns nothing rather than the whole corpus", () => {
    expect(searchDocs("")).toEqual([]);
    expect(searchDocs("   ")).toEqual([]);
  });

  test("honours the kind filter and the limit", () => {
    const hits = searchDocs("react", { kind: "skill", limit: 2 });
    expect(hits.length).toBeLessThanOrEqual(2);
    expect(hits.every((h) => h.kind === "skill")).toBe(true);
  });
});

describe("rankDocs", () => {
  const CORPUS: SearchDoc[] = [
    doc({ title: "GraphQL", tags: ["api"], body: "Query language for APIs." }),
    doc({
      title: "Prisma",
      tags: ["ORM", "PostgreSQL"],
      body: "Type-safe database access.",
    }),
    doc({
      title: "Deployment notes",
      kind: "blog",
      agentId: "blog:deployment-notes",
      tags: [],
      body: "Covers rollbacks and blue-green cutovers on Vercel.",
    }),
  ];

  test("an exact title match outranks everything and is labelled EXACT", () => {
    const [top] = rankDocs(CORPUS, "GraphQL", 5);
    expect(top.agentId).toBe("skill:graphql");
    expect(top.matchedOn).toBe(MatchKind.EXACT);
    expect(top.score).toBe(1);
  });

  test("a tag match counts, not just the title", () => {
    const hits = rankDocs(CORPUS, "postgresql", 5);
    expect(hits.map((h) => h.agentId)).toContain("skill:prisma");
  });

  test("a term found only in the body still matches, ranked lower", () => {
    const hits = rankDocs(CORPUS, "rollbacks", 5);
    expect(hits.map((h) => h.agentId)).toContain("blog:deployment-notes");
    const hit = hits.find((h) => h.agentId === "blog:deployment-notes")!;
    expect(hit.matchedOn).toBe(MatchKind.FUZZY);
    expect(hit.score).toBeLessThan(1);
  });

  test("results come back ordered by score, best first", () => {
    const hits = rankDocs(CORPUS, "postgresql", 5);
    const scores = hits.map((h) => h.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  test("a one-character query does not match by substring", () => {
    // Edge: single letters appear inside almost every term, so allowing
    // substring matching there would return the entire corpus.
    const hits = rankDocs(CORPUS, "a", 5);
    expect(hits).toEqual([]);
  });

  test("respects the limit", () => {
    expect(rankDocs(CORPUS, "postgresql", 1).length).toBeLessThanOrEqual(1);
  });
});

describe("passesThreshold", () => {
  test("a score exactly at the threshold is kept", () => {
    // Boundary: the comparison must be >=, not >. A term landing precisely on
    // the cutoff is the best of the matches we are willing to show.
    expect(passesThreshold(FUZZY_MATCH_THRESHOLD)).toBe(true);
  });

  test("a score just below the threshold is dropped", () => {
    expect(passesThreshold(FUZZY_MATCH_THRESHOLD - Number.EPSILON)).toBe(false);
    expect(passesThreshold(0)).toBe(false);
  });
});
