// Contextual environmental interaction (benchmark greybox). Phaser-free and
// unit-tested. Follows GD-0004: interaction has a valid range and picks a single
// relevant target deterministically; it never auto-moves the Hunter. This is a
// small placeholder for the "use the axe on an obstruction" step — not a full
// gathering system.

import type { Rect } from './collision';
import type { Vec2 } from './vec2';

export type InteractableState = 'active' | 'cleared';

/** A world obstruction the Hunter can act on (e.g. overgrowth / debris). */
export interface Interactable {
  readonly id: string;
  /** Placeholder classification (e.g. 'overgrowth'); benchmark-only. */
  readonly kind: string;
  /** Logical footprint in world pixels. */
  readonly bounds: Rect;
  /** Whether it blocks movement while still active. */
  readonly blocksWhileActive: boolean;
  readonly state: InteractableState;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Distance from a point to the nearest edge of a rect (0 when inside). */
export function distanceToBounds(point: Vec2, bounds: Rect): number {
  const qx = clamp(point.x, bounds.x, bounds.x + bounds.width);
  const qy = clamp(point.y, bounds.y, bounds.y + bounds.height);
  return Math.hypot(point.x - qx, point.y - qy);
}

/**
 * Returns the single active interactable within `range` of `from`, choosing the
 * nearest and breaking ties by ascending id so the result is deterministic.
 */
export function findInteractTarget(
  from: Vec2,
  interactables: readonly Interactable[],
  range: number,
): Interactable | null {
  let best: Interactable | null = null;
  let bestDistance = Infinity;
  for (const candidate of interactables) {
    if (candidate.state !== 'active') {
      continue;
    }
    const distance = distanceToBounds(from, candidate.bounds);
    if (distance > range) {
      continue;
    }
    if (
      distance < bestDistance ||
      (distance === bestDistance && (!best || candidate.id < best.id))
    ) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/** Collision rects for interactables that still block movement. */
export function activeBlockingRects(interactables: readonly Interactable[]): Rect[] {
  return interactables
    .filter((it) => it.state === 'active' && it.blocksWhileActive)
    .map((it) => it.bounds);
}

/** Returns a new list with the matching active interactable marked cleared. */
export function clearInteractable(
  interactables: readonly Interactable[],
  id: string,
): Interactable[] {
  return interactables.map((it) =>
    it.id === id && it.state === 'active' ? { ...it, state: 'cleared' } : it,
  );
}
