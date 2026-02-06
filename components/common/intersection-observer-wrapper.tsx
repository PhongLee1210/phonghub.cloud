"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface IntersectionObserverWrapperProps extends React.PropsWithChildren {
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
  className?: string;
}

export default function IntersectionObserverWrapper({
  children,
  threshold = 0.1,
  rootMargin = "0px",
  fallback = null,
  className = "",
}: IntersectionObserverWrapperProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
}
