import { describe, expect, it } from 'vitest';

import { type Direction8 } from './direction';
import { directionalFrameKey, nearestCoveredDirection, pixelLabCardinal } from './sprite-directions';

const ALL: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

describe('pixelLabCardinal', () => {
  it('maps each Direction8 to PixelLab cardinal names', () => {
    expect(ALL.map(pixelLabCardinal)).toEqual([
      'north',
      'north-east',
      'east',
      'south-east',
      'south',
      'south-west',
      'west',
      'north-west',
    ]);
  });
});

describe('directionalFrameKey', () => {
  it('joins a base and facing into a texture key', () => {
    expect(directionalFrameKey('hound-idle', 'sw')).toBe('hound-idle-sw');
    expect(directionalFrameKey('hound-idle', 's')).toBe('hound-idle-s');
  });
});

describe('nearestCoveredDirection', () => {
  const covered: Direction8[] = ['s', 'se', 'sw'];
  it('returns the target when it is covered', () => {
    expect(nearestCoveredDirection('se', covered)).toBe('se');
  });
  it('maps an uncovered direction to the nearest covered one', () => {
    expect(nearestCoveredDirection('e', covered)).toBe('se'); // east → south-east
    expect(nearestCoveredDirection('w', covered)).toBe('sw'); // west → south-west
    expect(nearestCoveredDirection('n', ['s', 'se'])).toBe('se'); // north → nearest available
  });
});
