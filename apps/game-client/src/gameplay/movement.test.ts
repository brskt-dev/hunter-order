import { describe, expect, it } from 'vitest';

import { clampDeltaSeconds, stepPosition } from './movement';
import { length, normalize, vec2, ZERO } from './vec2';

const SPEED = 140; // px/s (arbitrary for the test)

describe('stepPosition', () => {
  it('moves continuously in the intent direction, scaled by speed and dt', () => {
    const next = stepPosition(vec2(100, 100), vec2(1, 0), SPEED, 0.5);
    expect(next).toEqual({ x: 100 + SPEED * 0.5, y: 100 });
  });

  it('stops immediately when intent is zero (no inertia)', () => {
    const pos = vec2(42, 42);
    expect(stepPosition(pos, ZERO, SPEED, 1 / 60)).toEqual(pos);
  });

  it('is frame-rate independent: two half-steps equal one full step', () => {
    const start = vec2(0, 0);
    const intent = vec2(0, 1);
    const oneStep = stepPosition(start, intent, SPEED, 1 / 30);
    const halfA = stepPosition(start, intent, SPEED, 1 / 60);
    const halfB = stepPosition(halfA, intent, SPEED, 1 / 60);
    expect(halfB.x).toBeCloseTo(oneStep.x, 6);
    expect(halfB.y).toBeCloseTo(oneStep.y, 6);
  });

  it('applies the same speed along a normalized diagonal (diagonals are not faster)', () => {
    const dt = 0.25;
    const displacement = length(stepPosition(ZERO, normalize(vec2(1, 1)), SPEED, dt));
    expect(displacement).toBeCloseTo(SPEED * dt, 6);
  });
});

describe('clampDeltaSeconds', () => {
  it('converts milliseconds to seconds', () => {
    expect(clampDeltaSeconds(16, 0.05)).toBeCloseTo(0.016);
  });

  it('caps large frame gaps to protect against tab-refocus jumps', () => {
    expect(clampDeltaSeconds(5000, 0.05)).toBe(0.05);
  });

  it('treats negative or non-finite deltas as zero', () => {
    expect(clampDeltaSeconds(-10, 0.05)).toBe(0);
    expect(clampDeltaSeconds(Number.NaN, 0.05)).toBe(0);
  });
});
