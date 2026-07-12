import { useCallback, useMemo, type CSSProperties } from "react";
import {
  useMotionValue,
  useTransform,
  useVelocity,
  type HTMLMotionProps,
  type MotionValue,
} from "framer-motion";

import { useDraggableCollage } from "@/components/home/draggable-collage";

export interface UsePhysicsDragOptions {
  /** Unique id used for z-index stacking within the collage. */
  id: number | string;
  /** Resting rotation the card returns to when no velocity is applied. */
  baseRotate: number;
  /** Max degrees the card tilts (added on top of baseRotate) while moving. */
  tilt?: number;
  /** Master switch — when false the element behaves like a static card. */
  enabled?: boolean;
  /** Momentum amplifier on release (framer-motion `dragTransition.power`). */
  power?: number;
  /** Friction decay time-constant in ms — higher glides further. */
  timeConstant?: number;
  /** How far a card may overshoot the bounds before springing back. */
  elastic?: number;
}

export interface PhysicsDragResult {
  /** Motion values to spread into `style` (all GPU-accelerated transforms). */
  style: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    rotate: MotionValue<number>;
    /** Inline override applied only when this card is on top. */
    zIndex: number | undefined;
    touchAction: CSSProperties["touchAction"];
  };
  /** Props to spread onto a `motion.*` element. Empty when disabled. */
  dragProps: Partial<HTMLMotionProps<"figure">>;
  /** True when this card sits on top of the stack. */
  isFront: boolean;
  /** True when another card is engaged — use to softly recede this one. */
  isDimmed: boolean;
}

/**
 * Reusable, provider-driven physics drag for any card living inside a
 * `<DraggableCollage>`.
 *
 * Uses framer-motion's native pointer drag (lowest-latency, 1:1 cursor
 * follow) layered with:
 *  - velocity-driven rotation tilt (feels like a real object being thrown),
 *  - momentum + friction on release (`dragMomentum` + `dragTransition`),
 *  - elastic spring-back at the collage boundary,
 *  - z-index stacking so the grabbed card is always brought to the front.
 *
 * Everything animates through `transform` (translate3d / rotate / scale) so
 * the compositor handles it — no layout thrash, 60 FPS.
 */
export function usePhysicsDrag({
  id,
  baseRotate,
  tilt = 14,
  enabled = true,
  power = 0.32,
  timeConstant = 360,
  elastic = 0.12,
}: UsePhysicsDragOptions): PhysicsDragResult {
  const collage = useDraggableCollage();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Horizontal velocity → rotational tilt. Symmetric, clamped, decays to the
  // resting angle the moment the card stops moving.
  const xVelocity = useVelocity(x);
  const rotate = useTransform(
    xVelocity,
    [-1200, 1200],
    [baseRotate - tilt, baseRotate + tilt],
    { clamp: true },
  );

  const isFront = collage?.topId === id;
  const isDimmed = collage?.topId !== undefined && collage?.topId !== id;
  // Only override z-index for the front card; resting cards keep their
  // authored stack order (Tailwind z-* classes) so the composition is intact.
  const zIndex = isFront ? 60 : undefined;

  const onDragStart = useCallback(() => {
    collage?.bringToFront(id);
  }, [collage, id]);

  const dragProps = useMemo<PhysicsDragResult["dragProps"]>(
    () =>
      enabled
        ? {
            drag: true,
            dragMomentum: true,
            dragElastic: elastic,
            dragConstraints: collage?.boundsRef ?? false,
            dragTransition: {
              power,
              timeConstant,
              bounceStiffness: 440,
              bounceDamping: 30,
            },
            onDragStart,
            whileDrag: {
              scale: 1.06,
              zIndex: 60,
              cursor: "grabbing",
            },
          }
        : {},
    [enabled, elastic, collage, power, timeConstant, onDragStart],
  );

  return {
    style: { x, y, rotate, zIndex, touchAction: "none" },
    dragProps,
    isFront,
    isDimmed,
  };
}
