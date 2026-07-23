// Pure exploration-camera math. GD-0004: the exploration camera "applies a
// look-ahead offset in the movement direction ... returns smoothly on stop,
// transitions smoothly on direction change". The scene owns the Phaser camera
// and the current-offset state; this module just computes the target offset and
// a frame-rate-independent step toward it. The camera never changes range,
// perception or logical position — it is presentation only.

import { lerp, normalize, scale, type Vec2 } from './vec2';

/**
 * Desired look-ahead offset (world pixels) for the given movement direction.
 * Direction-only: magnitude is always `distance`, or zero when idle so the
 * camera re-centres on the Hunter when movement stops.
 */
export function lookAheadTarget(movement: Vec2, distance: number): Vec2 {
  return scale(normalize(movement), distance);
}

/**
 * Exponential smoothing of `current` toward `target`. `smoothing` is the rate
 * (per second); larger converges faster. Uses `1 - e^(-k*dt)` so the result is
 * exactly frame-rate independent (N sub-steps equal one full step).
 */
export function smoothTowards(current: Vec2, target: Vec2, smoothing: number, dt: number): Vec2 {
  if (dt <= 0 || smoothing <= 0) {
    return current;
  }
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}
