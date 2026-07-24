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

  it('keeps every interactable inside the grid and out of solids', () => {
    for (const it of BENCHMARK.interactables) {
      const { col, row, cols, rows } = it.tile;
      expect(col).toBeGreaterThanOrEqual(0);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(col + cols).toBeLessThanOrEqual(BENCHMARK.world.cols);
      expect(row + rows).toBeLessThanOrEqual(BENCHMARK.world.rows);

      const overlapsSolid = BENCHMARK.solidTiles.some(
        (s) =>
          col < s.col + s.cols &&
          col + cols > s.col &&
          row < s.row + s.rows &&
          row + rows > s.row,
      );
      expect(overlapsSolid).toBe(false);
    }
  });

  it('makes the ancient fragment a non-blocking collectible (items never block movement)', () => {
    const fragment = BENCHMARK.interactables.find((it) => it.kind === 'fragment');
    expect(fragment).toBeDefined();
    expect(fragment?.collectible).toBe(true);
    expect(fragment?.blocksWhileActive).toBe(false);
  });

  it('keeps the hound patrol path inside the grid and out of solids', () => {
    expect(BENCHMARK.hound.patrolTiles.length).toBeGreaterThan(0);
    for (const t of BENCHMARK.hound.patrolTiles) {
      expect(t.col).toBeGreaterThanOrEqual(0);
      expect(t.row).toBeGreaterThanOrEqual(0);
      expect(t.col).toBeLessThan(BENCHMARK.world.cols);
      expect(t.row).toBeLessThan(BENCHMARK.world.rows);
      const inSolid = BENCHMARK.solidTiles.some(
        (s) => t.col >= s.col && t.col < s.col + s.cols && t.row >= s.row && t.row < s.row + s.rows,
      );
      expect(inSolid).toBe(false);
    }
  });

  it('gives the hound hysteresis (de-aggro radius beyond the aggro radius)', () => {
    expect(BENCHMARK.hound.deAggroRadius).toBeGreaterThan(BENCHMARK.hound.aggroRadius);
    expect(BENCHMARK.hound.contactRadius).toBeGreaterThan(0);
  });
});
