import { describe, expect, test } from "bun:test";

import {
  anchorPoint,
  clampRectIntoViewport,
  offscreenDirection,
  tiltFromPointer,
  type RectLike,
} from "./geometry";

const VIEWPORT = { width: 1440, height: 900 };

function rect(
  left: number,
  top: number,
  width: number,
  height: number
): RectLike {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

/** A citation chip inside the desktop chat panel, bottom-right of the viewport. */
const CHIP_IN_PANEL = rect(1140, 700, 120, 24);

describe("anchorPoint", () => {
  test("curves away from the chat panel rather than through it", () => {
    // Reproduction: a naive straight midpoint control point runs the connector
    // back across the panel the chip lives in, which reads as a line drawn on
    // top of the conversation.
    const target = rect(1100, 200, 300, 180);
    const result = anchorPoint(CHIP_IN_PANEL, target, VIEWPORT);

    expect(result).not.toBeNull();
    const midX = (result!.from.x + result!.to.x) / 2;
    // Chip sits in the right half, so the bow must head left, away from panel.
    expect(result!.control.x).toBeLessThan(midX);
  });

  test("lands on the target's centre and leaves from the chip's edge", () => {
    const target = rect(400, 300, 200, 100);
    const result = anchorPoint(CHIP_IN_PANEL, target, VIEWPORT)!;

    expect(result.to).toEqual({ x: 500, y: 350 });
    // `from` is on the chip's boundary, never inside it.
    const onEdge =
      result.from.x === CHIP_IN_PANEL.left ||
      result.from.x === CHIP_IN_PANEL.right ||
      result.from.y === CHIP_IN_PANEL.top ||
      result.from.y === CHIP_IN_PANEL.bottom;
    expect(onEdge).toBe(true);
  });

  test("returns null for a zero-area target", () => {
    // An element that exists but isn't laid out (display:none ancestor,
    // collapsed container). Without this guard the midpoint math divides by
    // zero and the SVG path renders as NaN, which silently kills the overlay.
    const collapsed = rect(500, 400, 0, 0);
    expect(anchorPoint(CHIP_IN_PANEL, collapsed, VIEWPORT)).toBeNull();
  });

  test("never produces a non-finite coordinate", () => {
    const target = rect(0, 0, 1, 1);
    const result = anchorPoint(CHIP_IN_PANEL, target, VIEWPORT)!;
    const coords = [
      result.from.x,
      result.from.y,
      result.to.x,
      result.to.y,
      result.control.x,
      result.control.y,
    ];
    expect(coords.every(Number.isFinite)).toBe(true);
  });
});

describe("offscreenDirection", () => {
  test("returns null for a target fully inside the viewport", () => {
    expect(offscreenDirection(rect(400, 300, 200, 100), VIEWPORT)).toBeNull();
  });

  test("flush with the bottom edge still counts as visible", () => {
    // Boundary: bottom === viewport.height is the last visible pixel row.
    const flush = rect(400, 800, 200, 100);
    expect(flush.bottom).toBe(VIEWPORT.height);
    expect(offscreenDirection(flush, VIEWPORT)).toBeNull();
  });

  test("one pixel past the bottom edge counts as below", () => {
    expect(offscreenDirection(rect(400, 801, 200, 100), VIEWPORT)).toBe("down");
  });

  test("detects a target above the viewport", () => {
    expect(offscreenDirection(rect(400, -200, 200, 100), VIEWPORT)).toBe("up");
  });

  test("vertical displacement wins over horizontal", () => {
    // A target both above and to the left reads as "scroll up" to a visitor —
    // the page only scrolls vertically, so that is the actionable direction.
    expect(offscreenDirection(rect(-300, -400, 200, 100), VIEWPORT)).toBe("up");
  });
});

describe("tiltFromPointer", () => {
  const CARD = rect(100, 100, 200, 120);
  const MAX_DEG = 8;

  test("a pointer at the centre produces no tilt", () => {
    expect(tiltFromPointer({ x: 200, y: 160 }, CARD, MAX_DEG)).toEqual({
      rotateX: 0,
      rotateY: 0,
    });
  });

  test("tilts toward the pointer", () => {
    const right = tiltFromPointer({ x: 300, y: 160 }, CARD, MAX_DEG);
    expect(right.rotateY).toBeGreaterThan(0);

    const above = tiltFromPointer({ x: 200, y: 100 }, CARD, MAX_DEG);
    expect(above.rotateX).toBeGreaterThan(0);
  });

  test("a pointer at a corner clamps to exactly the maximum", () => {
    // Boundary: the corner is the extreme of the valid range, so it must land
    // on maxDeg precisely rather than overshooting by a rounding step.
    const corner = tiltFromPointer(
      { x: CARD.right, y: CARD.top },
      CARD,
      MAX_DEG
    );
    expect(corner.rotateY).toBe(MAX_DEG);
    expect(corner.rotateX).toBe(MAX_DEG);
  });

  test("a pointer outside the card does not exceed the maximum", () => {
    const far = tiltFromPointer({ x: 5000, y: -5000 }, CARD, MAX_DEG);
    expect(far.rotateY).toBe(MAX_DEG);
    expect(far.rotateX).toBe(MAX_DEG);
  });

  test("a zero-area card yields no tilt instead of NaN", () => {
    const collapsed = rect(100, 100, 0, 0);
    expect(tiltFromPointer({ x: 100, y: 100 }, collapsed, MAX_DEG)).toEqual({
      rotateX: 0,
      rotateY: 0,
    });
  });
});

describe("clampRectIntoViewport", () => {
  const MARGIN = 24;

  test("leaves a fully visible rect untouched", () => {
    const inside = rect(400, 300, 200, 100);
    expect(clampRectIntoViewport(inside, VIEWPORT, MARGIN)).toEqual(inside);
  });

  test("pulls a rect above the viewport down to the margin", () => {
    const above = rect(400, -500, 200, 100);
    const clamped = clampRectIntoViewport(above, VIEWPORT, MARGIN);
    expect(clamped.top).toBe(MARGIN);
    expect(clamped.left).toBe(400);
    expect(clamped.height).toBe(100);
    expect(clamped.bottom).toBe(MARGIN + 100);
  });

  test("pulls a rect below the viewport up to the bottom margin", () => {
    const below = rect(400, 4000, 200, 100);
    const clamped = clampRectIntoViewport(below, VIEWPORT, MARGIN);
    expect(clamped.bottom).toBe(VIEWPORT.height - MARGIN);
  });

  test("a rect larger than the viewport still lands at the margin", () => {
    // Boundary: maxTop would fall below `margin`, so the clamp range inverts.
    // Without the Math.max guard this returns a nonsense negative position.
    const huge = rect(0, -200, 200, 5000);
    const clamped = clampRectIntoViewport(huge, VIEWPORT, MARGIN);
    expect(clamped.top).toBe(MARGIN);
    expect(clamped.left).toBe(MARGIN);
  });
});
