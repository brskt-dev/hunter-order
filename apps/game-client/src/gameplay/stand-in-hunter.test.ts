import { describe, expect, it } from 'vitest';

import { createStandInHunter, type StandInHunterConfig, stepStandInHunter } from './stand-in-hunter';
import { createTileWorld } from './world';

const CFG: StandInHunterConfig = { speed: 120, footprintRadius: 16, wanderTurnRate: 0.8, fleeSpeedMultiplier: 1.25 };
const world = createTileWorld({ cols: 64, rows: 64, tileSize: 48, spawnTile: { col: 4, row: 4 }, solidTiles: [] });

describe('stand-in hunter', () => {
  it('starts at the given spawn', () => {
    const s = createStandInHunter({ x: 300, y: 300 });
    expect(s.position).toEqual({ x: 300, y: 300 });
  });

  it('flees away from the player while in combat', () => {
    const s = createStandInHunter({ x: 300, y: 300 });
    const player = { x: 260, y: 300 }; // player to the WEST
    const next = stepStandInHunter(s, player, true, 0.1, world, CFG);
    expect(next.position.x).toBeGreaterThan(s.position.x); // moved EAST, away from player
  });

  it('wanders (moves) when not in combat, without leaving the world', () => {
    const s = createStandInHunter({ x: 300, y: 300 });
    const next = stepStandInHunter(s, { x: 0, y: 0 }, false, 0.1, world, CFG);
    expect(next.position).not.toEqual(s.position);
    expect(next.wanderPhase).not.toBe(s.wanderPhase);
  });
});
