"use client";

import { DraggableCollage } from "@/components/home/draggable-collage";
import { PolaroidCard } from "@/components/home/polaroid-card";
import { collageItems } from "@/config/home";

export const PhotoCollage = () => {
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
      <div className="mt-8 flex justify-center px-6 md:block lg:hidden">
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

      {/* Mobile: horizontal snap carousel */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 pt-8 md:hidden">
        {collageItems.map((item, index) => (
          <div key={item.src} className="w-[180px] flex-shrink-0 snap-start">
            <PolaroidCard
              src={item.src}
              caption={item.caption}
              rotate={0}
              delay={index * 0.05}
            />
          </div>
        ))}
      </div>
    </>
  );
};
