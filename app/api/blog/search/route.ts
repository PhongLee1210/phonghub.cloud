import { BlogPostSummary, listPublishedPosts } from "@/lib/blog/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  if (!query) {
    return NextResponse.json({ posts: [] });
  }

  const posts: BlogPostSummary[] = await listPublishedPosts("content/blog");

  const filtered = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(query) ||
      post.summary.toLowerCase().includes(query)
  );

  return NextResponse.json({ posts: filtered });
}
