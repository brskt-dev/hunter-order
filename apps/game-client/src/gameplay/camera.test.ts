import { describe, expect, it } from 'vitest';

import { lookAheadTarget, smoothTowards } from './camera';
import { length, normalize, vec2, ZERO } from './vec2';

const DISTANCE = 96;

describe('lookAheadTarget', () => {
  it('offsets in the movement direction by the configured distance', () => {
    expect(lookAheadTarget(vec2(1, 0), DISTANCE)).toEqual({ x: DISTANCE, y: 0 });
    expect(lookAheadTarget(vec2(0, -1), DISTANCE)).toEqual({ x: 0, y: -DISTANCE });
  });

  it('depends on direction only, not input magnitude', () => {
    expect(lookAheadTarget(vec2(5, 0), DISTANCE)).toEqual({ x: DISTANCE, y: 0 });
    expect(length(lookAheadTarget(normalize(vec2(1, 1)), DISTANCE))).toBeCloseTo(DISTANCE);
  });

  it('returns zero offset when idle (camera re-centres on stop)', () => {
    expect(lookAheadTarget(ZERO, DISTANCE)).toEqual({ x: 0, y: 0 });
  });
});

describe('smoothTowards', () => {
  it('moves partway toward the target', () => {
    const next = smoothTowards(vec2(0, 0), vec2(10, 0), 5, 0.1);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(10);
  });

  it('stays put when dt is zero', () => {
    expect(smoothTowards(vec2(3, 4), vec2(10, 10), 5, 0)).toEqual({ x: 3, y: 4 });
  });

  it('converges to the target over a long step', () => {
    const next = smoothTowards(vec2(0, 0), vec2(10, 20), 5, 100);
    expect(next.x).toBeCloseTo(10);
    expect(next.y).toBeCloseTo(20);
  });

  it('is frame-rate independent (exponential): two half-steps equal one full step', () => {
    const target = vec2(10, -6);
    const full = smoothTowards(ZERO, target, 5, 0.2);
    const halfA = smoothTowards(ZERO, target, 5, 0.1);
    const halfB = smoothTowards(halfA, target, 5, 0.1);
    expect(halfB.x).toBeCloseTo(full.x, 6);
    expect(halfB.y).toBeCloseTo(full.y, 6);
  });
});
