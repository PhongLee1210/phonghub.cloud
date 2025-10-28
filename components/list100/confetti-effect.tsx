"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  vx: number;
  vy: number;
}

const confettiColors = [
  "#fbbf24", // amber
  "#f87171", // red
  "#60a5fa", // blue
  "#34d399", // emerald
  "#a78bfa", // violet
  "#fb7185", // rose
  "#fcd34d", // yellow
  "#6ee7b7", // teal
];

export function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          size: Math.random() * 8 + 4,
          duration: Math.random() * 1500 + 1000,
          delay: Math.random() * 200,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 20 - 10,
          color:
            confettiColors[Math.floor(Math.random() * confettiColors.length)],
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 4 + 4,
        });
      }
      return particles;
    };

    particlesRef.current = createParticles();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        const progress = Math.max(
          0,
          (elapsed - particle.delay) / particle.duration
        );

        if (progress >= 1) return false;

        const x = particle.x + particle.vx * progress * 60;
        const y = particle.y + particle.vy * progress * 60;
        const rotation =
          particle.rotation + particle.rotationSpeed * progress * 60;
        const opacity = 1 - progress;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);

        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

        ctx.restore();

        return true;
      });

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
