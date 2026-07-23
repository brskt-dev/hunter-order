import { describe, expect, it } from 'vitest';

import { createTileWorld, tileCentre, type TileWorldSpec } from './world';

const SPEC: TileWorldSpec = {
  cols: 10,
  rows: 8,
  tileSize: 48,
  spawnTile: { col: 2, row: 3 },
  solidTiles: [{ col: 4, row: 0, cols: 1, rows: 5 }],
};

describe('createTileWorld', () => {
  it('derives world bounds from the grid dimensions', () => {
    const world = createTileWorld(SPEC);
    expect(world.bounds).toEqual({ x: 0, y: 0, width: 480, height: 384 });
  });

  it('converts solid tile-rects into world-space rectangles', () => {
    const world = createTileWorld(SPEC);
    expect(world.solids).toEqual([{ x: 192, y: 0, width: 48, height: 240 }]);
  });

  it('places the spawn at the centre of the spawn tile', () => {
    const world = createTileWorld(SPEC);
    expect(world.spawn).toEqual({ x: 120, y: 168 });
  });

  it('carries the grid metadata through', () => {
    const world = createTileWorld(SPEC);
    expect(world.cols).toBe(10);
    expect(world.rows).toBe(8);
    expect(world.tileSize).toBe(48);
  });
});

describe('tileCentre', () => {
  it('returns the pixel centre of a tile', () => {
    expect(tileCentre(0, 0, 48)).toEqual({ x: 24, y: 24 });
    expect(tileCentre(4, 2, 48)).toEqual({ x: 216, y: 120 });
  });
});
