"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MODEL_PATH = "/chat-robot.glb";

function Robot({ lookDir }: { lookDir: number }) {
  const { scene } = useGLTF(MODEL_PATH);
  const ref = useRef<THREE.Group>(null);
  const currentLookRef = useRef(0);

  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    tRef.current += Math.min(delta, 0.1);
    const t = tRef.current;

    ref.current.position.y = Math.sin(t * 1.2) * 0.06 + Math.sin(t * 2.1) * 0.015;

    ref.current.position.x = Math.sin(t * 0.7) * 0.02;

    currentLookRef.current += (lookDir - currentLookRef.current) * 0.03;
    const lookOffset = currentLookRef.current * 0.4;

    ref.current.rotation.y = -Math.PI / 2 + lookOffset + Math.sin(t * 0.4) * 0.08;

    ref.current.rotation.z = Math.sin(t * 0.9) * 0.04;
    ref.current.rotation.x = Math.cos(t * 0.6) * 0.03;
  });

  return <primitive ref={ref} object={scene} />;
}

useGLTF.preload(MODEL_PATH);

export default function RobotScene({ lookDir = 0 }: { lookDir?: number }) {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  // Bumped to force a full Canvas remount after a lost WebGL context - a lost
  // context can't resume in place (its GL resources are gone), and without a
  // `webglcontextlost` handler the browser leaves the canvas permanently
  // blank instead of recreating it.
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      key={canvasKey}
      frameloop={frameloop}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "default" }}
      camera={{ position: [0, 0.3, 3.5], fov: 30 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            setCanvasKey((k) => k + 1);
          },
          { once: true },
        );
      }}
    >
      <Environment preset="apartment" />
      <Robot lookDir={lookDir} />
    </Canvas>
  );
}
