import { describe, expect, it } from 'vitest';

import { type Rect, resolveMovement } from './collision';
import { type Vec2, vec2 } from './vec2';

const RADIUS = 16;
const OPEN_BOUNDS: Rect = { x: -1000, y: -1000, width: 4000, height: 4000 };
const TILE: Rect = { x: 100, y: 100, width: 48, height: 48 }; // occupies x[100,148], y[100,148]

/** Distance from a circle centre to the nearest point of a rect (0 if inside). */
function centreToRect(centre: Vec2, rect: Rect): number {
  const qx = Math.min(Math.max(centre.x, rect.x), rect.x + rect.width);
  const qy = Math.min(Math.max(centre.y, rect.y), rect.y + rect.height);
  return Math.hypot(centre.x - qx, centre.y - qy);
}

describe('resolveMovement', () => {
  it('moves freely when nothing is in the way', () => {
    expect(resolveMovement(vec2(0, 0), vec2(30, 40), RADIUS, [], OPEN_BOUNDS)).toEqual(
      vec2(30, 40),
    );
  });

  it('clamps the footprint inside the world bounds', () => {
    const bounds: Rect = { x: 0, y: 0, width: 200, height: 200 };
    const resolved = resolveMovement(vec2(100, 100), vec2(250, -30), RADIUS, [], bounds);
    expect(resolved.x).toBe(200 - RADIUS);
    expect(resolved.y).toBe(0 + RADIUS);
  });

  it('stops head-on at a solid, offset by the footprint radius', () => {
    const resolved = resolveMovement(vec2(50, 124), vec2(120, 124), RADIUS, [TILE], OPEN_BOUNDS);
    expect(resolved.x).toBeCloseTo(100 - RADIUS); // stop at left face minus radius
    expect(resolved.y).toBeCloseTo(124);
  });

  it('does not move when the target never reaches the solid', () => {
    const resolved = resolveMovement(vec2(50, 124), vec2(60, 124), RADIUS, [TILE], OPEN_BOUNDS);
    expect(resolved).toEqual(vec2(60, 124));
  });

  it('slides along a wall: blocked axis stops, free axis keeps moving', () => {
    // Heading south-east into the wall's left face; x is blocked, y should advance.
    const resolved = resolveMovement(vec2(50, 124), vec2(120, 140), RADIUS, [TILE], OPEN_BOUNDS);
    expect(resolved.x).toBeCloseTo(100 - RADIUS);
    expect(resolved.y).toBeCloseTo(140); // slid downward
  });

  it('never ends overlapping a solid, from any approach angle', () => {
    const centre = vec2(124, 124); // centre of TILE
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      const from = vec2(centre.x + Math.cos(angle) * 100, centre.y + Math.sin(angle) * 100);
      const resolved = resolveMovement(from, centre, RADIUS, [TILE], OPEN_BOUNDS);
      expect(centreToRect(resolved, TILE)).toBeGreaterThanOrEqual(RADIUS - 1e-9);
    }
  });

  it('resolves a diagonal corner approach to a non-overlapping touch', () => {
    const resolved = resolveMovement(vec2(70, 70), vec2(100, 100), RADIUS, [TILE], OPEN_BOUNDS);
    expect(centreToRect(resolved, TILE)).toBeCloseTo(RADIUS);
  });
});
