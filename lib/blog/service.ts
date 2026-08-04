"use cache";

import fs from "fs";
import path from "path";
import { cacheLife } from "next/cache";
import { parseBlogPost, ParsedBlogPost } from "./parser";

export interface BlogPostSummary {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  summary: string;
  coverImage: string;
  status: "published" | "draft";
}

function findMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findMarkdownFiles(fullPath);
    }
    if (entry.isFile() && fullPath.endsWith(".md")) {
      return [fullPath];
    }
    return [];
  });
}

export async function getAllBlogPosts(
  contentDir: string
): Promise<ParsedBlogPost[]> {
  cacheLife("hours");

  const absContentDir = path.isAbsolute(contentDir)
    ? contentDir
    : path.join(process.cwd(), contentDir);

  if (!fs.existsSync(absContentDir)) {
    throw new Error(
      `[Blog] Content directory not found: ${absContentDir}. ` +
        `Please ensure your markdown files are in the correct location.`
    );
  }
  const files = findMarkdownFiles(absContentDir);

  const posts = await Promise.all(files.map(parseBlogPost));
  return posts;
}

export async function listPublishedPosts(
  contentDir: string,
  opts?: { forAgent?: boolean }
): Promise<BlogPostSummary[]> {
  const posts = await getAllBlogPosts(contentDir);
  const publishedPosts = posts
    .filter((post) => post.frontmatter.status === "published")
    .filter((post) => !opts?.forAgent || post.frontmatter.agentVisible !== false)
    .map(toPostSummary)
    .sort((a, b) => b.date.localeCompare(a.date));

  return publishedPosts;
}

export async function getPostBySlug(
  contentDir: string,
  slug: string
): Promise<ParsedBlogPost | undefined> {
  const posts = await getAllBlogPosts(contentDir);
  return posts.find((post) => post.slug === slug);
}

export async function listCategories(contentDir: string): Promise<string[]> {
  const posts = await getAllBlogPosts(contentDir);
  const categories = new Set(posts.map((post) => post.frontmatter.category));
  return Array.from(categories).sort();
}

export async function listTags(contentDir: string): Promise<string[]> {
  const posts = await getAllBlogPosts(contentDir);
  const tags = new Set<string>();
  posts.forEach((post) => {
    (post.frontmatter.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export async function filterPostsByCategory(
  contentDir: string,
  category: string
): Promise<BlogPostSummary[]> {
  const posts = await getAllBlogPosts(contentDir);
  return posts
    .filter(
      (post) =>
        post.frontmatter.category.toLowerCase() === category.toLowerCase() &&
        post.frontmatter.status === "published"
    )
    .map(toPostSummary)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function filterPostsByTag(
  contentDir: string,
  tag: string
): Promise<BlogPostSummary[]> {
  const posts = await getAllBlogPosts(contentDir);
  return posts
    .filter(
      (post) =>
        (post.frontmatter.tags || []).includes(tag) &&
        post.frontmatter.status === "published"
    )
    .map(toPostSummary)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function toPostSummary(post: ParsedBlogPost): BlogPostSummary {
  const { slug, frontmatter } = post;
  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    author: frontmatter.author,
    category: frontmatter.category,
    tags: frontmatter.tags,
    summary: frontmatter.summary,
    coverImage: frontmatter.coverImage,
    status: frontmatter.status,
  };
}
