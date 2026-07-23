// Deterministic collision resolution for a circular footprint against
// axis-aligned solid rectangles and the world bounds. Follows GD-0004: collision
// uses simple logical shapes (a circle vs boxes), never sprite pixels; the Hunter
// cannot penetrate solids; tangential sliding along walls is allowed; resolution
// is deterministic.
//
// Movement is resolved one axis at a time (X, then Y) which yields wall sliding
// for free. Each solid is separated toward the side the footprint came from, so
// a shallow per-frame step is pushed back the way it came rather than tunnelling
// to the far side. This assumes per-frame displacement is smaller than a solid
// (guaranteed here by the clamped dt and benchmark speed).

import type { Vec2 } from './vec2';

/** Axis-aligned rectangle given as top-left corner plus size. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Separate a circle centre on one axis so it no longer overlaps `solid`.
 *
 * @param along     the centre coordinate on the axis being resolved
 * @param across    the centre coordinate on the perpendicular axis (fixed)
 * @param cameFrom  the origin coordinate on the axis, used to pick the exit side
 * @param loMin/loMax  the solid's extent on the resolved axis
 * @param acMin/acMax  the solid's extent on the perpendicular axis
 */
function separate(
  along: number,
  across: number,
  radius: number,
  cameFrom: number,
  loMin: number,
  loMax: number,
  acMin: number,
  acMax: number,
): number {
  const nearestAcross = clamp(across, acMin, acMax);
  const gap = across - nearestAcross;
  if (Math.abs(gap) >= radius) {
    return along; // too far on the perpendicular axis to touch this solid
  }
  const clearance = Math.sqrt(radius * radius - gap * gap);
  const forbiddenMin = loMin - clearance;
  const forbiddenMax = loMax + clearance;
  if (along <= forbiddenMin || along >= forbiddenMax) {
    return along; // not overlapping
  }
  if (cameFrom <= loMin) {
    return forbiddenMin;
  }
  if (cameFrom >= loMax) {
    return forbiddenMax;
  }
  // Origin was inside the solid's span on this axis (e.g. spawned overlapping):
  // fall back to the nearer edge.
  return along - forbiddenMin <= forbiddenMax - along ? forbiddenMin : forbiddenMax;
}

/**
 * Resolves a desired move from `from` to `to` for a circular footprint of the
 * given `radius`, keeping it inside `bounds` and out of every solid. Returns the
 * corrected centre position.
 */
export function resolveMovement(
  from: Vec2,
  to: Vec2,
  radius: number,
  solids: readonly Rect[],
  bounds: Rect,
): Vec2 {
  // X axis, using the starting Y.
  let x = clamp(to.x, bounds.x + radius, bounds.x + bounds.width - radius);
  for (const s of solids) {
    x = separate(x, from.y, radius, from.x, s.x, s.x + s.width, s.y, s.y + s.height);
  }

  // Y axis, using the already-resolved X.
  let y = clamp(to.y, bounds.y + radius, bounds.y + bounds.height - radius);
  for (const s of solids) {
    y = separate(y, x, radius, from.y, s.y, s.y + s.height, s.x, s.x + s.width);
  }

  return { x, y };
}
