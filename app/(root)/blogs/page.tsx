import BlogList from "@/components/blog/blog-list";
import PageContainer from "@/components/common/page-container";
import { pagesConfig } from "@/config/pages";
import { BlogPostSummary, listPublishedPosts } from "@/lib/blog/service";

export default async function BlogPage() {
  const posts: BlogPostSummary[] = await listPublishedPosts("content/blog");

  return (
    <PageContainer
      title={pagesConfig.blogs.title}
      description={pagesConfig.blogs.description}
    >
      <BlogList posts={posts} />
    </PageContainer>
  );
}
