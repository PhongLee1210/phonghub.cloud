"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { BlogPostSummary } from "@/lib/blog/service";
import { BLOG_ENTRANCE_VARIANTS } from "@/lib/motion";

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
          variants={BLOG_ENTRANCE_VARIANTS[index % 3]}
          initial="hidden"
          animate={started ? "visible" : "hidden"}
          transition={{
            delay: prefersReducedMotion ? 0 : index * 0.15,
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
