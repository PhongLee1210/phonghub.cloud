import { describe, expect, test } from "bun:test";

import { ResumeSource } from "@/types/content";
import { normalizeResumeSource, loadResumeSource } from "./from-resume";
import { resumeSourceSchema } from "./schema";

const resume: ResumeSource = {
  id: "resume-test",
  name: "Test Resume",
  version: "1.0.0",
  lastUpdated: "2026-01-01",
  sections: [
    { section: "summary", headline: "Engineer", text: "A summary." },
    {
      section: "work_history",
      entries: [
        {
          experienceId: "acme",
          position: "Engineer",
          company: "Acme",
          startDate: "2023-01-01",
          endDate: "Present",
          highlights: ["Did a thing."],
        },
      ],
    },
  ],
};

describe("normalizeResumeSource", () => {
  test("produces one ResumeSourceContentItem per section", () => {
    const items = normalizeResumeSource(resume);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.section)).toEqual([
      "summary",
      "work_history",
    ]);
  });

  test("assigns confidence 1.0 to work_history and 0.5 to summary", () => {
    const items = normalizeResumeSource(resume);
    const summaryItem = items.find((item) => item.section === "summary");
    const workHistoryItem = items.find(
      (item) => item.section === "work_history"
    );
    expect(summaryItem?.confidence).toBe(0.5);
    expect(workHistoryItem?.confidence).toBe(1.0);
  });

  test("collects relatedExperienceIds from work_history entries", () => {
    const items = normalizeResumeSource(resume);
    const workHistoryItem = items.find(
      (item) => item.section === "work_history"
    );
    expect(workHistoryItem?.relatedExperienceIds).toEqual(["acme"]);
  });
});

describe("resumeSourceSchema", () => {
  test("rejects a malformed resume object", () => {
    expect(() =>
      resumeSourceSchema.parse({ id: "bad", sections: "not-an-array" })
    ).toThrow();
  });
});

describe("loadResumeSource", () => {
  test("reads and validates the real content/resume/resume.json", async () => {
    const loaded = await loadResumeSource();
    expect(loaded.id).toBe("resume-main");
    expect(loaded.sections.length).toBeGreaterThan(0);
  });
});
