// components/blog/blog-list.tsx
"use client";
import { BlogPostSummary } from "@/lib/blog/service";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BlogCard from "./blog-card";
import BlogFilters from "./blog-filters";

/**
 * Props for BlogList component.
 */
interface BlogListProps {
  posts: BlogPostSummary[];
}

/**
 * BlogList component: displays a grid of blog posts with comprehensive filtering.
 */
export default function BlogList({ posts }: BlogListProps) {
  const prefersReducedMotion = useReducedMotion();
  const [filters, setFilters] = useState({
    category: "",
    tag: "",
    search: "",
  });
  const [activeImages, setActiveImages] = useState<Record<string, boolean>>({});

  // Filter posts based on all filter criteria
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        !filters.category || post.category === filters.category;
      const matchesTag =
        !filters.tag || (post.tags || []).includes(filters.tag);
      const matchesSearch =
        !filters.search ||
        post.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        post.summary.toLowerCase().includes(filters.search.toLowerCase()) ||
        (post.tags || []).some((tag) =>
          tag.toLowerCase().includes(filters.search.toLowerCase())
        );
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [posts, filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setActiveImages({});
  };

  return (
    <section>
      <BlogFilters posts={posts} filters={filters} onChange={handleFilterChange} />

      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-32 h-32 mb-6">
            <div className="rounded-full shadow-lg opacity-80 bg-muted w-full h-full flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-foreground">
            No blog posts found
          </h3>
          <p className="text-base text-muted-foreground mb-4 text-center">
            Try adjusting your filters or check back soon for new content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ clipPath: "inset(0 100% 0 0 round 0.5rem)" }}
              animate={{ clipPath: "inset(0 0% 0 0 round 0.5rem)" }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                delay: prefersReducedMotion ? 0 : index * 0.08,
              }}
              onAnimationComplete={() =>
                setActiveImages((prev) => ({ ...prev, [post.slug]: true }))
              }
            >
              <BlogCard post={post} imageActive={activeImages[post.slug]} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
