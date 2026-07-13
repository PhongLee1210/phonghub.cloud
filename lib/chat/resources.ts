import "server-only";

import { RESUME_RESOURCE } from "@/config/resume";
import { EXPERIENCES } from "@/config/experience";
import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import { getPostBySlug } from "@/lib/blog/service";
import { parseEntityId } from "@/lib/chat/protocol";
import { AgentCitation, AgentEntityId } from "@/types/chat";

const CONTENT_DIR = "content/blog";

/** resolveCitation's input — every addressable entity id, plus the resume
 * singleton, which has no id space of its own (see CitationKind). */
export type CitationTarget = AgentEntityId | "resume";

/**
 * Resolves any citable resource to the shape the client renders as a
 * citation chip. Pure lookup over existing config/blog data — no caching,
 * no side effects. Throws on an unknown id so a bad tool-call/highlight
 * argument fails loudly instead of rendering a broken chip.
 */
export async function resolveCitation(
  target: CitationTarget
): Promise<AgentCitation> {
  if (target === "resume") {
    return {
      id: "resume",
      type: "resume",
      title: RESUME_RESOURCE.title,
      href: RESUME_RESOURCE.href,
    };
  }

  const parsed = parseEntityId(target);
  if (!parsed) {
    throw new Error(`resolveCitation: malformed entity id "${target}"`);
  }

  switch (parsed.kind) {
    case "project": {
      const project = PROJECTS.find((p) => p.id === parsed.id);
      if (!project) {
        throw new Error(`resolveCitation: unknown project id "${parsed.id}"`);
      }
      return {
        id: project.id,
        type: "project",
        title: project.organization.name,
        href: `/projects/${project.id}`,
      };
    }

    case "experience": {
      const experience = EXPERIENCES.find((e) => e.id === parsed.id);
      if (!experience) {
        throw new Error(
          `resolveCitation: unknown experience id "${parsed.id}"`
        );
      }
      return {
        id: experience.id,
        type: "experience",
        title: experience.company,
        href: `/experience/${experience.id}`,
      };
    }

    case "skill": {
      const skill = SKILLS.find((s) => s.key === parsed.id);
      if (!skill) {
        throw new Error(`resolveCitation: unknown skill id "${parsed.id}"`);
      }
      // Skills have no per-skill detail page — /skills is the whole list.
      return {
        id: skill.key,
        type: "skill",
        title: skill.name,
        href: "/skills",
      };
    }

    case "blog": {
      const post = await getPostBySlug(CONTENT_DIR, parsed.id);
      if (!post) {
        throw new Error(`resolveCitation: unknown blog slug "${parsed.id}"`);
      }
      return {
        id: post.slug,
        type: "blog",
        title: post.frontmatter.title,
        href: `/blogs/${post.slug}`,
      };
    }
  }
}
