"use client";

import dynamic from "next/dynamic";

const RobotViewer = dynamic(
  () =>
    import("@/components/three/robot-viewer").then((mod) => mod.RobotViewer),
  { ssr: false },
);

export function HeroRobot({ className }: { className?: string }) {
  return <RobotViewer className={className} />;
}
