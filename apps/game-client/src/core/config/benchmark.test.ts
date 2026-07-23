import { describe, expect, it } from 'vitest';

import { BENCHMARK } from './benchmark';

describe('benchmark config', () => {
  it('keeps the approved footprint ratio (0.33 tile)', () => {
    expect(BENCHMARK.hunter.footprintRadius).toBe(Math.round(0.33 * BENCHMARK.tileSize));
  });

  it('uses positive world dimensions', () => {
    expect(BENCHMARK.world.cols).toBeGreaterThan(0);
    expect(BENCHMARK.world.rows).toBeGreaterThan(0);
  });

  it('keeps every solid tile inside the grid', () => {
    for (const s of BENCHMARK.solidTiles) {
      expect(s.col).toBeGreaterThanOrEqual(0);
      expect(s.row).toBeGreaterThanOrEqual(0);
      expect(s.col + s.cols).toBeLessThanOrEqual(BENCHMARK.world.cols);
      expect(s.row + s.rows).toBeLessThanOrEqual(BENCHMARK.world.rows);
    }
  });

  it('spawns inside the grid and never inside a solid', () => {
    const { col, row } = BENCHMARK.spawnTile;
    expect(col).toBeGreaterThanOrEqual(0);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(BENCHMARK.world.cols);
    expect(row).toBeLessThan(BENCHMARK.world.rows);

    const inSolid = BENCHMARK.solidTiles.some(
      (s) => col >= s.col && col < s.col + s.cols && row >= s.row && row < s.row + s.rows,
    );
    expect(inSolid).toBe(false);
  });

  it('defines colours as 24-bit values', () => {
    for (const value of Object.values(BENCHMARK.colors)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffff);
    }
  });
});
