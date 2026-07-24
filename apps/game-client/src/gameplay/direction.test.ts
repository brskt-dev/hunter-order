import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FACING,
  type Direction8,
  directionFromVector,
  directionToVector,
} from './direction';
import { length, vec2, ZERO } from './vec2';

// Screen-space convention: +x is east (right), +y is south (down).
describe('directionFromVector', () => {
  const cases: Array<[string, ReturnType<typeof vec2>, Direction8]> = [
    ['east', vec2(1, 0), 'e'],
    ['west', vec2(-1, 0), 'w'],
    ['north (up is -y)', vec2(0, -1), 'n'],
    ['south (down is +y)', vec2(0, 1), 's'],
    ['south-east', vec2(1, 1), 'se'],
    ['north-east', vec2(1, -1), 'ne'],
    ['north-west', vec2(-1, -1), 'nw'],
    ['south-west', vec2(-1, 1), 'sw'],
  ];

  for (const [name, v, expected] of cases) {
    it(`maps ${name} to "${expected}"`, () => {
      expect(directionFromVector(v, 's')).toBe(expected);
    });
  }

  it('keeps the previous facing when idle (zero vector)', () => {
    expect(directionFromVector(ZERO, 'w')).toBe('w');
    expect(directionFromVector(vec2(0, 0), 'ne')).toBe('ne');
  });

  it('is not affected by magnitude, only orientation', () => {
    expect(directionFromVector(vec2(140, 0), 's')).toBe('e');
    expect(directionFromVector(vec2(0.01, 0), 's')).toBe('e');
  });

  it('defaults to facing south', () => {
    expect(DEFAULT_FACING).toBe('s');
  });
});

describe('directionToVector', () => {
  it('returns the expected axis-aligned unit vectors', () => {
    expect(directionToVector('e')).toEqual({ x: 1, y: 0 });
    expect(directionToVector('w')).toEqual({ x: -1, y: 0 });
    expect(directionToVector('n')).toEqual({ x: 0, y: -1 });
    expect(directionToVector('s')).toEqual({ x: 0, y: 1 });
  });

  it('returns unit-length vectors for every facing (diagonals included)', () => {
    const dirs: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (const d of dirs) {
      expect(length(directionToVector(d))).toBeCloseTo(1);
    }
  });

  it('round-trips through directionFromVector', () => {
    const dirs: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (const d of dirs) {
      expect(directionFromVector(directionToVector(d), 's')).toBe(d);
    }
  });
});
