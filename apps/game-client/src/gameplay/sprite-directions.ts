// Maps the gameplay Direction8 to PixelLab's cardinal direction names and builds
// per-direction Phaser texture keys. Pure and Phaser-free (unit-tested). This is
// the small seam between our facing model and the generated directional art.

import { type Direction8, directionToVector } from './direction';

const CARDINAL: Record<Direction8, string> = {
  n: 'north',
  ne: 'north-east',
  e: 'east',
  se: 'south-east',
  s: 'south',
  sw: 'south-west',
  w: 'west',
  nw: 'north-west',
};

/** PixelLab cardinal name for a facing (e.g. 'sw' -> 'south-west'). */
export function pixelLabCardinal(facing: Direction8): string {
  return CARDINAL[facing];
}

/** Phaser texture key for a directional sprite (e.g. ('hound-idle','sw') -> 'hound-idle-sw'). */
export function directionalFrameKey(base: string, facing: Direction8): string {
  return `${base}-${facing}`;
}

/**
 * The covered direction most aligned with `target` (max dot product of unit
 * vectors) — used to fall back to an available animation direction when a
 * per-direction frame set is incomplete. Returns `target` if it is covered.
 * Assumes `covered` is non-empty.
 */
export function nearestCoveredDirection(
  target: Direction8,
  covered: readonly Direction8[],
): Direction8 {
  if (covered.includes(target)) {
    return target;
  }
  const t = directionToVector(target);
  let best = covered[0];
  let bestDot = -Infinity;
  for (const dir of covered) {
    const v = directionToVector(dir);
    const dot = t.x * v.x + t.y * v.y;
    if (dot > bestDot) {
      bestDot = dot;
      best = dir;
    }
  }
  return best;
}
