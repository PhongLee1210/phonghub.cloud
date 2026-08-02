import { describe, expect, it } from "bun:test";
import { normalizeCitationMarkers } from "./citation-postprocess";
import { CitationTarget } from "@/types/chat";

function targets(...ids: CitationTarget[]): Set<CitationTarget> {
  return new Set(ids);
}

describe("normalizeCitationMarkers", () => {
  it("replaces agentId markers with sequential numbers", () => {
    const known = targets("skill:react", "project:foo");
    const result = normalizeCitationMarkers(
      "Built with React [skill:react] and Foo [project:foo].",
      known
    );
    expect(result.normalizedText).toBe("Built with React [1] and Foo [2].");
    expect(result.orderedTargets).toEqual(["skill:react", "project:foo"]);
  });

  it("reuses same number for repeated marker", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers(
      "React [skill:react] is great. More React [skill:react].",
      known
    );
    expect(result.normalizedText).toBe("React [1] is great. More React [1].");
    expect(result.orderedTargets).toEqual(["skill:react"]);
  });

  it("preserves first-mention order", () => {
    const known = targets("project:foo", "skill:react");
    const result = normalizeCitationMarkers(
      "[project:foo] then [skill:react] then [project:foo]",
      known
    );
    expect(result.normalizedText).toBe("[1] then [2] then [1]");
    expect(result.orderedTargets).toEqual(["project:foo", "skill:react"]);
  });

  it("strips unknown markers not in knownTargets", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers(
      "Known [skill:react] and unknown [project:nope].",
      known
    );
    expect(result.normalizedText).toBe("Known [1] and unknown .");
    expect(result.orderedTargets).toEqual(["skill:react"]);
  });

  it("returns text unchanged when no agentId markers present", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers("No markers here.", known);
    expect(result.normalizedText).toBe("No markers here.");
    expect(result.orderedTargets).toEqual([]);
  });

  it("returns text unchanged when only numeric markers present (fallback)", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers(
      "Old style [1] and [2].",
      known
    );
    expect(result.normalizedText).toBe("Old style [1] and [2].");
    expect(result.orderedTargets).toEqual([]);
  });

  it("handles [resume] marker", () => {
    const known = targets("resume", "skill:react");
    const result = normalizeCitationMarkers(
      "Check resume [resume] and React [skill:react].",
      known
    );
    expect(result.normalizedText).toBe("Check resume [1] and React [2].");
    expect(result.orderedTargets).toEqual(["resume", "skill:react"]);
  });

  it("ignores agentId markers when only numerics used (mixed scenario)", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers(
      "Numeric [1] only, no agentId.",
      known
    );
    expect(result.normalizedText).toBe("Numeric [1] only, no agentId.");
    expect(result.orderedTargets).toEqual([]);
  });

  it("handles multiple entity kinds", () => {
    const known = targets(
      "project:foo",
      "skill:react",
      "experience:bar",
      "blog:my-post"
    );
    const result = normalizeCitationMarkers(
      "[experience:bar] then [blog:my-post] then [project:foo] then [skill:react]",
      known
    );
    expect(result.normalizedText).toBe("[1] then [2] then [3] then [4]");
    expect(result.orderedTargets).toEqual([
      "experience:bar",
      "blog:my-post",
      "project:foo",
      "skill:react",
    ]);
  });

  it("handles empty text", () => {
    const known = targets("skill:react");
    const result = normalizeCitationMarkers("", known);
    expect(result.normalizedText).toBe("");
    expect(result.orderedTargets).toEqual([]);
  });

  it("handles empty knownTargets — falls back unchanged", () => {
    const known = targets();
    const result = normalizeCitationMarkers(
      "Text with [skill:react] marker.",
      known
    );
    expect(result.normalizedText).toBe("Text with [skill:react] marker.");
    expect(result.orderedTargets).toEqual([]);
  });
});
