import { describe, expect, it } from 'vitest';

import {
  BenchmarkSimulation,
  type CombatModelConfig,
  type HunterSimConfig,
  type StandInSimConfig,
  stepHunter,
} from './benchmark-simulation';
import { type Interactable } from './interaction';
import { type MovementAction } from './movement-intent';
import { type RuinHoundConfig } from './ruin-hound';
import { length, vec2 } from './vec2';
import { createTileWorld, tileCentre, type TileWorld } from './world';

const CONFIG: HunterSimConfig = {
  speed: 140,
  footprintRadius: 16,
  interactRange: 40,
  attackRange: 60,
  attackArcCos: 0.5,
  attackCooldownSeconds: 0.35,
  pointBlankRange: 30,
};

// Mirrors BENCHMARK.combatModel's shape (GD-0007); kept independent so this
// suite stays decoupled from core/config, same as CONFIG above.
const COMBAT_MODEL: CombatModelConfig = {
  hunterMaxHp: 5,
  playerAttackDamage: 1,
  hound: { maxHp: 2, contactDamage: 1, contactCooldownSeconds: 1.2, downedSeconds: 0.6 },
  standIn: { maxHp: 3, punchDamage: 1, downedSeconds: 0.6 },
};

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
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    expect(sim.hunter.position).toEqual({ x: 264, y: 264 });
    expect(sim.hunter.facing).toBe('s');
  });

  it('stays put and keeps facing when idle', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    sim.update(noActions, 1 / 60);
    expect(sim.hunter.position).toEqual({ x: 264, y: 264 });
    expect(sim.hunter.facing).toBe('s');
  });

  it('moves in the intent direction and updates facing', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    sim.update(set('move-east'), 1 / 60);
    expect(sim.hunter.position.x).toBeGreaterThan(264);
    expect(sim.hunter.position.y).toBeCloseTo(264);
    expect(sim.hunter.facing).toBe('e');
  });

  it('keeps the last facing after movement stops', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    sim.update(set('move-east'), 1 / 60);
    sim.update(noActions, 1 / 60);
    expect(sim.hunter.facing).toBe('e');
  });

  it('cannot walk through a solid wall', () => {
    const sim = new BenchmarkSimulation(walledWorld(), CONFIG, COMBAT_MODEL);
    for (let i = 0; i < 200; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    expect(sim.hunter.position.x).toBeLessThanOrEqual(384 - CONFIG.footprintRadius + 1e-6);
    expect(sim.hunter.facing).toBe('e');
  });

  it('resets to the spawn state', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
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
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
    approachEast(sim);
    expect(sim.hunter.position.x).toBeLessThanOrEqual(336 - CONFIG.footprintRadius + 1e-6);
  });

  it('has no target at spawn but acquires one after approaching', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
    expect(sim.target).toBeNull();
    approachEast(sim);
    expect(sim.target?.id).toBe('roots');
  });

  it('clears the target on interact and then lets the Hunter pass', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
    approachEast(sim);
    const blockedX = sim.hunter.position.x;

    const cleared = sim.tryInteract();
    expect(cleared?.id).toBe('roots');
    expect(sim.interactables.find((i) => i.id === 'roots')?.state).toBe('cleared');

    approachEast(sim);
    expect(sim.hunter.position.x).toBeGreaterThan(blockedX + 20);
  });

  it('interact is single-fire and a no-op with no target in range', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
    expect(sim.tryInteract()).toBeNull(); // far away at spawn
    approachEast(sim);
    expect(sim.tryInteract()?.id).toBe('roots');
    expect(sim.tryInteract()).toBeNull(); // already cleared
  });

  it('reset restores interactables to active', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
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
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [fragment()]);
    expect(sim.collected).toEqual([]);
  });

  it('does not block movement (the Hunter walks over a collectible)', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [fragment()]);
    for (let i = 0; i < 200; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    // A blocking obstruction with a left face at x=336 would stop a radius-16
    // footprint at x=320; a collectible must let the Hunter pass through it.
    expect(sim.hunter.position.x).toBeGreaterThan(336);
  });

  it('records the item in the possession log when picked up', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [fragment()]);
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
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [overgrowth()]);
    moveEastUntilTarget(sim, 'roots');
    sim.tryInteract();
    expect(sim.collected).toEqual([]);
  });

  it('pickup is single-fire (no duplicate possession record)', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [fragment()]);
    moveEastUntilTarget(sim, 'fragment');
    expect(sim.tryInteract()?.id).toBe('fragment');
    expect(sim.tryInteract()).toBeNull();
    expect(sim.collected).toHaveLength(1);
  });

  it('reset empties the possession log and restores the item', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [fragment()]);
    moveEastUntilTarget(sim, 'fragment');
    sim.tryInteract();
    sim.reset();
    expect(sim.collected).toEqual([]);
    expect(sim.interactables.find((i) => i.id === 'fragment')?.state).toBe('active');
  });
});

describe('BenchmarkSimulation — ruin-hound threat', () => {
  // Home just east of spawn (x=264) so approaching the Hunter trips the aggro.
  const houndConfig = (): RuinHoundConfig => ({
    speed: 90,
    footprintRadius: 20,
    waypoints: [vec2(450, 264)],
    aggroRadius: 130,
    deAggroRadius: 260,
    contactRadius: 40,
    arriveEpsilon: 6,
  });

  const withHound = (): BenchmarkSimulation =>
    new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [houndConfig()]);

  it('has no hound and no threat when none is configured', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    expect(sim.hounds.length).toBe(0);
    expect(sim.threatEngaged).toBe(false);
    expect(sim.inDanger).toBe(false);
  });

  it('spawns the hound patrolling at home', () => {
    const sim = withHound();
    expect(sim.hounds[0]?.mode).toBe('patrol');
    expect(sim.hounds[0]?.position).toEqual({ x: 450, y: 264 });
    expect(sim.threatEngaged).toBe(false);
  });

  it('engages and closes on an approaching Hunter', () => {
    const sim = withHound();
    for (let i = 0; i < 200 && !sim.threatEngaged; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    expect(sim.threatEngaged).toBe(true);
    for (let i = 0; i < 300 && !sim.inDanger; i += 1) {
      sim.update(noActions, 1 / 60);
    }
    expect(sim.inDanger).toBe(true);
  });

  it('stays calm while the Hunter keeps its distance', () => {
    const sim = withHound();
    for (let i = 0; i < 120; i += 1) {
      sim.update(noActions, 1 / 60); // Hunter never leaves the spawn pocket
    }
    expect(sim.threatEngaged).toBe(false);
    expect(sim.inDanger).toBe(false);
  });

  it('reset returns the hound to patrol at home', () => {
    const sim = withHound();
    for (let i = 0; i < 200 && !sim.threatEngaged; i += 1) {
      sim.update(set('move-east'), 1 / 60);
    }
    sim.reset();
    expect(sim.hounds[0]?.mode).toBe('patrol');
    expect(sim.hounds[0]?.position).toEqual({ x: 450, y: 264 });
    expect(sim.threatEngaged).toBe(false);
  });

  it('keeps an engaged hound at biting distance instead of stacking on the Hunter (GD-0006)', () => {
    const world = openWorld();
    const spawn = world.spawn;
    const engagedHoundConfig: RuinHoundConfig = {
      speed: 118,
      footprintRadius: 20,
      waypoints: [spawn, spawn], // starts on the Hunter
      aggroRadius: 1000, // immediately chases
      deAggroRadius: 2000,
      contactRadius: 40,
      arriveEpsilon: 6,
      fleeSpeedMultiplier: 1.4,
    };
    const sim = new BenchmarkSimulation(world, CONFIG, COMBAT_MODEL, [], [engagedHoundConfig]);
    sim.update(noActions, 0.1); // no movement input; hound chases onto the Hunter
    const h = sim.hounds[0];
    const dist = Math.hypot(
      h.position.x - sim.hunter.position.x,
      h.position.y - sim.hunter.position.y,
    );
    const minDistance = engagedHoundConfig.footprintRadius + CONFIG.footprintRadius; // 20 + 16
    expect(h.mode).toBe('chase');
    expect(dist).toBeGreaterThanOrEqual(minDistance - 0.5);
  });
});

describe('BenchmarkSimulation — multiple hounds (GD-0006 pack)', () => {
  it('steps multiple hounds; each holds at biting distance and none stack on each other', () => {
    const world = openWorld();
    // The open world's spawn tile is (5, 5) — see `openWorld` above.
    const mk = (col: number, row: number): RuinHoundConfig => ({
      speed: 118,
      footprintRadius: 20,
      waypoints: [
        tileCentre(col, row, world.tileSize),
        tileCentre(col, row, world.tileSize),
      ],
      aggroRadius: 1000, // immediately chases
      deAggroRadius: 2000,
      contactRadius: 40,
      arriveEpsilon: 6,
      fleeSpeedMultiplier: 1.4,
    });
    // Two hounds spawned on top of the Hunter (and each other) — both chase
    // immediately and must separate from the Hunter AND from each other.
    const sim = new BenchmarkSimulation(world, CONFIG, COMBAT_MODEL, [], [mk(5, 5), mk(5, 5)]);
    sim.update(noActions, 0.1);
    const [h0, h1] = sim.hounds;
    const pairDist = Math.hypot(h0.position.x - h1.position.x, h0.position.y - h1.position.y);
    expect(sim.hounds.length).toBe(2);
    expect(h0.mode).toBe('chase');
    expect(h1.mode).toBe('chase');
    expect(pairDist).toBeGreaterThan(1); // creature<->creature separation kicked in
  });

  it('tryAttack hits the nearest in-reach hound and reports its index', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [
      // Far hound, still in reach; near hound is the one that should be hit.
      {
        speed: 0,
        footprintRadius: 20,
        waypoints: [vec2(310, 264)],
        aggroRadius: 500,
        deAggroRadius: 1000,
        contactRadius: 40,
        arriveEpsilon: 6,
      },
      {
        speed: 0,
        footprintRadius: 20,
        waypoints: [vec2(300, 264)],
        aggroRadius: 500,
        deAggroRadius: 1000,
        contactRadius: 40,
        arriveEpsilon: 6,
      },
    ]);
    sim.update(set('move-east'), 1 / 60); // face east toward both hounds
    const result = sim.tryAttack();
    expect(result.hit).toBe(true);
    expect(result.hitIndex).toBe(1); // hound[1] (x=300) is nearer than hound[0] (x=310)
    expect(sim.houndHp[1]).toBe(COMBAT_MODEL.hound.maxHp - 1);
    expect(sim.houndHp[0]).toBe(COMBAT_MODEL.hound.maxHp);
  });
});

describe('BenchmarkSimulation — axe attack (offense stub)', () => {
  // A stationary hound due east of spawn, always aggroed — lets us face it and
  // swing deterministically without a moving-target chase.
  const staticHound = (): RuinHoundConfig => ({
    speed: 0,
    footprintRadius: 20,
    waypoints: [vec2(320, 264)],
    aggroRadius: 500,
    deAggroRadius: 1000,
    contactRadius: 40,
    arriveEpsilon: 6,
  });

  it('swings but misses when nothing is in reach', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL); // no hound
    const r = sim.tryAttack();
    expect(r.swung).toBe(true);
    expect(r.hit).toBe(false);
    expect(r.repelled).toBe(false);
    expect(r.hitIndex).toBeNull();
  });

  it('does not connect a second time while on cooldown', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [staticHound()]);
    sim.update(set('move-east'), 1 / 60); // face east toward the hound, within reach
    const first = sim.tryAttack();
    expect(first.hit).toBe(true);
    expect(first.hitIndex).toBe(0);
    expect(sim.tryAttack().swung).toBe(false); // still cooling down
  });

  it('damages a hound on a connecting hit and defeats it at 0 HP (GD-0007)', () => {
    // COMBAT_MODEL: hound maxHp 2, playerAttackDamage 1.
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [staticHound()]);
    sim.update(set('move-east'), 1 / 60); // face east toward the hound, within reach
    const first = sim.tryAttack();
    expect(first.hit).toBe(true);
    expect(first.repelled).toBe(false); // 2 -> 1
    expect(sim.houndHp[0]).toBe(1);
    sim.update(noActions, 0.4); // wait out the attack cooldown
    const second = sim.tryAttack();
    expect(second.repelled).toBe(true); // 1 -> 0 => defeated
    expect(sim.houndHp[0]).toBe(0);
    expect(sim.houndDowned[0]).toBe(true); // briefly downed before it flees
  });

  it('drives the hound off (flee) after enough hits, once the downed timer runs out (GD-0007)', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [staticHound()]);
    sim.update(set('move-east'), 1 / 60); // face east toward the hound
    let defeated = false;
    for (let i = 0; i < 300 && !defeated; i += 1) {
      if (sim.tryAttack().repelled) {
        defeated = true;
      }
      sim.update(noActions, 1 / 60); // hold facing, advance the attack cooldown
    }
    expect(defeated).toBe(true);
    // Still downed (frozen), not yet fled — see the dedicated downed test above.
    expect(sim.threatEngaged).toBe(true);
    for (let i = 0; i < 120 && sim.hounds[0]?.mode !== 'flee'; i += 1) {
      sim.update(noActions, 1 / 60); // wait out the downed timer
    }
    expect(sim.hounds[0]?.mode).toBe('flee');
    expect(sim.houndDowned[0]).toBe(false);
    expect(sim.threatEngaged).toBe(false);
  });

  it('reset clears combat so the hound can be fought again', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL, [], [staticHound()]);
    sim.update(set('move-east'), 1 / 60);
    for (let i = 0; i < 300 && sim.hounds[0]?.mode !== 'flee'; i += 1) {
      sim.tryAttack();
      sim.update(noActions, 1 / 60);
    }
    expect(sim.hounds[0]?.mode).toBe('flee');
    sim.reset();
    expect(sim.hounds[0]?.mode).toBe('patrol');
    expect(sim.houndHp[0]).toBe(COMBAT_MODEL.hound.maxHp);
    expect(sim.houndDowned[0]).toBe(false);
    expect(sim.tryAttack().swung).toBe(true); // cooldown was reset
  });
});

describe('BenchmarkSimulation — stand-in Hunter / mutual combat (GD-0006 PvP test-bed)', () => {
  const standInConfig: StandInSimConfig = {
    speed: 120,
    footprintRadius: 16,
    wanderTurnRate: 0.8,
    combatSpeedMultiplier: 1.0,
    attackRange: 40,
    attackCooldownSeconds: 0.8,
  };
  const pvpCombatSeconds = 3;

  // Due south of spawn (264, 264), well within attackRange (60) and squarely in
  // the default south-facing arc — the Hunter can hit it without moving first.
  const standInSpawn = vec2(264, 304);

  const withStandIn = (spawn = standInSpawn): BenchmarkSimulation =>
    new BenchmarkSimulation(
      openWorld(),
      CONFIG,
      COMBAT_MODEL,
      [],
      [],
      standInConfig,
      spawn,
      pvpCombatSeconds,
    );

  it('has no stand-in and pvp is not engaged when none is configured', () => {
    const sim = new BenchmarkSimulation(openWorld(), CONFIG, COMBAT_MODEL);
    expect(sim.otherHunter).toBeNull();
    expect(sim.pvpEngaged).toBe(false);
  });

  it('spawns the stand-in Hunter at its configured spawn, not yet engaged', () => {
    const sim = withStandIn();
    expect(sim.otherHunter?.position).toEqual(standInSpawn);
    expect(sim.pvpEngaged).toBe(false);
  });

  it('wanders when idle (not engaged), without requiring an attack', () => {
    const sim = withStandIn();
    const before = sim.otherHunter!.position;
    sim.update(noActions, 0.1);
    expect(sim.otherHunter!.position).not.toEqual(before);
    expect(sim.pvpEngaged).toBe(false);
  });

  it('tryAttack on the in-reach stand-in engages pvp and it then retaliates by chasing the player', () => {
    const sim = withStandIn();
    const result = sim.tryAttack();
    expect(result.hitOtherHunter).toBe(true);
    expect(result.hitIndex).toBeNull(); // no hound was hit
    expect(sim.pvpEngaged).toBe(true);

    const before = sim.otherHunter!.position;
    sim.update(noActions, 0.1);
    // The player (north of the stand-in) never moved; retaliating (GD-0006 stub)
    // means chasing toward the player — moving north, y decreases.
    expect(sim.otherHunter!.position.y).toBeLessThan(before.y);
  });

  // Waits out the player's own attack cooldown in small steps (rather than one
  // big `dt`) so the retaliating stand-in's chase + combat-separation doesn't
  // overshoot past the player in a single huge integration step and end up
  // outside the facing arc — mirrors how the other stand-in tests step (1/60).
  const settleAttackCooldown = (sim: BenchmarkSimulation): void => {
    for (let i = 0; i < 30; i += 1) {
      sim.update(noActions, 1 / 60);
    }
  };

  it('damages the stand-in on a connecting hit and downs it at 0 HP (GD-0007)', () => {
    // No hound in reach; stand-in in front. standIn maxHp 3, playerAttackDamage 1.
    const sim = withStandIn();
    const first = sim.tryAttack(); // 3 -> 2, starts pvp
    expect(first.hitOtherHunter).toBe(true);
    expect(sim.standInHp).toBe(2);
    expect(sim.pvpEngaged).toBe(true);
    expect(sim.standInDowned).toBe(false);

    settleAttackCooldown(sim);
    sim.tryAttack(); // 2 -> 1
    expect(sim.standInHp).toBe(1);
    settleAttackCooldown(sim);
    sim.tryAttack(); // 1 -> 0 => downed
    expect(sim.standInHp).toBe(0);
    expect(sim.standInDowned).toBe(true);
  });

  it('respawns the stand-in at full HP once the downed timer runs out (GD-0007)', () => {
    const sim = withStandIn();
    sim.tryAttack(); // 3 -> 2
    settleAttackCooldown(sim);
    sim.tryAttack(); // 2 -> 1
    settleAttackCooldown(sim);
    sim.tryAttack(); // 1 -> 0 => downed
    expect(sim.standInDowned).toBe(true);

    for (let i = 0; i < 120 && sim.standInDowned; i += 1) {
      sim.update(noActions, 1 / 60); // wait out the downed timer
    }
    expect(sim.standInDowned).toBe(false);
    expect(sim.standInHp).toBe(COMBAT_MODEL.standIn.maxHp);
    expect(sim.otherHunter?.position).toEqual(standInSpawn);
    expect(sim.pvpEngaged).toBe(false);
  });

  it('a hound within reach wins over the stand-in (hitOtherHunter stays false)', () => {
    const staticHound: RuinHoundConfig = {
      speed: 0,
      footprintRadius: 20,
      waypoints: [vec2(264, 300)], // slightly nearer than the stand-in at (264, 304)
      aggroRadius: 500,
      deAggroRadius: 1000,
      contactRadius: 40,
      arriveEpsilon: 6,
    };
    const sim = new BenchmarkSimulation(
      openWorld(),
      CONFIG,
      COMBAT_MODEL,
      [],
      [staticHound],
      standInConfig,
      standInSpawn,
      pvpCombatSeconds,
    );
    const result = sim.tryAttack();
    expect(result.hit).toBe(true);
    expect(result.hitIndex).toBe(0);
    expect(result.hitOtherHunter).toBe(false);
    expect(sim.pvpEngaged).toBe(false);
  });

  it('keeps the stand-in at biting distance from the player while pvp is engaged, without moving the player (GD-0006)', () => {
    // Spawn the stand-in right on the player so combat separation must act.
    const sim = withStandIn(vec2(264, 264));
    sim.tryAttack();
    expect(sim.pvpEngaged).toBe(true);

    const playerBefore = sim.hunter.position;
    for (let i = 0; i < 10; i += 1) {
      sim.update(noActions, 1 / 60);
    }
    const minDistance = standInConfig.footprintRadius + CONFIG.footprintRadius;
    const dist = length({
      x: sim.otherHunter!.position.x - sim.hunter.position.x,
      y: sim.otherHunter!.position.y - sim.hunter.position.y,
    });
    expect(dist).toBeGreaterThanOrEqual(minDistance - 0.5);
    // Only the stand-in is displaced by combat separation — the player keeps authority.
    expect(sim.hunter.position).toEqual(playerBefore);
  });

  it('pvp disengages after pvpCombatSeconds and separation stops applying', () => {
    const sim = withStandIn();
    sim.tryAttack();
    expect(sim.pvpEngaged).toBe(true);
    sim.update(noActions, pvpCombatSeconds + 0.1);
    expect(sim.pvpEngaged).toBe(false);
  });

  it('reset clears pvp engagement and returns the stand-in to its spawn', () => {
    const sim = withStandIn();
    sim.tryAttack();
    sim.update(noActions, 0.1);
    sim.reset();
    expect(sim.pvpEngaged).toBe(false);
    expect(sim.otherHunter?.position).toEqual(standInSpawn);
  });

  it('has no punch pulse before anything has happened', () => {
    const sim = withStandIn();
    expect(sim.standInStruck).toBe(false);
  });

  it('punches the player once in range while engaged, refreshing the mutual-combat timer, without moving the player', () => {
    // Within the stand-in's own attackRange (40) even before it takes a step.
    const sim = withStandIn(vec2(264, 290));
    const playerBefore = sim.hunter.position;
    const engage = sim.tryAttack();
    expect(engage.hitOtherHunter).toBe(true);
    expect(sim.pvpEngaged).toBe(true);

    sim.update(noActions, 1 / 60);
    expect(sim.standInStruck).toBe(true);
    expect(sim.hunter.position).toEqual(playerBefore); // player never moved
    // The stand-in's own punch keeps the mutual-combat timer alive.
    sim.update(noActions, pvpCombatSeconds - 0.05);
    expect(sim.pvpEngaged).toBe(true);
  });

  it('does not punch again while its own cooldown is still active', () => {
    const sim = withStandIn(vec2(264, 290));
    sim.tryAttack();
    sim.update(noActions, 1 / 60);
    expect(sim.standInStruck).toBe(true);
    sim.update(noActions, 1 / 60); // well within attackCooldownSeconds (0.8)
    expect(sim.standInStruck).toBe(false);
  });

  it('does not punch while out of the stand-in attackRange', () => {
    // Distance 50 > stand-in attackRange (40), but within the player's own
    // attackRange (60) so tryAttack still engages pvp.
    const sim = withStandIn(vec2(264, 314));
    sim.tryAttack();
    expect(sim.pvpEngaged).toBe(true);
    sim.update(noActions, 1 / 60);
    expect(sim.standInStruck).toBe(false);
  });

  it('reset zeroes the punch pulse and cooldown', () => {
    const sim = withStandIn(vec2(264, 290));
    sim.tryAttack();
    sim.update(noActions, 1 / 60);
    expect(sim.standInStruck).toBe(true);
    sim.reset();
    expect(sim.standInStruck).toBe(false);
  });
});
