"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { type MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_PATH = "/chat-robot.glb";

function Robot({ lookDirRef }: { lookDirRef: MutableRefObject<number> }) {
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

    currentLookRef.current += (lookDirRef.current - currentLookRef.current) * 0.03;
    const lookOffset = currentLookRef.current * 0.4;

    ref.current.rotation.y = -Math.PI / 2 + lookOffset + Math.sin(t * 0.4) * 0.08;

    ref.current.rotation.z = Math.sin(t * 0.9) * 0.04;
    ref.current.rotation.x = Math.cos(t * 0.6) * 0.03;
  });

  return <primitive ref={ref} object={scene} />;
}

useGLTF.preload(MODEL_PATH);

/**
 * Image-based lighting, generated on the GPU instead of downloaded.
 *
 * drei's `<Environment preset="apartment" />` resolves to an HDR fetched from
 * `raw.githack.com/pmndrs/drei-assets` at runtime — a third-party request on
 * the critical path of the home route, for ~1 MB. The robot's material is
 * metallic (glTF `metallicFactor` defaults to 1, driven by its ORM texture),
 * so it can't simply drop to analytic lights: with nothing to reflect it
 * renders near-black. `RoomEnvironment` is three's procedural studio box, so
 * PMREM builds the same kind of lighting locally with no network at all.
 */
function ProceduralEnvironment() {
  const gl = useThree((state) => state.gl);

  // Built once per renderer. `attach` (rather than assigning scene.environment)
  // keeps the wiring declarative, so R3F detaches it on unmount and the React
  // Compiler doesn't see a mutation of the scene it treats as immutable.
  const envTarget = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    return target;
  }, [gl]);

  useEffect(() => () => envTarget.dispose(), [envTarget]);

  return <primitive object={envTarget.texture} attach="environment" />;
}

const DEFAULT_LOOK_DIR = { current: 0 };

export default function RobotScene({
  lookDirRef = DEFAULT_LOOK_DIR,
  active = true,
}: {
  lookDirRef?: MutableRefObject<number>;
  active?: boolean;
}) {
  // Combine visibility + active prop: stop render loop when tab hidden OR
  // robot is docked on non-home route. Last frame stays visible on canvas.
  const [tabVisible, setTabVisible] = useState(true);
  // Bumped to force a full Canvas remount after a lost WebGL context - a lost
  // context can't resume in place (its GL resources are gone), and without a
  // `webglcontextlost` handler the browser leaves the canvas permanently
  // blank instead of recreating it.
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const frameloop = active && tabVisible ? "always" : "never";

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
      <ProceduralEnvironment />
      <Robot lookDirRef={lookDirRef} />
    </Canvas>
  );
}
