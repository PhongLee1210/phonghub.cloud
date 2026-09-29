import { describe, expect, test } from "bun:test";

import { similarity, trigrams } from "./trigram";

describe("trigrams", () => {
  test("splits into overlapping three-character windows", () => {
    expect(Array.from(trigrams("react")).sort()).toEqual(["act", "eac", "rea"]);
  });

  test("a string shorter than the window still yields one gram", () => {
    // Boundary: two-character terms ("ts", "js") are exactly the case the
    // alias table exists for, but the ranker must not divide by zero if one
    // reaches the fuzzy stage.
    expect(trigrams("ts").size).toBe(1);
    expect(trigrams("a").size).toBe(1);
  });

  test("an empty string yields no grams", () => {
    expect(trigrams("").size).toBe(0);
  });
});

describe("similarity", () => {
  test("identical strings score 1", () => {
    expect(similarity("graphql", "graphql")).toBe(1);
  });

  test("a near miss scores high, an unrelated term scores low", () => {
    const near = similarity("postgre", "postgresql");
    const unrelated = similarity("cobol", "postgresql");
    expect(near).toBeGreaterThan(0.5);
    expect(unrelated).toBeLessThan(0.2);
    expect(near).toBeGreaterThan(unrelated);
  });

  test("disjoint strings score 0 without dividing by zero", () => {
    expect(similarity("abc", "xyz")).toBe(0);
  });

  test("an empty operand scores 0 rather than NaN", () => {
    expect(similarity("", "react")).toBe(0);
    expect(similarity("react", "")).toBe(0);
    expect(similarity("", "")).toBe(0);
  });

  test("is symmetric", () => {
    expect(similarity("nextjs", "nestjs")).toBe(similarity("nestjs", "nextjs"));
  });
});
