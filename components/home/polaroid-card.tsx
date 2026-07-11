"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface PolaroidCardProps {
  src: string;
  caption: string;
  rotate: number;
  className?: string;
  delay?: number;
}

export const PolaroidCard = ({
  src,
  caption,
  rotate,
  className,
  delay = 0,
}: PolaroidCardProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.98, rotate }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      className={cn(
        "rounded-2xl border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={src}
          alt={caption}
          fill
          sizes="(min-width: 640px) 200px, 160px"
          className="object-cover"
        />
      </div>
      <figcaption className="pt-2 text-center text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
