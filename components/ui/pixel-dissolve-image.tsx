"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface PixelDissolveImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  cellSize?: number;
  dissolveMs?: number;
  startDelay?: number;
  /**
   * When provided: true = start dissolve, false = hold (draw pixels but wait).
   * When undefined: useInView controls the trigger.
   */
  active?: boolean;
}

export default function PixelDissolveImage({
  src,
  alt,
  fill,
  sizes,
  className,
  cellSize = 14,
  dissolveMs = 800,
  startDelay = 100,
  active,
}: PixelDissolveImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const [dissolved, setDissolved] = useState(false);

  useEffect(() => {
    if (dissolved) return;

    // If active prop is provided, use it as sole trigger.
    // Otherwise fall back to useInView.
    const shouldDissolve = active !== undefined ? active : inView;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const totalCells = cols * rows;

    // Always draw pixel grid so it is ready when card becomes visible
    const palette = [
      "#09090b",
      "#18181b",
      "#27272a",
      "#3f3f46",
      "#52525b",
      "#0f172a",
      "#1e293b",
      "#0c0a09",
    ];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, w, h);
      const t = setTimeout(() => setDissolved(true), 0);
      return () => clearTimeout(t);
    }

    if (!shouldDissolve) return;

    // Scanline sweep: cursor moves top→bottom, revealing image above, glow at edge
    let rafId: number;
    let startTs: number | null = null;

    const step = (now: number) => {
      if (startTs === null) startTs = now;
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / dissolveMs, 1);
      const sweepY = progress * h;
      const clearedH = Math.floor(sweepY / cellSize) * cellSize;

      // Reveal rows above cursor
      if (clearedH > 0) ctx.clearRect(0, 0, w, clearedH);

      // Scan glow at cursor
      if (progress < 1) {
        const glowTop = Math.max(0, clearedH - 18);
        const glowEnd = clearedH + 4;
        const grad = ctx.createLinearGradient(0, glowTop, 0, glowEnd);
        grad.addColorStop(0, "rgba(0,255,128,0)");
        grad.addColorStop(0.8, "rgba(0,255,128,0.45)");
        grad.addColorStop(1, "rgba(0,255,128,0.18)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, glowTop, w, glowEnd - glowTop);
        rafId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, w, h);
        setDissolved(true);
      }
    };

    const timerId = setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
    };
  }, [
    active,
    inView,
    cellSize,
    dissolveMs,
    startDelay,
    prefersReducedMotion,
    dissolved,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Image
        className={className}
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        loading="lazy"
      />
      {!dissolved && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 pointer-events-none"
          aria-hidden
        />
      )}
    </div>
  );
}
