// Logical tile world for the benchmark greybox. Holds the orthogonal spatial
// model (GD-0004): a grid of logical tiles, static solid obstacles as
// rectangles, the scene bounds and a spawn point — all in world pixels and
// independent of any sprite. The oblique projection is a presentation concern
// applied later by the scene and never touches these coordinates.

import type { Rect } from './collision';
import type { Vec2 } from './vec2';

/** A rectangular block of solid tiles, in tile coordinates. */
export interface TileRect {
  readonly col: number;
  readonly row: number;
  readonly cols: number;
  readonly rows: number;
}

export interface TileWorldSpec {
  readonly cols: number;
  readonly rows: number;
  readonly tileSize: number;
  readonly spawnTile: { readonly col: number; readonly row: number };
  readonly solidTiles: readonly TileRect[];
}

export interface TileWorld {
  readonly cols: number;
  readonly rows: number;
  readonly tileSize: number;
  /** Static solids in world pixels; collision treats these as AABBs. */
  readonly solids: readonly Rect[];
  /** Scene limits in world pixels; the footprint is clamped inside these. */
  readonly bounds: Rect;
  /** Spawn position (footprint centre) in world pixels. */
  readonly spawn: Vec2;
}

/** Pixel centre of the tile at (col, row). */
export function tileCentre(col: number, row: number, tileSize: number): Vec2 {
  return { x: (col + 0.5) * tileSize, y: (row + 0.5) * tileSize };
}

export function createTileWorld(spec: TileWorldSpec): TileWorld {
  const { cols, rows, tileSize } = spec;
  const solids = spec.solidTiles.map((t): Rect => ({
    x: t.col * tileSize,
    y: t.row * tileSize,
    width: t.cols * tileSize,
    height: t.rows * tileSize,
  }));
  return {
    cols,
    rows,
    tileSize,
    solids,
    bounds: { x: 0, y: 0, width: cols * tileSize, height: rows * tileSize },
    spawn: tileCentre(spec.spawnTile.col, spec.spawnTile.row, tileSize),
  };
}
