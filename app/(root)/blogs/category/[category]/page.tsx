import BlogList from "@/components/blog/blog-list";
import PageContainer from "@/components/common/page-container";
import { BlogPostSummary, filterPostsByCategory } from "@/lib/blog/service";
import { notFound } from "next/navigation";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const posts: BlogPostSummary[] = await filterPostsByCategory(
    "content/blog",
    category
  );

  if (!posts.length) {
    notFound();
  }

  return (
    <PageContainer title={`Category: ${category.replace(/-/g, " ")}`}>
      <BlogList posts={posts} />
    </PageContainer>
  );
}

export const dynamic = "force-static";
export const revalidate = 3600;
