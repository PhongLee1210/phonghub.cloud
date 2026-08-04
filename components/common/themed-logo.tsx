"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

interface ThemedLogoProps {
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function ThemedLogo({ alt, width, height, className, priority }: ThemedLogoProps) {
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "light"
      ? "/logo/phonghub-grayscale.png"
      : "/logo/phonghub.png";

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
