"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ResponsiveImageProps extends Omit<ImageProps, "width" | "height"> {
  aspectRatio?: "video" | "square" | "portrait" | "landscape" | "auto";
  fallbackAspectRatio?: number; // fallback aspect ratio as width/height
  className?: string;
  containerClassName?: string;
}

export default function ResponsiveImage({
  aspectRatio = "video",
  fallbackAspectRatio = 16 / 9,
  className,
  containerClassName,
  ...imageProps
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Define aspect ratio classes
  const aspectRatioClasses = {
    video: "aspect-video", // 16:9
    square: "aspect-square", // 1:1
    portrait: "aspect-[3/4]", // 3:4
    landscape: "aspect-[4/3]", // 4:3
    auto: "", // No fixed aspect ratio
  };

  return (
    <div
      className={cn(
        "relative w-full",
        aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <Image
        {...imageProps}
        fill
        className={cn(
          "transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0",
          "object-cover rounded-md border bg-muted",
          className
        )}
        onLoad={() => setImageLoaded(true)}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted rounded-md animate-pulse" />
      )}
    </div>
  );
}
