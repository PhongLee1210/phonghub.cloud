"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

const ParticleConstellation = dynamic(
  () => import("@/components/three/particle-constellation"),
  { ssr: false }
);

export function HeroCanvas() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-50">
      {reduced ? (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />
      ) : (
        <ParticleConstellation />
      )}
    </div>
  );
}
