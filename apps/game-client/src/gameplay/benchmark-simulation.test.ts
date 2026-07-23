import { describe, expect, it } from 'vitest';

import { BenchmarkSimulation, type HunterSimConfig, stepHunter } from './benchmark-simulation';
import { type MovementAction } from './movement-intent';
import { length, vec2 } from './vec2';
import { createTileWorld, type TileWorld } from './world';

const CONFIG: HunterSimConfig = { speed: 140, footprintRadius: 16 };

const openWorld = (): TileWorld =>
  createTileWorld({
    cols: 20,
    rows: 20,
    tileSize: 48,
    spawnTile: { col: 5, row: 5 },
    solidTiles: [],
  });

// Spawn at col 7 (x=360); a wall's left face sits at x=384.
const walledWorld = (): TileWorld =>
  createTileWorld({
    cols: 20,
    rows: 20,
    tileSize: 48,
    spawnTile: { col: 7, row: 5 },
    solidTiles: [{ col: 8, row: 4, cols: 1, rows: 4 }],
  });

const noActions: ReadonlySet<MovementAction> = new Set();
const set = (...actions: MovementAction[]): ReadonlySet<MovementAction> => new Set(actions);

describe('BenchmarkSimulation', () => {
  it('spawns at the world spawn point facing south', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG);
    expect(sim.hunter.position).toEqual({ x: 264, y: 264 });
    expect(sim.hunter.facing).toBe('s');
  });

  it('stays put and keeps facing when idle', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG);
    sim.update(noActions, 1 / 60);
    expect(sim.hunter.position).toEqual({ x: 264, y: 264 });
    expect(sim.hunter.facing).toBe('s');
  });

  it('moves in the intent direction and updates facing', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG);
    sim.update(set('move-east'), 1 / 60);
    expect(sim.hunter.position.x).toBeGreaterThan(264);
    expect(sim.hunter.position.y).toBeCloseTo(264);
    expect(sim.hunter.facing).toBe('e');
  });

  it('keeps the last facing after movement stops', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG);
    sim.update(set('move-east'), 1 / 60);
    sim.update(noActions, 1 / 60);
    expect(sim.hunter.facing).toBe('e');
  });

  it('cannot walk through a solid wall', () => {
    const sim = new BenchmarkSimulation(walledWorld(), CONFIG);
    for (let i = 0; i < 200; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    expect(sim.hunter.position.x).toBeLessThanOrEqual(384 - CONFIG.footprintRadius + 1e-6);
    expect(sim.hunter.facing).toBe('e');
  });

  it('resets to the spawn state', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG);
    sim.update(set('move-east'), 1);
    sim.reset();
    expect(sim.hunter.position).toEqual({ x: 264, y: 264 });
    expect(sim.hunter.facing).toBe('s');
  });
});

describe('stepHunter', () => {
  it('applies the same speed along a diagonal (diagonals are not faster)', () => {
    const world = openWorld();
    const dt = 0.25;
    const start = { position: vec2(264, 264), facing: 's' as const };
    const next = stepHunter(start, set('move-east', 'move-south'), dt, world, CONFIG);
    expect(length({ x: next.position.x - 264, y: next.position.y - 264 })).toBeCloseTo(
      CONFIG.speed * dt,
    );
    expect(next.facing).toBe('se');
  });

  it('does not mutate the input state', () => {
    const world = openWorld();
    const start = { position: vec2(264, 264), facing: 's' as const };
    stepHunter(start, set('move-east'), 1 / 60, world, CONFIG);
    expect(start.position).toEqual({ x: 264, y: 264 });
    expect(start.facing).toBe('s');
  });
});
