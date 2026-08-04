import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { remark } from "remark";
import html from "remark-html";

export interface BlogFrontmatter {
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  summary: string;
  coverImage: string;
  status: "published" | "draft";
  agentVisible?: boolean;
  [key: string]: unknown;
}

export interface ParsedBlogPost {
  frontmatter: BlogFrontmatter;
  contentHtml: string;
  slug: string;
  filePath: string;
}

function readMarkdownFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function parseMarkdownFile(filePath: string): {
  frontmatter: BlogFrontmatter;
  content: string;
} {
  let raw = readMarkdownFile(filePath);

  raw = raw.replace(/^\s*\n/, "");

  const { data, content } = matter(raw);
  const normalized: BlogFrontmatter = {
    ...data,
    status: data.status.trim().toLowerCase(),
    tags: Array.isArray(data.tags)
      ? data.tags.map((t: any) => String(t).trim())
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim())
        : [],
    title: data.title,
    date: data.date,
    author: data.author,
    category: data.category,
    summary: data.summary,
    coverImage: data.coverImage,
    agentVisible: data.agentVisible !== false,
  };
  return {
    frontmatter: normalized,
    content,
  };
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

export async function parseBlogPost(filePath: string): Promise<ParsedBlogPost> {
  const { frontmatter, content } = parseMarkdownFile(filePath);
  const contentHtml = await markdownToHtml(content);
  const slug = getSlugFromFilePath(filePath);
  return {
    frontmatter,
    contentHtml,
    slug,
    filePath,
  };
}

function getSlugFromFilePath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}
