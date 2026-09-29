import { describe, expect, test } from "bun:test";

import { normalizeTerm, resolveAlias } from "./normalize";

describe("normalizeTerm", () => {
  test("folds the spellings a visitor actually types for one skill", () => {
    // Reproduction: "Next.js" only matched when the model echoed the config's
    // exact casing and punctuation. These are all the same skill.
    const forms = ["Next.js", "NextJS", "next js", "NEXT.JS", " next.js "];
    const normalized = forms.map(normalizeTerm);
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("nextjs");
  });

  test("strips separators without merging distinct terms", () => {
    expect(normalizeTerm("CI/CD")).toBe("cicd");
    expect(normalizeTerm("Tailwind CSS")).toBe("tailwindcss");
    // Distinct skills must not collapse into each other.
    expect(normalizeTerm("React")).not.toBe(normalizeTerm("React Native"));
  });

  test("empty and separator-only input normalize to an empty string", () => {
    expect(normalizeTerm("")).toBe("");
    expect(normalizeTerm("   ")).toBe("");
    expect(normalizeTerm("-./ _")).toBe("");
  });

  test("drops parenthetical qualifiers so the bare name still matches", () => {
    // config/skills.ts carries "Artificial Intelligence (AI)".
    expect(normalizeTerm("Artificial Intelligence (AI)")).toBe(
      "artificialintelligenceai"
    );
  });
});

describe("resolveAlias", () => {
  test("maps a shorthand to its canonical skill name", () => {
    expect(resolveAlias("ts")).toBe("TypeScript");
    expect(resolveAlias("postgres")).toBe("PostgreSQL");
    expect(resolveAlias("gql")).toBe("GraphQL");
  });

  test("is case and punctuation insensitive", () => {
    expect(resolveAlias("  TS  ")).toBe("TypeScript");
    expect(resolveAlias("Node")).toBe("Node.js");
  });

  test("returns undefined for an unknown term", () => {
    expect(resolveAlias("cobol")).toBeUndefined();
    expect(resolveAlias("")).toBeUndefined();
  });

  test("every alias target is a real skill name", () => {
    // Guards against a typo in the alias table silently producing a target
    // that can never match anything in the corpus.
    const { SKILL_ALIASES } = require("./normalize") as {
      SKILL_ALIASES: Record<string, string>;
    };
    const { skillsUnsorted } = require("@/config/skills") as {
      skillsUnsorted: ReadonlyArray<{ name: string }>;
    };
    const names = new Set(skillsUnsorted.map((s) => s.name));
    const orphans = Object.entries(SKILL_ALIASES)
      .filter(([, target]) => !names.has(target))
      .map(([alias, target]) => `${alias} -> ${target}`);
    expect(orphans).toEqual([]);
  });
});
