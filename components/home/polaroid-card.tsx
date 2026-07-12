"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { usePhysicsDrag } from "@/hooks/use-physics-drag";
import { cn } from "@/lib/utils";

interface PolaroidCardProps {
  src: string;
  caption: string;
  rotate: number;
  className?: string;
  delay?: number;
  /**
   * Enable physics-based dragging. Requires the card to be rendered inside a
   * `<DraggableCollage>` boundary. Tablet/mobile layouts keep this off.
   */
  draggable?: boolean;
  /** Stable id used for z-index stacking within the collage. */
  id?: number | string;
}

export const PolaroidCard = ({
  src,
  caption,
  rotate,
  className,
  delay = 0,
  draggable = false,
  id,
}: PolaroidCardProps) => {
  const reducedMotion = useReducedMotion();

  const {
    style: dragStyle,
    dragProps,
    isDimmed,
  } = usePhysicsDrag({
    id: id ?? src,
    baseRotate: rotate,
    enabled: draggable,
  });

  // When another card is grabbed, softly recede this one for depth.
  const dim = draggable && isDimmed;

  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: dim ? 0.85 : 1,
        scale: dim ? 0.97 : 1,
        ...(draggable ? {} : { rotate }),
      }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reducedMotion || draggable ? undefined : { y: -2 }}
      style={draggable ? dragStyle : undefined}
      {...dragProps}
      className={cn(
        "w-[220px] rounded-[22px] bg-card p-[12px] shadow-sm",
        draggable && "cursor-grab touch-none select-none",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[16px] bg-muted">
        <Image
          src={src}
          alt={caption}
          fill
          sizes="220px"
          draggable={false}
          className="pointer-events-none object-cover"
        />
      </div>
      <figcaption className="pt-2 text-center text-[13px] text-[#6e6e78]">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
