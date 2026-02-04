"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

/** Map of maxWidth class to approximate pixel width for `sizes` (helps Next.js pick optimal resolution). */
const MAX_WIDTH_TO_SIZES: Record<string, string> = {
  "max-w-sm": "(max-width: 384px) 100vw, 384px",
  "max-w-md": "(max-width: 448px) 100vw, 448px",
  "max-w-lg": "(max-width: 512px) 100vw, 512px",
  "max-w-xl": "(max-width: 576px) 100vw, 576px",
  "max-w-2xl": "(max-width: 672px) 100vw, 672px",
  "max-w-3xl": "(max-width: 768px) 100vw, 768px",
  "max-w-4xl": "(max-width: 896px) 100vw, 896px",
  "max-w-5xl": "(max-width: 1024px) 100vw, 1024px",
  "max-w-6xl": "(max-width: 1152px) 100vw, 1152px",
  "max-w-7xl": "(max-width: 1280px) 100vw, 1280px",
};

interface AdaptiveImageProps extends Omit<ImageProps, "width" | "height"> {
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  maxWidth?: string;
  /** Hint for Next.js Image optimization; derived from maxWidth if not set. */
  sizes?: string;
}

export default function AdaptiveImage({
  className,
  containerClassName,
  loadingClassName,
  maxWidth = "max-w-3xl",
  sizes,
  ...imageProps
}: AdaptiveImageProps) {
  const resolvedSizes =
    sizes ?? MAX_WIDTH_TO_SIZES[maxWidth] ?? "(max-width: 768px) 100vw, 768px";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Preload image to get dimensions
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setImageLoaded(true);
    };
    img.src = imageProps.src as string;
  }, [imageProps.src]);

  // Calculate aspect ratio and determine optimal layout
  const aspectRatio =
    imageDimensions.width && imageDimensions.height
      ? imageDimensions.width / imageDimensions.height
      : 16 / 9; // fallback

  const isWide = aspectRatio > 1.5; // Consider wide if ratio > 1.5:1
  const isTall = aspectRatio < 0.8; // Consider tall if ratio < 0.8:1
  const isSquare = !isWide && !isTall;

  // Determine optimal aspect ratio class based on image dimensions
  const getOptimalAspectRatio = () => {
    if (isWide) return "aspect-[21/9]"; // Ultra-wide
    if (isSquare) return "aspect-square";
    if (isTall) return "aspect-[3/4]"; // Portrait
    return "aspect-video"; // Standard landscape
  };

  return (
    <div
      className={cn(
        "relative w-full",
        maxWidth,
        getOptimalAspectRatio(),
        containerClassName
      )}
    >
      <Image
        {...imageProps}
        fill
        sizes={resolvedSizes}
        className={cn(
          "transition-all duration-500 ease-in-out",
          imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          "object-cover rounded-md border bg-muted",
          className
        )}
        onLoad={() => setImageLoaded(true)}
      />
      {!imageLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-muted rounded-md animate-pulse",
            loadingClassName
          )}
        />
      )}
    </div>
  );
}
