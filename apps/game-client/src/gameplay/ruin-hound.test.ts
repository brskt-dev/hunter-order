import { describe, expect, it } from 'vitest';

import {
  combatSeparation,
  createHoundState,
  houndInAttackReach,
  houndInContact,
  type HoundState,
  registerHoundHit,
  type RuinHoundConfig,
  stepHound,
} from './ruin-hound';
import { length, vec2 } from './vec2';
import { createTileWorld, type TileWorld } from './world';

// Home at (200,200), a second patrol point at (400,200): the hound paces east/west.
const CONFIG: RuinHoundConfig = {
  speed: 100,
  footprintRadius: 20,
  waypoints: [vec2(200, 200), vec2(400, 200)],
  aggroRadius: 100,
  deAggroRadius: 200,
  contactRadius: 30,
  arriveEpsilon: 4,
  hitsToRepel: 2,
};

// Same behaviour but with a huge aggro radius, so the hound chases across the whole
// map — used to exercise collision/bounds while chasing.
const FAR_AGGRO: RuinHoundConfig = { ...CONFIG, aggroRadius: 5000, deAggroRadius: 6000 };

const openWorld = (): TileWorld =>
  createTileWorld({ cols: 20, rows: 20, tileSize: 48, spawnTile: { col: 5, row: 5 }, solidTiles: [] });

// A vertical wall spanning x∈[384,432].
const walledWorld = (): TileWorld =>
  createTileWorld({
    cols: 20,
    rows: 20,
    tileSize: 48,
    spawnTile: { col: 1, row: 1 },
    solidTiles: [{ col: 8, row: 0, cols: 1, rows: 20 }],
  });

const distTo = (state: HoundState, x: number, y: number): number =>
  length({ x: x - state.position.x, y: y - state.position.y });

describe('createHoundState', () => {
  it('starts at home, patrolling toward the next waypoint, unhurt', () => {
    const s = createHoundState(CONFIG);
    expect(s.position).toEqual({ x: 200, y: 200 });
    expect(s.mode).toBe('patrol');
    expect(s.waypointIndex).toBe(1);
    expect(s.hits).toBe(0);
  });
});

describe('stepHound — patrol', () => {
  it('moves toward the next patrol waypoint when the Hunter is far', () => {
    const s = stepHound(createHoundState(CONFIG), vec2(1000, 1000), 0.1, openWorld(), CONFIG);
    expect(s.mode).toBe('patrol');
    expect(s.position.x).toBeGreaterThan(200);
    expect(s.position.y).toBeCloseTo(200);
    expect(s.facing).toBe('e');
  });

  it('reverses direction at a waypoint (ping-pong patrol)', () => {
    let s = createHoundState(CONFIG);
    const world = openWorld();
    let maxX = s.position.x;
    let reversed = false;
    for (let i = 0; i < 80; i += 1) {
      s = stepHound(s, vec2(1000, 1000), 0.1, world, CONFIG);
      maxX = Math.max(maxX, s.position.x);
      if (maxX > 396 && s.position.x < maxX - 5) {
        reversed = true;
      }
    }
    expect(maxX).toBeGreaterThan(396); // reached the far waypoint (~400)
    expect(reversed).toBe(true); // then headed back home
    expect(s.mode).toBe('patrol');
  });
});

describe('stepHound — aggro / chase with hysteresis', () => {
  it('enters chase when the Hunter comes within the aggro radius', () => {
    const s = stepHound(createHoundState(CONFIG), vec2(250, 200), 0.1, openWorld(), CONFIG);
    expect(s.mode).toBe('chase');
    expect(s.position.x).toBeGreaterThan(200); // stepping toward the Hunter
  });

  it('does NOT chase a Hunter between the aggro and de-aggro radii while patrolling', () => {
    // dist 150: > aggro (100), < de-aggro (200) → stays patrol.
    const s = stepHound(createHoundState(CONFIG), vec2(350, 200), 0.1, openWorld(), CONFIG);
    expect(s.mode).toBe('patrol');
  });

  it('keeps chasing until the Hunter passes the (larger) de-aggro radius', () => {
    const chasing: HoundState = { ...createHoundState(CONFIG), position: vec2(300, 200), mode: 'chase' };
    // dist 150 (< de-aggro 200) → still chasing.
    expect(stepHound(chasing, vec2(450, 200), 0.1, openWorld(), CONFIG).mode).toBe('chase');
    // dist 300 (≥ de-aggro 200) → give up and return.
    expect(stepHound(chasing, vec2(600, 200), 0.1, openWorld(), CONFIG).mode).toBe('return');
  });

  it('closes distance to the Hunter while chasing', () => {
    let s: HoundState = createHoundState(CONFIG);
    const world = openWorld();
    const before = distTo(s, 290, 200);
    for (let i = 0; i < 8; i += 1) {
      s = stepHound(s, vec2(290, 200), 0.1, world, CONFIG);
    }
    expect(distTo(s, 290, 200)).toBeLessThan(before);
    expect(s.mode).toBe('chase');
  });
});

describe('stepHound — return then resume patrol', () => {
  it('resumes patrol once it gets home', () => {
    const returning: HoundState = { ...createHoundState(CONFIG), position: vec2(202, 200), mode: 'return' };
    const s = stepHound(returning, vec2(2000, 2000), 0.1, openWorld(), CONFIG);
    expect(s.mode).toBe('patrol');
  });
});

describe('stepHound — collision and bounds', () => {
  it('does not chase through a solid wall', () => {
    let s: HoundState = createHoundState(FAR_AGGRO);
    const world = walledWorld();
    for (let i = 0; i < 200; i += 1) {
      s = stepHound(s, vec2(600, 200), 1 / 60, world, FAR_AGGRO);
    }
    // Wall left face at x=384; a radius-20 footprint stops at x=364.
    expect(s.position.x).toBeLessThanOrEqual(364 + 1e-6);
  });

  it('never leaves the world bounds', () => {
    let s: HoundState = { ...createHoundState(FAR_AGGRO), position: vec2(900, 200) };
    const world = openWorld(); // 960×960
    for (let i = 0; i < 200; i += 1) {
      s = stepHound(s, vec2(5000, 200), 1 / 60, world, FAR_AGGRO);
    }
    expect(s.position.x).toBeLessThanOrEqual(940 + 1e-6); // 960 - footprint 20
  });

  it('does not mutate the input state', () => {
    const s = createHoundState(CONFIG);
    stepHound(s, vec2(250, 200), 0.1, openWorld(), CONFIG);
    expect(s.position).toEqual({ x: 200, y: 200 });
    expect(s.mode).toBe('patrol');
  });
});

describe('houndInContact', () => {
  it('is true within the contact radius and false beyond it', () => {
    const s = createHoundState(CONFIG); // at (200,200), contactRadius 30
    expect(houndInContact(s, vec2(220, 200), CONFIG)).toBe(true); // dist 20
    expect(houndInContact(s, vec2(240, 200), CONFIG)).toBe(false); // dist 40
  });
});

describe('registerHoundHit', () => {
  it('counts hits but stays engaged until the repel threshold', () => {
    const chasing: HoundState = { ...createHoundState(CONFIG), mode: 'chase' };
    const once = registerHoundHit(chasing, CONFIG); // hitsToRepel = 2
    expect(once.hits).toBe(1);
    expect(once.mode).toBe('chase');
  });

  it('flees once hits reach the repel threshold', () => {
    const hurt: HoundState = { ...createHoundState(CONFIG), mode: 'chase', hits: 1 };
    const repelled = registerHoundHit(hurt, CONFIG);
    expect(repelled.hits).toBe(2);
    expect(repelled.mode).toBe('flee');
  });

  it('does not mutate the input state', () => {
    const s: HoundState = { ...createHoundState(CONFIG), mode: 'chase' };
    registerHoundHit(s, CONFIG);
    expect(s.hits).toBe(0);
    expect(s.mode).toBe('chase');
  });
});

describe('stepHound — flee (terminal)', () => {
  it('moves away from the Hunter and stays fleeing', () => {
    const fleeing: HoundState = { ...createHoundState(CONFIG), position: vec2(200, 200), mode: 'flee' };
    // Hunter to the west → the hound should run east (away).
    const s = stepHound(fleeing, vec2(100, 200), 0.1, openWorld(), CONFIG);
    expect(s.mode).toBe('flee');
    expect(s.position.x).toBeGreaterThan(200);
  });

  it('never re-engages even when the Hunter is adjacent', () => {
    const fleeing: HoundState = { ...createHoundState(CONFIG), position: vec2(200, 200), mode: 'flee' };
    const s = stepHound(fleeing, vec2(210, 200), 0.1, openWorld(), CONFIG); // within aggro/contact
    expect(s.mode).toBe('flee');
  });
});

describe('houndInAttackReach', () => {
  // Hunter at (200,200) facing east; range 52, ~120° arc (arcCos 0.5).
  const hunter = vec2(200, 200);
  const east = vec2(1, 0);

  it('connects on a hound within range and inside the facing arc', () => {
    const s: HoundState = { ...createHoundState(CONFIG), position: vec2(240, 200) }; // dist 40, dead ahead
    expect(houndInAttackReach(s, hunter, east, 52, 0.5)).toBe(true);
  });

  it('misses a hound behind the Hunter', () => {
    const s: HoundState = { ...createHoundState(CONFIG), position: vec2(160, 200) }; // west, behind
    expect(houndInAttackReach(s, hunter, east, 52, 0.5)).toBe(false);
  });

  it('misses a hound out of range', () => {
    const s: HoundState = { ...createHoundState(CONFIG), position: vec2(300, 200) }; // dist 100 > 52
    expect(houndInAttackReach(s, hunter, east, 52, 0.5)).toBe(false);
  });

  it('connects at point-blank regardless of facing', () => {
    // 10px WEST of (behind) the hunter, who faces east.
    const s: HoundState = { ...createHoundState(CONFIG), position: vec2(190, 200) };
    // Behind the Hunter and outside the facing arc: misses without point-blank.
    expect(houndInAttackReach(s, hunter, east, 52, 0.5)).toBe(false);
    // Within a 30px point-blank range, it connects regardless of facing.
    expect(houndInAttackReach(s, hunter, east, 52, 0.5, 30)).toBe(true);
  });
});

describe('combatSeparation', () => {
  const hunter = vec2(100, 100);

  it('leaves a hound that is already clear untouched', () => {
    const pos = vec2(100, 160); // 60 away
    expect(combatSeparation(pos, hunter, 36)).toBe(pos);
  });

  it('pushes an overlapping hound out to exactly minDistance along the away direction', () => {
    const pos = vec2(110, 100); // 10 away, east
    const out = combatSeparation(pos, hunter, 36);
    expect(out.x).toBeCloseTo(136, 5);
    expect(out.y).toBeCloseTo(100, 5);
  });

  it('resolves a hound coincident with the Hunter to a deterministic standoff', () => {
    const out = combatSeparation(vec2(100, 100), hunter, 36);
    expect(Math.hypot(out.x - hunter.x, out.y - hunter.y)).toBeCloseTo(36, 5);
  });
});
