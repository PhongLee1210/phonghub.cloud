"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const ParticleConstellation = dynamic(
  () => import("@/components/three/particle-constellation"),
  { ssr: false }
);

function subscribeNoop() {
  return () => {};
}

export function HeroCanvas() {
  const reduced = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {mounted && reduced ? (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />
      ) : mounted ? (
        <ParticleConstellation />
      ) : null}
    </div>
  );
}
