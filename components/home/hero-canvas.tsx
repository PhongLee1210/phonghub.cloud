"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";

import { useMounted } from "@/hooks/use-mounted";

const ParticleConstellation = dynamic(
  () => import("@/components/three/particle-constellation"),
  { ssr: false }
);

export function HeroCanvas() {
  const reduced = useReducedMotion();
  const mounted = useMounted();

  const showParticles = mounted && !reduced;
  const showFallback = mounted && reduced;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-50"
      style={{ willChange: "transform" }}
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
