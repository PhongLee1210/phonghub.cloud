import { describe, expect, test } from "bun:test";

import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { BlogPostSummary } from "@/lib/blog/service";
import { ContentVisibility } from "@/types/content";
import { normalizeBlogPost } from "./from-blog";

const skills: ISkill[] = [
  {
    key: "react",
    name: "React",
    description: "",
    rating: 5,
    icon: "react",
    category: SkillCategoryEnum.FRONTEND,
  },
];

const basePost: BlogPostSummary = {
  slug: "my-post",
  title: "My Post",
  date: "2026-01-01",
  author: "Phong",
  category: "Technology",
  tags: ["React", "SomeUnknownTag"],
  summary: "A post about things.",
  coverImage: "https://example.com/cover.jpg",
  status: "published",
};

describe("normalizeBlogPost", () => {
  test("namespaces the id and derives sourceUrl", () => {
    const item = normalizeBlogPost(basePost, skills);
    expect(item.id).toBe("blog:my-post");
    expect(item.blogPostId).toBe("my-post");
    expect(item.sourceUrl).toBe("/blogs/my-post");
  });

  test("derives visibility from status", () => {
    expect(normalizeBlogPost(basePost, skills).visibility).toBe(
      ContentVisibility.PUBLIC
    );
    expect(
      normalizeBlogPost({ ...basePost, status: "draft" }, skills).visibility
    ).toBe(ContentVisibility.PRIVATE);
  });

  test("intersects tags with known skills, dropping unmatched tags from skillTags", () => {
    const item = normalizeBlogPost(basePost, skills);
    expect(item.skillTags).toEqual(["react"]);
    expect(item.tags).toEqual(["React", "SomeUnknownTag"]);
  });
});
