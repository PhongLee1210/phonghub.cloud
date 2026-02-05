import BlogPost from "@/components/blog/blog-post";
import { siteConfig } from "@/config/site";
import { getPostBySlug, listPublishedPosts } from "@/lib/blog/service";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await listPublishedPosts("content/blog");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug("content/blog", slug);

  if (!post || post.frontmatter.status !== "published") {
    return {
      title: "Blog Post Not Found",
    };
  }

  const { frontmatter } = post;
  const publishedTime = new Date(frontmatter.date).toISOString();
  const modifiedTime = publishedTime;

  const description =
    frontmatter.summary ||
    post.contentHtml
      .replace(/<[^>]*>/g, "")
      .substring(0, 160)
      .trim() + "...";

  const ogImage = frontmatter.coverImage || siteConfig.ogImage;
  const canonicalUrl = `${siteConfig.url}/blogs/${slug}`;

  return {
    title: `${frontmatter.title} | Blog`,
    description,
    authors: [{ name: frontmatter.author }],
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      ...siteConfig.keywords,
      ...(frontmatter.tags || []),
      frontmatter.category,
      "blog",
      "article",
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: frontmatter.title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [frontmatter.author],
      tags: frontmatter.tags ? frontmatter.tags : [],
      section: frontmatter.category,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description,
      images: [ogImage],
      creator: `@${siteConfig.username}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug("content/blog", slug);

  if (!post || post.frontmatter.status !== "published") {
    notFound();
  }

  return (
    <main className="container mx-auto p-4">
      <BlogPost post={post} />
    </main>
  );
}

export const dynamic = "force-static";
export const revalidate = 3600;
