import "server-only";

import fs from "fs";
import path from "path";

import {
  ContentSourceType,
  ContentVisibility,
  ResumeSectionType,
  ResumeSource,
  ResumeSourceContentItem,
} from "@/types/content";
import { resumeSourceSchema } from "./schema";

const DEFAULT_RESUME_PATH = "content/resume/resume.json";

// Sections grounded directly in real config/experience.ts + config/skills.ts
// data get full confidence; sections with no plausible source data (e.g.
// education) are synthesized placeholders and marked accordingly.
const GROUNDED_SECTIONS = new Set<ResumeSectionType>([
  "work_history",
  "skills_summary",
]);

export async function loadResumeSource(
  filePath: string = DEFAULT_RESUME_PATH
): Promise<ResumeSource> {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const raw = fs.readFileSync(absPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  return resumeSourceSchema.parse(parsed) satisfies ResumeSource;
}

export function normalizeResumeSource(
  resume: ResumeSource
): ResumeSourceContentItem[] {
  return resume.sections.map((section) => {
    const confidence = GROUNDED_SECTIONS.has(section.section) ? 1.0 : 0.5;
    const base = {
      id: `resume_source:${resume.id}:${section.section}`,
      sourceType: ContentSourceType.RESUME_SOURCE as const,
      sourceUrl: `/resume#${section.section}`,
      skillTags: [] as string[],
      visibility: ContentVisibility.PUBLIC,
      confidence,
      updatedAt: resume.lastUpdated,
      resumeSourceId: resume.id,
      section: section.section,
      relatedExperienceIds: [] as string[],
      relatedProjectIds: [] as string[],
    };

    switch (section.section) {
      case "summary":
        return {
          ...base,
          title: section.headline,
          summary: section.text,
        };
      case "work_history":
        return {
          ...base,
          title: "Work History",
          summary: section.entries
            .map((entry) => `${entry.position} at ${entry.company}`)
            .join("; "),
          relatedExperienceIds: section.entries.map(
            (entry) => entry.experienceId
          ),
        };
      case "education":
        return {
          ...base,
          title: "Education",
          summary: section.entries
            .map((entry) => `${entry.degree} in ${entry.field}, ${entry.institution}`)
            .join("; "),
        };
      case "certifications":
        return {
          ...base,
          title: "Certifications",
          summary:
            section.entries.length > 0
              ? section.entries.map((entry) => entry.name).join("; ")
              : "No certifications listed.",
        };
      case "skills_summary":
        return {
          ...base,
          title: "Skills Summary",
          summary: Object.entries(section.groups)
            .map(([group, tags]) => `${group}: ${tags.join(", ")}`)
            .join("; "),
          skillTags: Object.values(section.groups).flat(),
        };
    }
  });
}
