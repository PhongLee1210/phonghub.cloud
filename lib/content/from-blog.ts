import "server-only";

import { ISkill, SKILLS } from "@/config/skills";
import { BlogPostSummary, listPublishedPosts } from "@/lib/blog/service";
import { BlogContentItem } from "@/types/content";
import { findSkillByName } from "./from-project";

/**
 * skillTags is the best-effort intersection of the post's frontmatter tags
 * with known ISkill names (case-insensitive) — non-matching tags are kept
 * in `tags` but dropped from `skillTags`, since skillTags is meant to be a
 * canonical, cross-referenceable set.
 */
export function normalizeBlogPost(
  post: BlogPostSummary,
  skills: ISkill[]
): BlogContentItem {
  const skillTags = post.tags
    .map((tag) => findSkillByName(tag, skills))
    .filter((skill): skill is ISkill => Boolean(skill))
    .map((skill) => skill.key);

  return {
    id: `blog:${post.slug}`,
    title: post.title,
    sourceType: "blog",
    sourceUrl: `/blogs/${post.slug}`,
    skillTags,
    visibility: post.status === "published" ? "public" : "private",
    confidence: 1.0,
    updatedAt: new Date(post.date).toISOString(),
    summary: post.summary,
    blogPostId: post.slug,
    category: post.category,
    tags: post.tags,
    author: post.author,
    status: post.status,
    coverImage: post.coverImage,
  };
}

export async function normalizeBlogPosts(
  contentDir: string = "content/blog"
): Promise<BlogContentItem[]> {
  const posts = await listPublishedPosts(contentDir);
  return posts.map((post) => normalizeBlogPost(post, SKILLS));
}
