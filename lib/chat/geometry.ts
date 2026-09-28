/**
 * Pure viewport geometry for the citation preview overlay.
 *
 * Kept free of DOM APIs (it takes plain rect literals, which a `DOMRect`
 * structurally satisfies) so the maths is unit-testable without a browser —
 * the components that call it are not.
 */

export interface Point {
  x: number;
  y: number;
}

/** The subset of `DOMRect` this module reads. */
export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface ConnectorPath {
  /** On the chip's boundary, facing the target. */
  from: Point;
  /** The target's centre. */
  to: Point;
  /** Quadratic control point — bows the curve clear of the chat panel. */
  control: Point;
}

/** Which viewport edge a target sits beyond. */
export const OffscreenDirection = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
} as const;
export type OffscreenDirection =
  (typeof OffscreenDirection)[keyof typeof OffscreenDirection];

/** How far the connector bows, as a fraction of its straight-line length. */
const CONNECTOR_BOW_RATIO = 0.22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalizes -0 to 0 so equality checks read naturally. */
function unsign(value: number): number {
  return value === 0 ? 0 : value;
}

function centreOf(rect: RectLike): Point {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * The point where a ray from `rect`'s centre toward `point` crosses its
 * boundary. The two branches assign the crossed edge's coordinate literally
 * rather than deriving it, so the result lands exactly on the edge instead of
 * a rounding step away from it.
 */
function edgePointToward(rect: RectLike, point: Point): Point {
  const centre = centreOf(rect);
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;

  if (dx === 0 && dy === 0) return { x: centre.x, y: rect.top };

  const scaleX = dx !== 0 ? rect.width / 2 / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? rect.height / 2 / Math.abs(dy) : Infinity;

  if (scaleX <= scaleY) {
    return { x: dx > 0 ? rect.right : rect.left, y: centre.y + dy * scaleX };
  }
  return { x: centre.x + dx * scaleY, y: dy > 0 ? rect.bottom : rect.top };
}

/**
 * Builds the connector curve from a citation chip to the resource it cites.
 *
 * Returns `null` when either rect has no area — an element can be in the DOM
 * but unlaid-out (a `display:none` ancestor, a collapsed container), and the
 * midpoint maths would otherwise emit NaN into the SVG path, which fails
 * silently rather than loudly.
 */
export function anchorPoint(
  chip: RectLike,
  target: RectLike,
  viewport: Viewport
): ConnectorPath | null {
  if (chip.width <= 0 || chip.height <= 0) return null;
  if (target.width <= 0 || target.height <= 0) return null;

  const to = centreOf(target);
  const from = edgePointToward(chip, to);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { from, to, control: mid };

  // Unit perpendicular, flipped so the bow heads away from the side of the
  // viewport the chip is on. The chat panel lives on the chip's side, so
  // bowing the other way keeps the curve off the conversation.
  let perpX = -dy / length;
  let perpY = dx / length;
  const chipOnRight = centreOf(chip).x > viewport.width / 2;
  if (chipOnRight ? perpX > 0 : perpX < 0) {
    perpX = -perpX;
    perpY = -perpY;
  }

  const bow = length * CONNECTOR_BOW_RATIO;
  return {
    from,
    to,
    control: { x: mid.x + perpX * bow, y: mid.y + perpY * bow },
  };
}

/**
 * Which edge the target sits beyond, or `null` when it is fully visible.
 *
 * Vertical wins over horizontal: the page scrolls vertically, so "up" is the
 * direction a visitor can act on. A target taller than the viewport that
 * overlaps both edges is on screen, not off it.
 */
export function offscreenDirection(
  target: RectLike,
  viewport: Viewport
): OffscreenDirection | null {
  const spansViewport = target.top < 0 && target.bottom > viewport.height;
  if (!spansViewport) {
    if (target.top < 0) return OffscreenDirection.UP;
    if (target.bottom > viewport.height) return OffscreenDirection.DOWN;
  }

  const spansWidth = target.left < 0 && target.right > viewport.width;
  if (!spansWidth) {
    if (target.left < 0) return OffscreenDirection.LEFT;
    if (target.right > viewport.width) return OffscreenDirection.RIGHT;
  }

  return null;
}

/**
 * Slides a rect back inside the viewport, keeping its size.
 *
 * An off-screen target's centre is outside the overlay's own coordinate space,
 * so the connector's end marker and label would be drawn where nobody can see
 * them. Clamping makes the curve stop at the edge, which reads as "it is that
 * way" — the honest thing to show for something the visitor must scroll to.
 */
export function clampRectIntoViewport(
  rect: RectLike,
  viewport: Viewport,
  margin: number
): RectLike {
  const maxLeft = Math.max(margin, viewport.width - margin - rect.width);
  const maxTop = Math.max(margin, viewport.height - margin - rect.height);
  const left = clamp(rect.left, margin, maxLeft);
  const top = clamp(rect.top, margin, maxTop);

  return {
    left,
    top,
    width: rect.width,
    height: rect.height,
    right: left + rect.width,
    bottom: top + rect.height,
  };
}

/**
 * Pointer position over a card → CSS tilt in degrees, clamped to ±`maxDeg`.
 * The card leans toward the pointer; a pointer at a corner is the extreme of
 * the range, and anything past it clamps rather than overshooting.
 */
export function tiltFromPointer(
  pointer: Point,
  card: RectLike,
  maxDeg: number
): { rotateX: number; rotateY: number } {
  if (card.width <= 0 || card.height <= 0) return { rotateX: 0, rotateY: 0 };

  const centre = centreOf(card);
  const normalizedX = clamp((pointer.x - centre.x) / (card.width / 2), -1, 1);
  const normalizedY = clamp((pointer.y - centre.y) / (card.height / 2), -1, 1);

  return {
    rotateX: unsign(-normalizedY * maxDeg),
    rotateY: unsign(normalizedX * maxDeg),
  };
}
