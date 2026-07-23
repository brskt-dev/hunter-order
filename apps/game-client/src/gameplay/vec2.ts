// Immutable 2D vector helpers. Phaser-free and dependency-free so movement,
// collision and camera math can be unit tested without the game runtime.

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** The origin vector. */
export const ZERO: Vec2 = Object.freeze({ x: 0, y: 0 });

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Vec2, scalar: number): Vec2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/** Returns the unit vector, or {@link ZERO} for a zero-length input (no NaN). */
export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  if (len === 0) {
    return ZERO;
  }
  return { x: v.x / len, y: v.y / len };
}

/** Linear interpolation from `a` to `b` by factor `t` (0..1, unclamped). */
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
