"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { BlogPostSummary } from "@/lib/blog/service";

const BlogCard = dynamic(() => import("@/components/blog/blog-card"));

interface AnimatedBlogGridProps {
  posts: BlogPostSummary[];
}

export default function AnimatedBlogGrid({ posts }: AnimatedBlogGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [started, setStarted] = useState(false);
  const [activeImages, setActiveImages] = useState<Record<string, boolean>>({});
  const prefersReducedMotion = useReducedMotion();

  if (inView && !started) {
    setStarted(true);
  }

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <motion.div
          key={post.slug}
          initial={{ clipPath: "inset(0 100% 0 0 round 0.5rem)" }}
          animate={
            started ? { clipPath: "inset(0 0% 0 0 round 0.5rem)" } : {}
          }
          transition={{
            duration: 0.65,
            ease: [0.16, 1, 0.3, 1],
            delay: prefersReducedMotion ? 0 : index * 0.12,
          }}
          onAnimationComplete={() =>
            setActiveImages((prev) => ({ ...prev, [post.slug]: true }))
          }
        >
          <BlogCard post={post} imageActive={activeImages[post.slug]} />
        </motion.div>
      ))}
    </div>
  );
}
