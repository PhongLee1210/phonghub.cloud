import { SkillCategoryEnum } from "@/config/skills";
import { ValidCategory, ValidExpType, ValidSkills } from "@/config/constants";

export type ProjectId = string;
/** Canonical form matches ISkill.key (e.g. "nextjs"), not ISkill.name ("Next.js"). */
export type SkillTag = string;
export type ExperienceId = string;
export type ResumeSourceId = string;
export type BlogPostId = string;
/** Namespaced and globally unique: `${sourceType}:${localId}`, e.g. "project:gymintelops". */
export type ContentItemId = string;
/** `${ContentSourceType}:${ContentItemId}`, used to trace an agent citation back to its source item. */
export type CitationId = string;

export type ContentSourceType =
  | "project"
  | "skill"
  | "experience"
  | "resume_source"
  | "blog"
  // Reserved for future sources — not implemented yet.
  | "github_activity"
  | "manual";

export type ContentVisibility = "public" | "unlisted" | "private";

/** Confidence in this item's derivation: 1.0 for data taken verbatim from an authoritative config source, lower for anything synthesized/inferred. */
export type ContentConfidence = number;

export interface ContentItemBase {
  id: ContentItemId;
  title: string;
  sourceType: ContentSourceType;
  /** Deep link into the site for this item, e.g. "/projects/gymintelops". */
  sourceUrl: string;
  projectId?: ProjectId;
  skillTags: SkillTag[];
  visibility: ContentVisibility;
  confidence: ContentConfidence;
  /** ISO 8601. */
  updatedAt: string;
  summary: string;
}

export interface ProjectContentItem extends ContentItemBase {
  sourceType: "project";
  projectId: ProjectId;
  companyName: string;
  category: ValidCategory[];
  techStack: ValidSkills[];
  type: ValidExpType;
  startDate: string;
  endDate: string | null;
  websiteLink?: string;
  githubLink?: string;
}

export interface SkillContentItem extends ContentItemBase {
  sourceType: "skill";
  skillKey: string;
  category: SkillCategoryEnum;
  rating: number;
}

export interface ExperienceContentItem extends ContentItemBase {
  sourceType: "experience";
  experienceId: ExperienceId;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | "Present";
  achievements: string[];
  companyUrl?: string;
}

export type ResumeSectionType =
  | "summary"
  | "work_history"
  | "education"
  | "certifications"
  | "skills_summary";

export interface ResumeSummarySection {
  section: "summary";
  headline: string;
  text: string;
}

export interface ResumeWorkHistoryEntry {
  experienceId: ExperienceId;
  position: string;
  company: string;
  startDate: string;
  endDate: string | "Present";
  highlights: string[];
}

export interface ResumeWorkHistorySection {
  section: "work_history";
  entries: ResumeWorkHistoryEntry[];
}

export interface ResumeEducationEntry {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number | "Present";
  location?: string;
}

export interface ResumeEducationSection {
  section: "education";
  entries: ResumeEducationEntry[];
}

export interface ResumeCertificationEntry {
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface ResumeCertificationsSection {
  section: "certifications";
  entries: ResumeCertificationEntry[];
}

export interface ResumeSkillsSummarySection {
  section: "skills_summary";
  /** Keyed by SkillCategoryEnum value; values are SkillTag (ISkill.key) arrays. */
  groups: Record<string, SkillTag[]>;
}

export type ResumeSection =
  | ResumeSummarySection
  | ResumeWorkHistorySection
  | ResumeEducationSection
  | ResumeCertificationsSection
  | ResumeSkillsSummarySection;

export interface ResumeSource {
  id: ResumeSourceId;
  name: string;
  version: string;
  /** ISO date. */
  lastUpdated: string;
  contactLocation?: string;
  externalUrl?: string;
  pdfUrl?: string;
  sections: ResumeSection[];
}

export interface ResumeSourceContentItem extends ContentItemBase {
  sourceType: "resume_source";
  resumeSourceId: ResumeSourceId;
  section: ResumeSectionType;
  relatedExperienceIds: ExperienceId[];
  relatedProjectIds: ProjectId[];
}

export interface BlogContentItem extends ContentItemBase {
  sourceType: "blog";
  blogPostId: BlogPostId;
  category: string;
  tags: string[];
  author: string;
  status: "published" | "draft";
  coverImage: string;
}

export type ContentItem =
  | ProjectContentItem
  | SkillContentItem
  | ExperienceContentItem
  | ResumeSourceContentItem
  | BlogContentItem;
