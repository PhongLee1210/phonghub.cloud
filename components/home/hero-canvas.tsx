"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ParticleConstellation = dynamic(
  () => import("@/components/three/particle-constellation"),
  { ssr: false }
);

export function HeroCanvas() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showParticles = mounted && !reduced;
  const showFallback = mounted && reduced;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-50"
    >
      {showFallback ? (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />
      ) : showParticles ? (
        <ParticleConstellation />
      ) : null}
    </div>
  );
}
