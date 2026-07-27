import { describe, expect, it } from 'vitest';

import { obliqueWallTiles } from './oblique-walls';

const norm = (cells: ReadonlyArray<{ col: number; row: number }>): string[] =>
  cells.map((c) => `${c.col},${c.row}`).sort();

describe('obliqueWallTiles', () => {
  it('a single tile has a top and a south-facing front', () => {
    const { tops, fronts } = obliqueWallTiles([{ col: 1, row: 1, cols: 1, rows: 1 }]);
    expect(norm(tops)).toEqual(['1,1']);
    expect(norm(fronts)).toEqual(['1,1']);
  });

  it('a vertical wall exposes only its bottom tile as a front face', () => {
    const { tops, fronts } = obliqueWallTiles([{ col: 2, row: 0, cols: 1, rows: 3 }]);
    expect(norm(tops)).toEqual(['2,0', '2,1', '2,2']);
    expect(norm(fronts)).toEqual(['2,2']); // only the southernmost tile has an empty south neighbour
  });

  it('a horizontal wall exposes every tile as a front face', () => {
    const { tops, fronts } = obliqueWallTiles([{ col: 0, row: 5, cols: 3, rows: 1 }]);
    expect(norm(tops)).toEqual(['0,5', '1,5', '2,5']);
    expect(norm(fronts)).toEqual(['0,5', '1,5', '2,5']);
  });

  it('dedups overlapping rects and only faces tiles with an empty south neighbour', () => {
    // An L: a 2x1 horizontal + a 1x2 vertical sharing (0,0).
    const { tops, fronts } = obliqueWallTiles([
      { col: 0, row: 0, cols: 2, rows: 1 },
      { col: 0, row: 0, cols: 1, rows: 2 },
    ]);
    expect(norm(tops)).toEqual(['0,0', '0,1', '1,0']); // (0,0) not double-counted
    // (0,0) south is (0,1) which is wall -> no front; (1,0) and (0,1) are exposed.
    expect(norm(fronts)).toEqual(['0,1', '1,0']);
  });
});
