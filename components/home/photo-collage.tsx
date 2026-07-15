"use client";

import {
  animate,
  motion,
  PanInfo,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { useRef } from "react";

import { DraggableCollage } from "@/components/home/draggable-collage";
import { PolaroidCard } from "@/components/home/polaroid-card";
import { collageItems } from "@/config/home";
import { project } from "@/lib/physics";

export { project } from "@/lib/physics";

const CARD_WIDTH = 160;
const GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + GAP;
const N = collageItems.length;
// Clone 3× so there's always content on both sides
const loopedItems = [...collageItems, ...collageItems, ...collageItems];
// Starting offset = first item of center clone
const LOOP_OFFSET = N * ITEM_WIDTH;

export const PhotoCollage = () => {
  const x = useMotionValue(-LOOP_OFFSET);
  const isDragging = useRef(false);

  // During drag only: teleport to center-clone equivalent when crossing clone bounds.
  // Items look identical, so the jump is invisible.
  useMotionValueEvent(x, "change", (latest) => {
    if (!isDragging.current) return;
    if (latest > -ITEM_WIDTH) {
      x.set(latest - LOOP_OFFSET);
    } else if (latest < -(LOOP_OFFSET * 2 - ITEM_WIDTH)) {
      x.set(latest + LOOP_OFFSET);
    }
  });

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    isDragging.current = false;

    const currentX = x.get();
    const projected = currentX + project(info.velocity.x);
    const targetIndex = Math.round(
      Math.max(0, Math.min(loopedItems.length - 1, -projected / ITEM_WIDTH))
    );

    animate(x, -(targetIndex * ITEM_WIDTH), {
      type: "spring",
      velocity: info.velocity.x,
      damping: 28,
      stiffness: 180,
    });
  };

  return (
    <>
      {/* Desktop: absolutely centered, physics-draggable canvas */}
      <DraggableCollage className="absolute left-[62%] top-[50%] hidden h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 lg:block">
        {collageItems.map((item, index) => (
          <PolaroidCard
            key={item.src}
            id={index}
            draggable
            src={item.src}
            caption={item.caption}
            rotate={item.rotate}
            className={item.className}
            delay={index * 0.07}
          />
        ))}
      </DraggableCollage>

      {/* Tablet (md): centered below hero text, scaled down */}
      <div className="mt-8 hidden justify-center px-6 md:flex lg:hidden">
        <div className="relative h-[504px] w-[455px] overflow-hidden">
          <div className="absolute left-0 top-0 h-[720px] w-[650px] origin-top-left scale-[0.7]">
            {collageItems.map((item, index) => (
              <PolaroidCard
                key={item.src}
                src={item.src}
                caption={item.caption}
                rotate={item.rotate}
                className={item.className}
                delay={index * 0.07}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: infinite momentum snap carousel */}
      <div
        role="region"
        aria-label="Photo gallery"
        aria-roledescription="carousel"
        className="overflow-hidden px-5 pb-2 pt-8 md:hidden"
      >
        <motion.div
          className="flex cursor-grab gap-3 active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -(LOOP_OFFSET * 3), right: LOOP_OFFSET }}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {loopedItems.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              role="group"
              aria-label={`Photo ${(index % N) + 1} of ${N}`}
              aria-roledescription="slide"
              className="w-[160px] flex-shrink-0"
            >
              <PolaroidCard
                src={item.src}
                caption={item.caption}
                rotate={0}
                delay={(index % N) * 0.05}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
};
