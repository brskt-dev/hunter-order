// Pure, Phaser-free helper for the benchmark's oblique wall presentation. Given
// the solid tile rects, it returns which tile cells get a top face (all of them)
// and which get a south-facing front face (those whose south neighbour is empty).
// This drives the 2.5D "wall" look; it is presentation only and never affects
// collision (which stays the logical AABB in the simulation).

import type { TileRect } from '@gameplay';

export interface TileCell {
  readonly col: number;
  readonly row: number;
}

export interface ObliqueWallTiles {
  /** Every solid cell (deduped) — drawn as a flat top face on the ground. */
  readonly tops: TileCell[];
  /** Cells whose south neighbour is empty — drawn with a raised front face. */
  readonly fronts: TileCell[];
}

const key = (col: number, row: number): string => `${col},${row}`;

export function obliqueWallTiles(solids: readonly TileRect[]): ObliqueWallTiles {
  const occupied = new Set<string>();
  for (const rect of solids) {
    for (let r = rect.row; r < rect.row + rect.rows; r += 1) {
      for (let c = rect.col; c < rect.col + rect.cols; c += 1) {
        occupied.add(key(c, r));
      }
    }
  }

  const tops: TileCell[] = [];
  const fronts: TileCell[] = [];
  for (const cell of occupied) {
    const [col, row] = cell.split(',').map(Number) as [number, number];
    tops.push({ col, row });
    if (!occupied.has(key(col, row + 1))) {
      fronts.push({ col, row });
    }
  }
  return { tops, fronts };
}
