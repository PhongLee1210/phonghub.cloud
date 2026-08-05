"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MODEL_PATH = "/chat-robot.glb";

// lookDir: -1 = look left, 0 = look straight, 1 = look right
function Robot({ lookDir }: { lookDir: number }) {
  const { scene } = useGLTF(MODEL_PATH);
  const ref = useRef<THREE.Group>(null);
  const currentLookRef = useRef(0);

  // Self-managed, clamped time accumulator. Avoids jumps when the tab was
  // backgrounded (frameloop paused) and also smooths over dropped frames,
  // since state.clock.elapsedTime would otherwise leap by the paused interval.
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    tRef.current += Math.min(delta, 0.1);
    const t = tRef.current;

    // Vertical float — two frequencies layered
    ref.current.position.y = Math.sin(t * 1.2) * 0.06 + Math.sin(t * 2.1) * 0.015;

    // Slight horizontal drift
    ref.current.position.x = Math.sin(t * 0.7) * 0.02;

    // Smooth lerp toward target look direction
    currentLookRef.current += (lookDir - currentLookRef.current) * 0.03;
    const lookOffset = currentLookRef.current * 0.4;

    // Face forward + look toward center of screen + idle sway
    ref.current.rotation.y = -Math.PI / 2 + lookOffset + Math.sin(t * 0.4) * 0.08;

    // Subtle tilt — feels like hovering in air
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.04;
    ref.current.rotation.x = Math.cos(t * 0.6) * 0.03;
  });

  return <primitive ref={ref} object={scene} />;
}

useGLTF.preload(MODEL_PATH);

export default function RobotScene({ lookDir = 0 }: { lookDir?: number }) {
  // Pause the WebGL render loop when the tab is hidden so we don't burn GPU in
  // the background, and so returning to the tab resumes cleanly (no jump,
  // thanks to the clamped accumulator above).
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "default" }}
      camera={{ position: [0, 0.3, 3.5], fov: 30 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <Environment preset="apartment" />
      <Robot lookDir={lookDir} />
    </Canvas>
  );
}
