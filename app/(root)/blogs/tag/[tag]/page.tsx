import BlogList from "@/components/blog/blog-list";
import PageContainer from "@/components/common/page-container";
import { BlogPostSummary, filterPostsByTag } from "@/lib/blog/service";
import { notFound } from "next/navigation";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts: BlogPostSummary[] = await filterPostsByTag("content/blog", tag);

  if (!posts.length) {
    notFound();
  }

  return (
    <PageContainer title={`Tag: ${tag.replace(/-/g, " ")}`}>
      <BlogList posts={posts} />
    </PageContainer>
  );
}

export const dynamic = "force-static";
export const revalidate = 3600;
