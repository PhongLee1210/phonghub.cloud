"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Icons } from "@/components/common/icons";
import AdaptiveImage from "@/components/ui/adaptive-image";
import { buttonVariants } from "@/components/ui/button";
import ChipContainer from "@/components/ui/chip-container";
import { Select, SelectOption } from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import { ParsedBlogPost } from "@/lib/blog/parser";
import { cn } from "@/lib/utils";
import { marked } from "marked";

interface BlogPostProps {
  post: ParsedBlogPost;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default function BlogPost({ post }: BlogPostProps) {
  const { frontmatter, contentHtml } = post;
  const readingTime = calculateReadingTime(contentHtml);
  const router = useRouter();

  const categoryOptions: SelectOption[] = [
    { value: "business", label: "Business" },
    { value: "technology", label: "Technology" },
    { value: "uncategorized", label: "Uncategorized" },
  ];

  const handleCategoryChange = (category: string) => {
    if (category) {
      router.push(`/blogs/category/${category}`);
    }
  };

  return (
    <article className="container relative max-w-3xl mx-auto px-4 py-6 lg:py-10">
      <Link
        href="/blogs"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4")}
      >
        <Icons.chevronLeft className="mr-2 h-4 w-4" />
        All Blogs
      </Link>

      <div>
        <time
          dateTime={new Date(frontmatter.date).toISOString()}
          className="block text-sm text-muted-foreground"
        >
          {new Date(frontmatter.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>

        <h1 className="flex items-center justify-between mt-2 font-heading text-4xl leading-tight lg:text-5xl">
          {frontmatter.title}
        </h1>

        <div className="mt-4 flex space-x-4">
          <Link
            href={siteConfig.links.github}
            className="flex items-center space-x-2 text-sm"
          >
            <Image
              src="/me.JPG"
              alt={siteConfig.authorName}
              width={42}
              height={42}
              className="rounded-full size-[42px] object-cover bg-background"
            />

            <div className="flex-1 text-left leading-tight">
              <p className="font-medium">{frontmatter.author}</p>
              <p className="text-[12px] text-muted-foreground">
                @{siteConfig.username}
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{readingTime} min read</span>
          <span>•</span>
          <div className="w-32">
            <Select
              options={categoryOptions}
              value={frontmatter.category.toLowerCase()}
              onValueChange={handleCategoryChange}
              className="h-6 text-xs border-none bg-transparent hover:bg-accent focus:ring-0"
            />
          </div>
        </div>

        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="mt-4">
            <ChipContainer textArr={frontmatter.tags} />
          </div>
        )}
      </div>

      {frontmatter.coverImage && (
        <AdaptiveImage
          src={frontmatter.coverImage}
          alt={frontmatter.title}
          containerClassName="mx-auto my-8"
          priority
        />
      )}

      <div className="mb-7">
        <section
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: marked.parseInline(contentHtml) }}
        />
      </div>

      <hr className="mt-12" />
      <div className="flex justify-center py-6">
        <Link
          href="/blogs"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          All Blogs
        </Link>
      </div>
    </article>
  );
}
