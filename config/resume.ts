import { pagesConfig } from "./pages";

const DEFAULT_RESUME_ROUTE = "/resume";

export interface ResumeResource {
  title: string;
  description: string;
  href: string;
}

/**
 * Resume is a single resource (not a collection), but gets its own config
 * module like PROJECTS/EXPERIENCES/SKILLS so lib/chat/resources.ts never
 * reaches for env vars or page copy directly.
 */
export const RESUME_RESOURCE: ResumeResource = {
  title: pagesConfig.resume.title,
  description: pagesConfig.resume.description,
  href: process.env.NEXT_PUBLIC_RESUME_LINK || DEFAULT_RESUME_ROUTE,
};
