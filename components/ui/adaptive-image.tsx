"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

interface AdaptiveImageProps extends Omit<ImageProps, "width" | "height"> {
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  maxWidth?: string;
}

export default function AdaptiveImage({
  className,
  containerClassName,
  loadingClassName,
  maxWidth = "max-w-3xl",
  ...imageProps
}: AdaptiveImageProps) {
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
