import { describe, expect, it } from 'vitest';

import { add, length, lerp, normalize, scale, vec2, ZERO } from './vec2';

describe('vec2', () => {
  it('creates a vector from components', () => {
    expect(vec2(3, 4)).toEqual({ x: 3, y: 4 });
  });

  it('exposes a zero vector', () => {
    expect(ZERO).toEqual({ x: 0, y: 0 });
  });

  it('adds two vectors component-wise', () => {
    expect(add(vec2(1, 2), vec2(3, -5))).toEqual({ x: 4, y: -3 });
  });

  it('scales a vector by a scalar', () => {
    expect(scale(vec2(2, -3), 2.5)).toEqual({ x: 5, y: -7.5 });
  });

  it('computes the euclidean length', () => {
    expect(length(vec2(3, 4))).toBe(5);
  });

  it('normalizes to unit length', () => {
    expect(normalize(vec2(0, 5))).toEqual({ x: 0, y: 1 });
    expect(length(normalize(vec2(3, 4)))).toBeCloseTo(1);
  });

  it('normalizes a zero-length vector to zero (no NaN)', () => {
    expect(normalize(ZERO)).toEqual({ x: 0, y: 0 });
  });

  it('interpolates linearly between two vectors', () => {
    expect(lerp(vec2(0, 0), vec2(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
    expect(lerp(vec2(0, 0), vec2(10, 20), 0)).toEqual({ x: 0, y: 0 });
    expect(lerp(vec2(0, 0), vec2(10, 20), 1)).toEqual({ x: 10, y: 20 });
  });
});
