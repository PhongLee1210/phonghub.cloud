import { BlogPostSummary, listPublishedPosts } from "@/lib/blog/service";
import { blogDocsFrom, rankDocs } from "@/lib/retrieval/search";
import { NextRequest, NextResponse } from "next/server";

/** Matches the agent's own blog search cap, so both surfaces behave alike. */
const MAX_RESULTS = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (!query) {
    return NextResponse.json({ posts: [] });
  }

  const posts: BlogPostSummary[] = await listPublishedPosts("content/blog");

  // Shares the ranker with search_blog rather than doing its own substring
  // match on title and summary. Two search implementations that disagree is a
  // bug waiting to be demoed: the visitor types a term in the blog search box,
  // gets nothing, then asks the assistant the same thing and gets a post.
  const hits = rankDocs(blogDocsFrom(posts), query, MAX_RESULTS);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const ranked = hits.flatMap((hit) => {
    const post = bySlug.get(hit.agentId.slice("blog:".length));
    return post ? [post] : [];
  });

  return NextResponse.json({ posts: ranked });
}
