import "server-only";

import { z } from "zod";

/**
 * Structural mirror of types/content.ts's ResumeSource/ResumeSection —
 * validated at the content/resume/resume.json file boundary. Not derived
 * from (or the source of) the hand-written interfaces; the two are kept in
 * sync manually, matching how BlogFrontmatter and its ad-hoc validation in
 * lib/blog/parser.ts already coexist.
 */

const resumeSummarySectionSchema = z.object({
  section: z.literal("summary"),
  headline: z.string(),
  text: z.string(),
});

const resumeWorkHistoryEntrySchema = z.object({
  experienceId: z.string(),
  position: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.union([z.string(), z.literal("Present")]),
  highlights: z.array(z.string()),
});

const resumeWorkHistorySectionSchema = z.object({
  section: z.literal("work_history"),
  entries: z.array(resumeWorkHistoryEntrySchema),
});

const resumeEducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startYear: z.number(),
  endYear: z.union([z.number(), z.literal("Present")]),
  location: z.string().optional(),
});

const resumeEducationSectionSchema = z.object({
  section: z.literal("education"),
  entries: z.array(resumeEducationEntrySchema),
});

const resumeCertificationEntrySchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  credentialUrl: z.string().optional(),
});

const resumeCertificationsSectionSchema = z.object({
  section: z.literal("certifications"),
  entries: z.array(resumeCertificationEntrySchema),
});

const resumeSkillsSummarySectionSchema = z.object({
  section: z.literal("skills_summary"),
  groups: z.record(z.string(), z.array(z.string())),
});

const resumeSectionSchema = z.discriminatedUnion("section", [
  resumeSummarySectionSchema,
  resumeWorkHistorySectionSchema,
  resumeEducationSectionSchema,
  resumeCertificationsSectionSchema,
  resumeSkillsSummarySectionSchema,
]);

export const resumeSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  lastUpdated: z.string(),
  contactLocation: z.string().optional(),
  externalUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  sections: z.array(resumeSectionSchema),
});
