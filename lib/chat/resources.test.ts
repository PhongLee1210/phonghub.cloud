import { describe, expect, test } from "bun:test";

import { EXPERIENCES } from "@/config/experience";
import { PROJECTS } from "@/config/projects";
import { RESUME_RESOURCE } from "@/config/resume";
import { SKILLS } from "@/config/skills";
import { buildEntityId } from "@/lib/chat/protocol";
import { resolveCitation } from "@/lib/chat/resources";

const CONTENT_DIR = "content/blog";

describe("resolveCitation", () => {
  test("resolves a project citation from a real PROJECTS id", async () => {
    const project = PROJECTS[0];
    const citation = await resolveCitation(
      buildEntityId("project", project.id)
    );

    expect(citation).toEqual({
      id: project.id,
      type: "project",
      title: project.organization.name,
      description: project.shortDescription,
      href: `/projects/${project.id}`,
    });
  });

  test("resolves an experience citation from a real EXPERIENCES id", async () => {
    const experience = EXPERIENCES[0];
    const citation = await resolveCitation(
      buildEntityId("experience", experience.id)
    );

    expect(citation).toEqual({
      id: experience.id,
      type: "experience",
      title: experience.company,
      description: experience.description[0] ?? "",
      href: `/experience/${experience.id}`,
    });
  });

  test("resolves a skill citation from a real SKILLS id", async () => {
    const skill = SKILLS[0];
    const citation = await resolveCitation(buildEntityId("skill", skill.key));

    expect(citation).toEqual({
      id: skill.key,
      type: "skill",
      title: skill.name,
      description: skill.description,
      href: "/skills",
    });
  });

  test("resolves a blog citation from a real published post slug", async () => {
    const { listPublishedPosts } = await import("@/lib/blog/service");
    const posts = await listPublishedPosts(CONTENT_DIR);
    const post = posts[0];

    const citation = await resolveCitation(buildEntityId("blog", post.slug));

    expect(citation).toEqual({
      id: post.slug,
      type: "blog",
      title: post.title,
      description: post.summary,
      href: `/blogs/${post.slug}`,
    });
  });

  test("resolves the resume citation", async () => {
    const citation = await resolveCitation("resume");

    expect(citation).toEqual({
      id: "resume",
      type: "resume",
      title: RESUME_RESOURCE.title,
      description: RESUME_RESOURCE.description,
      href: RESUME_RESOURCE.href,
    });
  });

  test("throws for an unknown id within a known kind", async () => {
    await expect(
      resolveCitation(buildEntityId("project", "does-not-exist"))
    ).rejects.toThrow(/unknown project id/);
  });
});
