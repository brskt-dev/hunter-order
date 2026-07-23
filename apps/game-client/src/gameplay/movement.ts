// Continuous, frame-rate-independent movement integration. GD-0004 mandates
// "fast start, immediate stop on release, immediate direction change, no
// mandatory inertia in base movement", so base movement has no acceleration:
// velocity is simply intent x speed, and displacement is velocity x dt.

import { add, scale, type Vec2 } from './vec2';

/**
 * Advances a position by one step. `intent` is expected to be unit-length (or
 * zero); `speed` is world units per second; `dtSeconds` is the elapsed time.
 * Because it is linear in dt, N small steps equal one large step of the same
 * total duration — movement is independent of frame rate.
 */
export function stepPosition(position: Vec2, intent: Vec2, speed: number, dtSeconds: number): Vec2 {
  return add(position, scale(intent, speed * dtSeconds));
}

/**
 * Converts a Phaser frame delta (milliseconds) into seconds, clamped to
 * `maxSeconds` and floored at zero. The clamp keeps a single tab-refocus frame
 * (a multi-second delta) from teleporting the Hunter or tunnelling collisions.
 * Benchmark-only safety value; the cap lives in config.
 */
export function clampDeltaSeconds(deltaMs: number, maxSeconds: number): number {
  const seconds = deltaMs / 1000;
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }
  return Math.min(seconds, maxSeconds);
}
