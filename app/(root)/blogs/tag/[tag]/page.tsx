import BlogList from "@/components/blog/blog-list";
import PageContainer from "@/components/common/page-container";
import { BlogPostSummary, filterPostsByTag, listTags } from "@/lib/blog/service";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const tags = await listTags("content/blog");
  return tags.map((tag) => ({ tag }));
}

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
