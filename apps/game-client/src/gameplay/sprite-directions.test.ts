import { describe, expect, it } from 'vitest';

import { type Direction8 } from './direction';
import { directionalFrameKey, pixelLabCardinal } from './sprite-directions';

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
