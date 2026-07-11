"use client";

import { PolaroidCard } from "@/components/home/polaroid-card";
import { collageItems } from "@/config/home";

export const PhotoCollage = () => {
  return (
    <div className="relative">
      <div className="relative mx-auto hidden h-[560px] w-full max-w-[420px] md:block">
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

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:hidden">
        {collageItems.map((item, index) => (
          <div key={item.src} className="w-36 flex-shrink-0 snap-start">
            <PolaroidCard
              src={item.src}
              caption={item.caption}
              rotate={0}
              delay={index * 0.05}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
