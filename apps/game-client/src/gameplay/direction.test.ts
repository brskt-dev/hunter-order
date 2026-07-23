import { describe, expect, it } from 'vitest';

import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import { vec2, ZERO } from './vec2';

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
