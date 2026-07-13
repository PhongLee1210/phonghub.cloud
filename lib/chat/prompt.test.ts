import { describe, expect, test } from "bun:test";

import { isAllowedRoute } from "./prompt";

describe("isAllowedRoute", () => {
  test("static allowed routes pass", () => {
    for (const route of ["/skills", "/projects", "/experience", "/blogs", "/list100"]) {
      expect(isAllowedRoute(route)).toBe(true);
    }
  });

  test("parameterized project route passes", () => {
    expect(isAllowedRoute("/projects/enrollment-platform")).toBe(true);
  });

  test("parameterized blog route passes", () => {
    expect(isAllowedRoute("/blogs/general-post")).toBe(true);
  });

  test("non-allowed route rejected", () => {
    expect(isAllowedRoute("/admin")).toBe(false);
    expect(isAllowedRoute("/projects/")).toBe(false);
    expect(isAllowedRoute("https://evil.com")).toBe(false);
  });
});
