import { BlogPostSummary } from "@/lib/blog/service";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPostSummary;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group block rounded-[var(--radius)] bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-200 border border-border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Read blog post: ${post.title}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={false}
        />
        <span className="absolute top-4 left-4 inline-flex items-center rounded-full border border-border/80 bg-primary/80 px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
          {post.category}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-200">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {post.summary}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{new Date(post.date).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(post.tags || []).map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full border border-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
