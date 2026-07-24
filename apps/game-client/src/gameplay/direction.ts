// Eight-direction visual facing derived from a movement vector (GD-0004:
// "eight-direction visual facing derived from the latest movement vector; when
// idle the Hunter keeps its last valid facing"). Screen-space convention:
// +x = east (right), +y = south (down).

import { length, type Vec2 } from './vec2';

export type Direction8 = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Initial/idle facing before any movement input. */
export const DEFAULT_FACING: Direction8 = 's';

// Octant index (round(atan2(y, x) / 45deg), wrapped to 0..7) -> direction.
const OCTANTS: readonly Direction8[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];

const DIAGONAL = Math.SQRT1_2; // 1/sqrt(2): diagonal facings are unit-length too.
const DIRECTION_VECTORS: Record<Direction8, Vec2> = {
  n: { x: 0, y: -1 },
  ne: { x: DIAGONAL, y: -DIAGONAL },
  e: { x: 1, y: 0 },
  se: { x: DIAGONAL, y: DIAGONAL },
  s: { x: 0, y: 1 },
  sw: { x: -DIAGONAL, y: DIAGONAL },
  w: { x: -1, y: 0 },
  nw: { x: -DIAGONAL, y: -DIAGONAL },
};

/** Unit vector pointing along a facing (screen space: +x east, +y south). */
export function directionToVector(direction: Direction8): Vec2 {
  return DIRECTION_VECTORS[direction];
}

// Below this magnitude the input is treated as "no movement intent" and the
// caller's previous facing is preserved.
const MOVEMENT_EPSILON = 1e-6;

/**
 * Maps a movement vector to one of eight facings. Returns `fallback` (the last
 * valid facing) when the vector is effectively zero, so an idle Hunter keeps
 * looking where it last moved.
 */
export function directionFromVector(movement: Vec2, fallback: Direction8): Direction8 {
  if (length(movement) < MOVEMENT_EPSILON) {
    return fallback;
  }
  const octant = ((Math.round(Math.atan2(movement.y, movement.x) / (Math.PI / 4)) % 8) + 8) % 8;
  return OCTANTS[octant] ?? fallback;
}
