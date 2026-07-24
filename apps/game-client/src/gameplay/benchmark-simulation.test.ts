import { describe, expect, it } from 'vitest';

import { BenchmarkSimulation, type HunterSimConfig, stepHunter } from './benchmark-simulation';
import { type Interactable } from './interaction';
import { type MovementAction } from './movement-intent';
import { length, vec2 } from './vec2';
import { createTileWorld, type TileWorld } from './world';

const CONFIG: HunterSimConfig = { speed: 140, footprintRadius: 16, interactRange: 40 };

// An overgrowth obstruction just east of the open-world spawn (x=264): its left
// face is at x=336, so a radius-16 footprint is blocked at x=320.
const overgrowth = (): Interactable => ({
  id: 'roots',
  kind: 'overgrowth',
  bounds: { x: 336, y: 240, width: 48, height: 96 },
  blocksWhileActive: true,
  state: 'active',
});

// A pickup item (the unidentified ancient fragment) just east of spawn. Unlike an
// obstruction it does NOT block movement and, when interacted with, is collected
// into the possession log rather than merely cleared.
const fragment = (): Interactable => ({
  id: 'fragment',
  kind: 'fragment',
  bounds: { x: 336, y: 240, width: 48, height: 48 },
  blocksWhileActive: false,
  collectible: true,
  state: 'active',
});

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

describe('BenchmarkSimulation — environmental interaction', () => {
  const approachEast = (sim: BenchmarkSimulation): void => {
    for (let i = 0; i < 120; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
  };

  it('blocks movement through an active obstruction', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    approachEast(sim);
    expect(sim.hunter.position.x).toBeLessThanOrEqual(336 - CONFIG.footprintRadius + 1e-6);
  });

  it('has no target at spawn but acquires one after approaching', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    expect(sim.target).toBeNull();
    approachEast(sim);
    expect(sim.target?.id).toBe('roots');
  });

  it('clears the target on interact and then lets the Hunter pass', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    approachEast(sim);
    const blockedX = sim.hunter.position.x;

    const cleared = sim.tryInteract();
    expect(cleared?.id).toBe('roots');
    expect(sim.interactables.find((i) => i.id === 'roots')?.state).toBe('cleared');

    approachEast(sim);
    expect(sim.hunter.position.x).toBeGreaterThan(blockedX + 20);
  });

  it('interact is single-fire and a no-op with no target in range', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    expect(sim.tryInteract()).toBeNull(); // far away at spawn
    approachEast(sim);
    expect(sim.tryInteract()?.id).toBe('roots');
    expect(sim.tryInteract()).toBeNull(); // already cleared
  });

  it('reset restores interactables to active', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    approachEast(sim);
    sim.tryInteract();
    sim.reset();
    expect(sim.interactables.find((i) => i.id === 'roots')?.state).toBe('active');
    expect(sim.target).toBeNull();
  });
});

describe('BenchmarkSimulation — item pickup / possession log', () => {
  // Steps east until the given interactable is the in-range target (or gives up),
  // so we can pick it up before the (non-blocking) Hunter walks past it.
  const moveEastUntilTarget = (sim: BenchmarkSimulation, id: string): void => {
    for (let i = 0; i < 200; i += 1) {
      if (sim.target?.id === id) {
        return;
      }
      sim.update(set('move-east'), 1 / 60);
    }
  };

  it('has an empty possession log at spawn', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [fragment()]);
    expect(sim.collected).toEqual([]);
  });

  it('does not block movement (the Hunter walks over a collectible)', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [fragment()]);
    for (let i = 0; i < 200; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    // A blocking obstruction with a left face at x=336 would stop a radius-16
    // footprint at x=320; a collectible must let the Hunter pass through it.
    expect(sim.hunter.position.x).toBeGreaterThan(336);
  });

  it('records the item in the possession log when picked up', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [fragment()]);
    moveEastUntilTarget(sim, 'fragment');
    expect(sim.target?.id).toBe('fragment');

    const picked = sim.tryInteract();
    expect(picked?.id).toBe('fragment');
    expect(sim.collected).toEqual([{ id: 'fragment', kind: 'fragment' }]);
    // The item is gone from the world after pickup.
    expect(sim.interactables.find((i) => i.id === 'fragment')?.state).toBe('cleared');
    expect(sim.target).toBeNull();
  });

  it('does not record possession when clearing a non-collectible obstruction', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [overgrowth()]);
    moveEastUntilTarget(sim, 'roots');
    sim.tryInteract();
    expect(sim.collected).toEqual([]);
  });

  it('pickup is single-fire (no duplicate possession record)', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [fragment()]);
    moveEastUntilTarget(sim, 'fragment');
    expect(sim.tryInteract()?.id).toBe('fragment');
    expect(sim.tryInteract()).toBeNull();
    expect(sim.collected).toHaveLength(1);
  });

  it('reset empties the possession log and restores the item', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, [fragment()]);
    moveEastUntilTarget(sim, 'fragment');
    sim.tryInteract();
    sim.reset();
    expect(sim.collected).toEqual([]);
    expect(sim.interactables.find((i) => i.id === 'fragment')?.state).toBe('active');
  });
});
