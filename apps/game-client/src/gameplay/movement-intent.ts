// Translates the active *semantic* movement actions into a normalized intent
// vector. Keeping this Phaser-free and key-agnostic honours GD-0004: input is
// modelled as remappable semantic actions, and "the input vector is normalized
// before speed is applied" so diagonals are never faster than cardinals.

import { normalize, type Vec2 } from './vec2';

/**
 * Semantic movement actions. The concrete key -> action binding lives in the
 * presentation/input layer (the scene), keeping this logic remappable.
 */
export type MovementAction = 'move-north' | 'move-south' | 'move-east' | 'move-west';

/**
 * Builds a unit-length movement intent from the set of currently active
 * actions. Opposing actions cancel; the result is zero when idle. Screen-space
 * convention: +x = east, +y = south (down).
 */
export function intentFromActions(active: ReadonlySet<MovementAction>): Vec2 {
  const x = (active.has('move-east') ? 1 : 0) - (active.has('move-west') ? 1 : 0);
  const y = (active.has('move-south') ? 1 : 0) - (active.has('move-north') ? 1 : 0);
  return normalize({ x, y });
}
