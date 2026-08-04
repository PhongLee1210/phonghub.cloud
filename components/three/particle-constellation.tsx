"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_DESKTOP = 150;
const PARTICLE_COUNT_MOBILE = 80;
const CONNECTION_THRESHOLD = 2.2;
const CONNECTION_OPACITY = 0.12;
const CURSOR_ATTRACT_STRENGTH = 0.3;
const DRIFT_SPEED = 0.15;

const VERTEX_SHADER = `
  uniform vec2 uCursorPos;
  uniform float uTime;
  attribute float aSize;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * ${DRIFT_SPEED} + aPhase) * 0.15;
    pos.y += cos(uTime * ${DRIFT_SPEED} * 0.8 + aPhase * 1.3) * 0.12;
    vec2 toCursor = uCursorPos * 4.0 - pos.xy;
    float dist = length(toCursor);
    float attract = smoothstep(3.0, 0.0, dist) * ${CURSOR_ATTRACT_STRENGTH};
    pos.xy += normalize(toCursor + 0.001) * attract;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vAlpha = smoothstep(6.0, 0.0, dist) * 0.5 + 0.35;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacityScale;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, d) * vAlpha * uOpacityScale;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const DEFAULT_COLOR = new THREE.Color(0.5, 0.5, 0.7);

const UNIFORMS = {
  uCursorPos: { value: new THREE.Vector2(0, 0) },
  uTime: { value: 0 },
  uColor: { value: DEFAULT_COLOR.clone() },
  uOpacityScale: { value: 0.35 },
};

const SHADER_MATERIAL = new THREE.ShaderMaterial({
  vertexShader: VERTEX_SHADER,
  fragmentShader: FRAGMENT_SHADER,
  uniforms: UNIFORMS,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const LINE_MATERIAL = new THREE.LineBasicMaterial({
  color: DEFAULT_COLOR.clone(),
  transparent: true,
  opacity: CONNECTION_OPACITY,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

function generateParticleData(count: number) {
  const pos = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  const ph = new Float32Array(count);
  const base = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (seededRandom(i * 6 + 1) - 0.5) * 8;
    const y = (seededRandom(i * 6 + 2) - 0.5) * 6;
    const z = (seededRandom(i * 6 + 3) - 0.5) * 3 - 2;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    base[i * 3] = x;
    base[i * 3 + 1] = y;
    base[i * 3 + 2] = z;
    sz[i] = seededRandom(i * 6 + 4) * 3 + 1.5;
    ph[i] = seededRandom(i * 6 + 5) * Math.PI * 2;
  }
  return { positions: pos, sizes: sz, phases: ph, basePositions: base };
}

function getThemeColor(): THREE.Color {
  if (typeof document === "undefined") return DEFAULT_COLOR.clone();
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue("--primary").trim();
  if (!primary) return DEFAULT_COLOR.clone();
  const el = document.createElement("div");
  el.style.color = `hsl(${primary})`;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return DEFAULT_COLOR.clone();
  return new THREE.Color(+match[0] / 255, +match[1] / 255, +match[2] / 255);
}

// Pre-generate data outside component to avoid Math.random in render
const DESKTOP_DATA = generateParticleData(PARTICLE_COUNT_DESKTOP);
const MOBILE_DATA = generateParticleData(PARTICLE_COUNT_MOBILE);

function Particles({ count }: { count: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { gl, invalidate } = useThree();
  const cursorRef = useRef(new THREE.Vector2(0, 0));

  const data = count <= PARTICLE_COUNT_MOBILE ? MOBILE_DATA : DESKTOP_DATA;

  // Line geometry managed via ref for mutable Three.js objects
  const lineGeoRef = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const maxLines = count * 3;
    const posArray = new Float32Array(maxLines * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geo.setDrawRange(0, 0);
    lineGeoRef.current = geo;

    if (linesRef.current) {
      linesRef.current.geometry = geo;
    }

    return () => {
      geo.dispose();
    };
  }, [count]);

  // R3F's unmountComponentAtNode schedules gl.forceContextLoss() on a 500 ms
  // timer. In React Strict Mode (default in Next.js dev), the simulated
  // unmount fires this timer, which kills the WebGL context of the
  // still-mounted canvas ~500 ms later — leaving a blank canvas.
  // Intercept the loss event, restore the context, and invalidate so Three.js
  // re-uploads all resources and renders again.
  useEffect(() => {
    const canvas = gl.domElement;
    const ctx = gl.getContext() as WebGLRenderingContext | null;
    const loseExt = ctx?.getExtension("WEBGL_lose_context") as
      | { restoreContext: () => void }
      | null;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (loseExt) {
        setTimeout(() => {
          try {
            loseExt.restoreContext();
          } catch {
            // May throw if already restored — safe to ignore
          }
        }, 200);
      }
    };

    const handleContextRestored = () => {
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl, invalidate]);

  useFrame((state) => {
    if (!meshRef.current) return;

    UNIFORMS.uTime.value = state.clock.elapsedTime;
    UNIFORMS.uCursorPos.value.copy(cursorRef.current);

    const geo = lineGeoRef.current;
    if (linesRef.current && geo) {
      const linePos = geo.attributes.position.array as Float32Array;
      let lineIdx = 0;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < count; i++) {
        const ix = data.basePositions[i * 3] + Math.sin(time * DRIFT_SPEED + data.phases[i]) * 0.15;
        const iy = data.basePositions[i * 3 + 1] + Math.cos(time * DRIFT_SPEED * 0.8 + data.phases[i] * 1.3) * 0.12;
        const iz = data.basePositions[i * 3 + 2];

        for (let j = i + 1; j < count; j++) {
          const jx = data.basePositions[j * 3] + Math.sin(time * DRIFT_SPEED + data.phases[j]) * 0.15;
          const jy = data.basePositions[j * 3 + 1] + Math.cos(time * DRIFT_SPEED * 0.8 + data.phases[j] * 1.3) * 0.12;
          const jz = data.basePositions[j * 3 + 2];

          const dx = ix - jx;
          const dy = iy - jy;
          const dz = iz - jz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECTION_THRESHOLD && lineIdx < linePos.length - 5) {
            linePos[lineIdx++] = ix;
            linePos[lineIdx++] = iy;
            linePos[lineIdx++] = iz;
            linePos[lineIdx++] = jx;
            linePos[lineIdx++] = jy;
            linePos[lineIdx++] = jz;
          }
        }
      }

      geo.setDrawRange(0, lineIdx / 3);
      geo.attributes.position.needsUpdate = true;
    }
  });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      cursorRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      invalidate();
    };
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      cursorRef.current.set(
        (t.clientX / window.innerWidth) * 2 - 1,
        -(t.clientY / window.innerHeight) * 2 + 1
      );
      invalidate();
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
    };
  }, [invalidate]);

  useEffect(() => {
    const themeColor = getThemeColor();
    UNIFORMS.uColor.value.copy(themeColor);
    LINE_MATERIAL.color.copy(themeColor);

    const observer = new MutationObserver(() => {
      const newColor = getThemeColor();
      UNIFORMS.uColor.value.copy(newColor);
      LINE_MATERIAL.color.copy(newColor);
      invalidate();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => observer.disconnect();
  }, [invalidate]);

  return (
    <>
      <points ref={meshRef} material={SHADER_MATERIAL}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[data.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[data.phases, 1]}
          />
        </bufferGeometry>
      </points>
      <lineSegments ref={linesRef} material={LINE_MATERIAL} />
    </>
  );
}

function canWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function subscribeNoop() {
  return () => {};
}

let cachedClientConfig: { supported: boolean; mobile: boolean } | null = null;

// useSyncExternalStore requires getSnapshot to return a referentially stable
// value when nothing has changed, or React re-renders in an infinite loop.
function getClientConfig() {
  const next = { supported: canWebGL(), mobile: window.innerWidth < 768 };
  if (
    cachedClientConfig &&
    cachedClientConfig.supported === next.supported &&
    cachedClientConfig.mobile === next.mobile
  ) {
    return cachedClientConfig;
  }
  cachedClientConfig = next;
  return next;
}

const SERVER_CONFIG = { supported: false, mobile: false };

export default function ParticleConstellation() {
  const config = useSyncExternalStore(subscribeNoop, getClientConfig, () => SERVER_CONFIG);

  if (!config.supported) return null;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <Particles count={config.mobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP} />
    </Canvas>
  );
}
