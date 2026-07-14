import { describe, expect, test } from "bun:test";

import { project } from "./physics";

describe("project()", () => {
  test("positive velocity projects forward", () => {
    expect(project(500)).toBeGreaterThan(0);
  });

  test("negative velocity projects backward", () => {
    expect(project(-500)).toBeLessThan(0);
  });

  test("zero velocity → zero projection", () => {
    expect(project(0)).toBe(0);
  });

  test("higher velocity → greater projection distance", () => {
    expect(Math.abs(project(1000))).toBeGreaterThan(Math.abs(project(500)));
  });
});
