import { describe, expect, test } from "bun:test";

import { EXPERIENCES } from "@/config/experience";
import {
  findCurrentCompany,
  findMostRecentExperience,
  getCareerTimeline,
  getPreviousCompanies,
} from "./experience";

describe("findMostRecentExperience", () => {
  test("returns the current (Present) role over past roles", () => {
    const result = findMostRecentExperience();
    expect(result.id).toBe("hiliosai");
    expect(result.endDate).toBe("Present");
  });
});

describe("getCareerTimeline", () => {
  test("returns all experiences ordered most-recent first", () => {
    const result = getCareerTimeline();
    expect(result.map((e) => e.id)).toEqual(["hiliosai", "ltv", "fpt-telecom"]);
    expect(result).toHaveLength(EXPERIENCES.length);
  });
});

describe("findCurrentCompany", () => {
  test("returns the experience with endDate 'Present'", () => {
    const result = findCurrentCompany();
    expect(result?.id).toBe("hiliosai");
  });
});

describe("getPreviousCompanies", () => {
  test("returns every experience that has ended", () => {
    const result = getPreviousCompanies();
    expect(result.map((e) => e.id).sort()).toEqual(["fpt-telecom", "ltv"]);
    expect(result.every((e) => e.endDate !== "Present")).toBe(true);
  });
});
