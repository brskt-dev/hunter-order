# Combat test-bed (multi-hound + stand-in Hunter) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a benchmark-only combat test-bed — a small pack of ruin hounds plus a second "stand-in player" Hunter with simple AI — to exercise the full GD-0006 collision model (creature↔Hunter, creature↔creature, and Hunter↔Hunter in combat) and multi-target combat.

**Architecture:** All logic stays in the Phaser-free gameplay core, driven by a new `BENCHMARK.sandbox` config block (empty → original 1-Hunter/1-hound benchmark; populated → the test-bed). The simulation is refactored from a single hound to a list of hounds that each chase the nearest Hunter, with pairwise soft separation among hounds (both in combat) and between each hound and the Hunter it engages. A pure stand-in-Hunter module wanders and flees; attacking it starts a mutual-combat timer that enables Hunter↔Hunter push-apart. The scene renders the collections and applies per-hound hit feel.

**Tech Stack:** TypeScript, Vitest (node env), Phaser 3.90 (scene adapter only). This builds directly on GD-0006 (`combatSeparation`, already on this branch, PR #19).

## Global Constraints

- **Benchmark-only / non-authoritative test tooling.** Config-driven and reversible (empty `sandbox` lists → original benchmark). Server authority (ADR-0002) unchanged. No persistence/transport.
- **GD-0006 rules:** collision is soft push-apart, gated by combat state. Creature↔Hunter and creature↔creature apply while the creatures are engaged (`mode === 'chase'`); Hunter↔Hunter applies only while a **mutual-combat timer** is active. Out of combat, entities overlap freely.
- **PvP combat-state is a benchmark STUB** (GD-0006 left the Hunter↔Hunter enter/exit model open). Attacking the stand-in Hunter starts/refreshes a timer; that is a test stand-in, not the final rule. No damage/defeat model (D01 stays open).
- **Feel:** on a landed hound hit, flash + recoil + hit-stop apply to **that hound only**; camera shake stays global.
- **TDD** for every pure/sim change. Gate: `pnpm validate` green from repo root. Do NOT start a dev server / bind 5173.
- Work stays on branch `agent/combat-push-apart-collision` (PR #19).

---

### Task 1: config — `sandbox` test-bed block

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts`
- Test: `apps/game-client/src/core/config/benchmark.test.ts`

**Interfaces produced:** `BENCHMARK.sandbox = { extraHoundTiles: {col,row}[]; otherHunterTile: {col,row} | null; pvpCombatSeconds: number; otherHunter: { speed:number; footprintRadius:number; wanderTurnRate:number; fleeSpeedMultiplier:number } }`.

- [ ] **Step 1: Write the failing test**

Add inside `describe('benchmark config', ...)`:

```ts
  it('has a sandbox test-bed block with in-grid spawns', () => {
    const s = BENCHMARK.sandbox;
    expect(s.pvpCombatSeconds).toBeGreaterThan(0);
    expect(s.otherHunter.speed).toBeGreaterThan(0);
    for (const t of s.extraHoundTiles) {
      expect(t.col).toBeGreaterThanOrEqual(0);
      expect(t.row).toBeGreaterThanOrEqual(0);
      expect(t.col).toBeLessThan(BENCHMARK.world.cols);
      expect(t.row).toBeLessThan(BENCHMARK.world.rows);
    }
    if (s.otherHunterTile) {
      expect(s.otherHunterTile.col).toBeLessThan(BENCHMARK.world.cols);
      expect(s.otherHunterTile.row).toBeLessThan(BENCHMARK.world.rows);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: FAIL — `BENCHMARK.sandbox` undefined.

- [ ] **Step 3: Add the config**

In `benchmark.ts`, add after the `feel` block (before `oblique`):

```ts
  /**
   * Combat test-bed (BENCHMARK TEST-ONLY, non-authoritative). Populated lists turn
   * the scene into a combat sandbox: a small pack of extra ruin hounds and a second
   * "stand-in player" Hunter with simple AI, to exercise the GD-0006 collision model
   * (creature↔Hunter, creature↔creature, Hunter↔Hunter in combat) and multi-target
   * combat. Empty lists / null → the original 1-Hunter/1-hound first-playable-loop.
   * Not part of the approved benchmark composition — a test fixture.
   */
  sandbox: {
    /** Extra ruin hounds (besides BENCHMARK.hound), spawned at these tiles. */
    extraHoundTiles: [
      { col: 24, row: 24 },
      { col: 22, row: 26 },
    ],
    /** The stand-in Hunter's spawn tile (null → no second Hunter). */
    otherHunterTile: { col: 12, row: 12 },
    /** Seconds a mutual-combat timer stays active after attacking the stand-in Hunter. */
    pvpCombatSeconds: 3,
    /** Simple-AI stand-in Hunter tunables. */
    otherHunter: {
      speed: 120,
      footprintRadius: Math.round(0.33 * 48),
      /** Radians/sec the wander heading rotates (deterministic wander). */
      wanderTurnRate: 0.8,
      /** Speed multiplier while fleeing the player during mutual combat. */
      fleeSpeedMultiplier: 1.25,
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/game-client/src/core/config/benchmark.ts apps/game-client/src/core/config/benchmark.test.ts
git commit -m "feat(client): add benchmark combat test-bed config (sandbox)"
```

---

### Task 2: pure helpers — symmetric separation + nearest-of

**Files:**
- Modify: `apps/game-client/src/gameplay/ruin-hound.ts`
- Test: `apps/game-client/src/gameplay/ruin-hound.test.ts`
- Modify: `apps/game-client/src/gameplay/index.ts` (barrel exports)

**Interfaces produced:**
- `separatePairSymmetric(a: Vec2, b: Vec2, minDistance: number): [Vec2, Vec2]` — both bodies pushed half the overlap apart (order-independent); unchanged when already clear.
- `nearestOf(from: Vec2, points: readonly Vec2[]): Vec2 | null` — nearest point (null if empty).

- [ ] **Step 1: Write the failing tests**

Add to `ruin-hound.test.ts` (import the two new symbols):

```ts
describe('separatePairSymmetric', () => {
  it('leaves a clear pair untouched (same references)', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 50, y: 0 };
    const [ra, rb] = separatePairSymmetric(a, b, 36);
    expect(ra).toBe(a);
    expect(rb).toBe(b);
  });

  it('pushes an overlapping pair apart to exactly minDistance, symmetrically', () => {
    const a = { x: 10, y: 0 };
    const b = { x: 20, y: 0 }; // 10 apart along +x
    const [ra, rb] = separatePairSymmetric(a, b, 36);
    expect(Math.hypot(ra.x - rb.x, ra.y - rb.y)).toBeCloseTo(36, 5);
    // symmetric: each moved 13 (half of 26 overlap); a goes -x, b goes +x
    expect(ra.x).toBeCloseTo(-3, 5);
    expect(rb.x).toBeCloseTo(33, 5);
  });

  it('resolves a coincident pair deterministically along +x', () => {
    const [ra, rb] = separatePairSymmetric({ x: 5, y: 5 }, { x: 5, y: 5 }, 36);
    expect(Math.hypot(ra.x - rb.x, ra.y - rb.y)).toBeCloseTo(36, 5);
  });
});

describe('nearestOf', () => {
  it('returns null for an empty list', () => {
    expect(nearestOf({ x: 0, y: 0 }, [])).toBeNull();
  });
  it('returns the nearest point', () => {
    const near = { x: 1, y: 0 };
    expect(nearestOf({ x: 0, y: 0 }, [{ x: 10, y: 0 }, near, { x: 5, y: 5 }])).toBe(near);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @hunter-order/game-client test -- ruin-hound.test.ts`
Expected: FAIL — the two functions are not exported.

- [ ] **Step 3: Implement**

In `ruin-hound.ts` (near `combatSeparation`):

```ts
/**
 * Symmetric soft push-apart for two engaged bodies (GD-0006 creature↔creature): each
 * is moved half the overlap along their shared centre line, so neither acts as a hard
 * wall and the outcome is order-independent. A pair already at/beyond `minDistance` is
 * returned unchanged (same references). Pure; caller re-resolves against world solids.
 */
export function separatePairSymmetric(a: Vec2, b: Vec2, minDistance: number): [Vec2, Vec2] {
  const delta = { x: a.x - b.x, y: a.y - b.y };
  const d = length(delta);
  if (d >= minDistance) {
    return [a, b];
  }
  const dir = d < 1e-6 ? { x: 1, y: 0 } : normalize(delta);
  const push = (minDistance - d) / 2;
  return [
    { x: a.x + dir.x * push, y: a.y + dir.y * push },
    { x: b.x - dir.x * push, y: b.y - dir.y * push },
  ];
}

/** The nearest point in `points` to `from`, or null when `points` is empty. Pure. */
export function nearestOf(from: Vec2, points: readonly Vec2[]): Vec2 | null {
  let best: Vec2 | null = null;
  let bestD = Infinity;
  for (const p of points) {
    const d = (p.x - from.x) ** 2 + (p.y - from.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @hunter-order/game-client test -- ruin-hound.test.ts`
Expected: PASS.

- [ ] **Step 5: Export from the barrel**

In `gameplay/index.ts`, add `nearestOf` and `separatePairSymmetric` to the `./ruin-hound` export block (keep alphabetical).

- [ ] **Step 6: Full suite + commit**

Run: `pnpm --filter @hunter-order/game-client test` (expect PASS), then:

```bash
git add apps/game-client/src/gameplay/ruin-hound.ts apps/game-client/src/gameplay/ruin-hound.test.ts apps/game-client/src/gameplay/index.ts
git commit -m "feat(client): add symmetric pair separation + nearestOf helpers (GD-0006 test-bed)"
```

---

### Task 3: simulation — multiple hounds targeting the nearest Hunter

**Files:**
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts`
- Test: `apps/game-client/src/gameplay/benchmark-simulation.test.ts`
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (construction only)

**Interfaces produced:**
- Constructor takes `houndConfigs: readonly RuinHoundConfig[]` (replaces the single `houndConfig`).
- `get hounds(): readonly HoundState[]`.
- `get hound(): HoundState | null` — TEMPORARY back-compat (returns `hounds[0] ?? null`); removed in Task 5.
- `AttackResult` gains `hitIndex: number | null` (index into `hounds` of the hound hit, else null).
- `hunterPositions(): Vec2[]` helper (player + stand-in when present; stand-in added in Task 4 — for now just `[player]`).

- [ ] **Step 1: Write the failing test**

In `benchmark-simulation.test.ts`, migrate the existing single-hound usage to the array constructor (pass `[houndConfig]`) and update any `sim.hound` reads that should now be `sim.hounds[0]`. Then add a multi-hound test:

```ts
it('steps multiple hounds; each holds at biting distance and none stack on each other', () => {
  const world = /* the file's open-world builder */;
  const spawn = world.spawn;
  const mk = (col: number, row: number) => ({
    speed: 118, footprintRadius: 20,
    waypoints: [tileCentre(col, row, 48), tileCentre(col, row, 48)],
    aggroRadius: 1000, deAggroRadius: 2000, contactRadius: 40, arriveEpsilon: 6,
    hitsToRepel: 2, fleeSpeedMultiplier: 1.4,
  });
  // Two hounds spawned on top of each other near the Hunter → both chase, must separate.
  const sim = new BenchmarkSimulation(world, CONFIG, [], [mk(spawn.col ?? 5, spawn.row ?? 5), mk(5, 5)]);
  sim.update(new Set(), 0.1);
  const [h0, h1] = sim.hounds;
  const pairDist = Math.hypot(h0.position.x - h1.position.x, h0.position.y - h1.position.y);
  expect(sim.hounds.length).toBe(2);
  expect(pairDist).toBeGreaterThan(1); // creature↔creature separation kicked in
});
```

> Match the file's existing world/`tileCentre` construction; the snippet's spawn handling is illustrative. The essential assertions: two hounds exist and do not remain coincident after a step.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark-simulation.test.ts`
Expected: FAIL — constructor signature / `hounds` getter absent.

- [ ] **Step 3: Implement the multi-hound sim**

In `benchmark-simulation.ts`:

1. Import `combatSeparation`, `separatePairSymmetric`, `nearestOf` from `./ruin-hound`.
2. Replace the single `houndState`/`houndConfig` with `houndStates: HoundState[]` and store `houndConfigs: readonly RuinHoundConfig[]`. Constructor param `houndConfig: RuinHoundConfig | null` → `houndConfigs: readonly RuinHoundConfig[] = []`. Build `houndStates = houndConfigs.map((c) => createHoundState(c))`.
3. Add a private `hunterPositions(): Vec2[]` returning `[this.state.position]` (Task 4 appends the stand-in).
4. Getters: `get hounds(): readonly HoundState[] { return this.houndStates; }`; TEMP `get hound(): HoundState | null { return this.houndStates[0] ?? null; }`; `threatEngaged` → `this.houndStates.some((h) => h.mode === 'chase')`; `inDanger` → `this.houndStates.some((h, i) => houndInContact(h, this.state.position, this.houndConfigs[i]))`.
5. In `update`, replace the single-hound block: for each hound i, `const target = nearestOf(hound.position, this.hunterPositions()) ?? this.state.position;` step it toward `target`; if `hound.mode === 'chase'` apply `combatSeparation` (min = `this.houndConfigs[i].footprintRadius + this.config.footprintRadius`) vs the SAME `target`, re-resolved via `resolveMovement`. Collect into a new array. Then a **creature↔creature pass** (2 iterations for stability): for each pair (i<j) with BOTH `mode === 'chase'`, `separatePairSymmetric(pos_i, pos_j, r_i + r_j)`, re-resolve each moved position via `resolveMovement`, write back. Assign `this.houndStates`.
6. `tryAttack`: iterate hounds, compute reach via `houndInAttackReach(h, pos, facing, attackRange, attackArcCos, pointBlankRange)`; among those in reach pick the **nearest**; if found, `registerHoundHit` that one, set `hitIndex`, return `{ swung:true, hit:true, repelled: that.mode==='flee', hitIndex }`. If none in reach → `{ swung:true, hit:false, repelled:false, hitIndex:null }`. On cooldown → `{ swung:false, hit:false, repelled:false, hitIndex:null }`.
7. `reset`: rebuild `houndStates` from `houndConfigs`.
8. Update `AttackResult` interface with `hitIndex: number | null`.

- [ ] **Step 4: Update the scene construction (keep it compiling)**

In `benchmark-scene.ts` `create()`: build the hound-config LIST and pass it. Replace `this.buildHoundConfig()` (single) with a list: the primary `BENCHMARK.hound` plus one per `BENCHMARK.sandbox.extraHoundTiles` (same config shape, different `patrolTiles`/home = the extra tile). Add a `buildHoundConfigs(): RuinHoundConfig[]` method (generalise the existing `buildHoundConfig`). Pass the array to `new BenchmarkSimulation(..., this.buildHoundConfigs())`. The render code still uses the temp `this.sim.hound` getter (renders hound[0]) — unchanged this task.

- [ ] **Step 5: Full validation**

Run: `pnpm validate`
Expected: PASS (build compiles via the temp `hound` getter; sim tests updated and green).

- [ ] **Step 6: Commit**

```bash
git add apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/gameplay/benchmark-simulation.test.ts apps/game-client/src/scenes/benchmark-scene.ts
git commit -m "feat(client): simulate a pack of hounds targeting the nearest Hunter (GD-0006 test-bed)"
```

---

### Task 4: simulation — stand-in Hunter + mutual-combat timer

**Files:**
- Create: `apps/game-client/src/gameplay/stand-in-hunter.ts`
- Test: `apps/game-client/src/gameplay/stand-in-hunter.test.ts`
- Modify: `apps/game-client/src/gameplay/index.ts` (barrel)
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts`
- Test: `apps/game-client/src/gameplay/benchmark-simulation.test.ts`

**Interfaces produced:**
- `interface StandInHunterState { position: Vec2; facing: Direction8; wanderPhase: number }`
- `interface StandInHunterConfig { speed: number; footprintRadius: number; wanderTurnRate: number; fleeSpeedMultiplier: number }`
- `createStandInHunter(spawn: Vec2): StandInHunterState`
- `stepStandInHunter(state, playerPos, inCombat, dtSeconds, world, config): StandInHunterState`
- Sim: `get otherHunter(): StandInHunterState | null`; `get pvpEngaged(): boolean` (mutual-combat timer > 0); constructor gains optional `standInConfig` + spawn; `AttackResult` gains `hitOtherHunter: boolean`.

- [ ] **Step 1: Write the failing tests (pure module)**

Create `stand-in-hunter.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm --filter @hunter-order/game-client test -- stand-in-hunter.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the pure module**

Create `stand-in-hunter.ts`:

```ts
// BENCHMARK TEST-ONLY, non-authoritative: a simple stand-in "other player" Hunter for
// the combat test-bed. Wanders deterministically; flees from the player while a mutual
// combat is active. Reuses the same movement + collision primitives as the Hunter.
import { resolveMovement } from './collision';
import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import { stepPosition } from './movement';
import { length, normalize, type Vec2 } from './vec2';
import type { TileWorld } from './world';

export interface StandInHunterState {
  readonly position: Vec2;
  readonly facing: Direction8;
  readonly wanderPhase: number;
}

export interface StandInHunterConfig {
  readonly speed: number;
  readonly footprintRadius: number;
  readonly wanderTurnRate: number;
  readonly fleeSpeedMultiplier: number;
}

export function createStandInHunter(spawn: Vec2): StandInHunterState {
  return { position: spawn, facing: DEFAULT_FACING, wanderPhase: 0 };
}

export function stepStandInHunter(
  state: StandInHunterState,
  playerPos: Vec2,
  inCombat: boolean,
  dtSeconds: number,
  world: TileWorld,
  config: StandInHunterConfig,
): StandInHunterState {
  const wanderPhase = state.wanderPhase + config.wanderTurnRate * dtSeconds;
  let intent: Vec2;
  let speed = config.speed;
  if (inCombat) {
    const away = { x: state.position.x - playerPos.x, y: state.position.y - playerPos.y };
    intent = length(away) > 1e-6 ? normalize(away) : { x: 1, y: 0 };
    speed = config.speed * config.fleeSpeedMultiplier;
  } else {
    intent = { x: Math.cos(wanderPhase), y: Math.sin(wanderPhase) };
  }
  const desired = stepPosition(state.position, intent, speed, dtSeconds);
  const position = resolveMovement(state.position, desired, config.footprintRadius, world.solids, world.bounds);
  return { position, facing: directionFromVector(intent, state.facing), wanderPhase };
}
```

Export both functions + types from `gameplay/index.ts` (`./stand-in-hunter`).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @hunter-order/game-client test -- stand-in-hunter.test.ts` → PASS.

- [ ] **Step 5: Wire into the simulation (TDD)**

First add a failing sim test: construct a sim with a stand-in Hunter; `tryAttack` while the stand-in is in front/in reach starts `pvpEngaged` (true) and the stand-in then flees; also assert Hunter↔Hunter separation keeps them apart while engaged. (Match the file's world/CONFIG patterns; place the stand-in within `attackRange` in front of the player's default facing.)

Then implement in `benchmark-simulation.ts`:
- Import the stand-in module + `combatSeparation`.
- Constructor: optional `standInConfig: StandInHunterConfig | null = null` and `standInSpawn: Vec2 | null = null`; if both present, `this.otherHunterState = createStandInHunter(standInSpawn)`, else null. Add `private pvpTimer = 0` and store `pvpCombatSeconds` (pass via config or constructor param — add to constructor).
- `hunterPositions()` now returns `[player, ...(otherHunter ? [otherHunter.position] : [])]`.
- Getters: `get otherHunter()`, `get pvpEngaged() { return this.pvpTimer > 0; }`.
- `update`: after stepping hounds, if `otherHunterState`, `this.otherHunterState = stepStandInHunter(state, this.state.position, this.pvpEngaged, dt, this.world, standInConfig)`. Then, while `pvpEngaged`, apply `combatSeparation` between the PLAYER-adjacent bodies: push the stand-in out to `standInConfig.footprintRadius + this.config.footprintRadius` from the player (only the stand-in is displaced, mirroring the hound rule), re-resolved vs solids. Decrement `this.pvpTimer = Math.max(0, this.pvpTimer - dt)`.
- `tryAttack`: after the hound check, if no hound was hit AND the stand-in is within reach (`attackRange` + arc or point-blank, reuse `houndInAttackReach`-style check on the stand-in position — or a small inline distance+arc check), set `this.pvpTimer = pvpCombatSeconds` and return `{ ...swung/hit..., hitOtherHunter: true }`. Extend `AttackResult` with `hitOtherHunter: boolean` (default false elsewhere). If a hound is the nearer target, it wins (hound hit) and `hitOtherHunter` stays false.
- `reset`: reset `otherHunterState` + `pvpTimer = 0`.

- [ ] **Step 6: Full validation + commit**

Run: `pnpm validate` → PASS.

```bash
git add apps/game-client/src/gameplay/stand-in-hunter.ts apps/game-client/src/gameplay/stand-in-hunter.test.ts apps/game-client/src/gameplay/index.ts apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/gameplay/benchmark-simulation.test.ts
git commit -m "feat(client): stand-in Hunter AI + mutual-combat Hunter↔Hunter separation (GD-0006 test-bed)"
```

---

### Task 5: scene — render the pack + the stand-in Hunter + per-hound hit feel

**Files:**
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts`

This is the thin Phaser adapter — no unit tests; gate is `pnpm validate` + a visual check. Generalise the existing single-hound rendering to a collection and add the stand-in Hunter.

- [ ] **Step 1: Generalise hound rendering to a collection**

Replace the single-hound fields (`hound`, `houndShadow`, `houndFacingTick`, `houndSprite`, `houndPrev`, `houndRunReady`, `houndFlash`) with a `HoundView` interface and a parallel array `private houndViews: HoundView[] = []`:

```ts
interface HoundView {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  flash?: Phaser.GameObjects.Ellipse;
  sprite?: Phaser.GameObjects.Sprite;
  facingTick?: Phaser.GameObjects.Rectangle;
  prev?: Vec2;
}
```

- `createHounds()` builds one `HoundView` per `this.sim.hounds` entry (generalise the existing `createHound` body into a per-hound factory). `registerHoundAnimations()` stays (shared anim keys).
- `renderHounds()` loops `this.sim.hounds` with the parallel `houndViews[i]`, applying the existing per-hound logic (position, depth by feet Y, shadow grounding, run/idle animation, moving detection via `view.prev`).
- Remove the temporary `sim.hound` getter usage; after this task the sim's temp `get hound()` can be deleted (do it in this commit: remove it from `benchmark-simulation.ts`).

- [ ] **Step 2: Per-hound hit feel**

The scene's `impact` envelope (camera shake + hit-stop timing) stays global. On a landed hit, record which hound: in `handleAttack`, use `result.hitIndex` to set `private recoilHoundIndex: number | null`. In `renderHounds`, apply recoil + flash + the hit-stop animation hold ONLY to `houndViews[recoilHoundIndex]` (others render normally). Camera shake stays global in `updateCombatCamera`.

- [ ] **Step 3: Render the stand-in Hunter**

Add a `standIn` view (a Hunter-style container in a distinct colour + shadow + facing tick). `createStandIn()` when `this.sim.otherHunter` exists; `renderStandIn()` mirrors the Hunter render (position, feet-Y depth, grounded shadow). Add a config colour `colors.otherHunter` (e.g. a cooler tone) — add it to `benchmark.ts` `colors` in this task (small) or reuse an existing tone; prefer adding `otherHunter: 0x9aa8c0` and `otherHunterFacing`.

- [ ] **Step 4: Build the test-bed entities from config**

`buildHoundConfigs()` (from Task 3) already adds `BENCHMARK.sandbox.extraHoundTiles`. Here, pass the stand-in config + spawn to the simulation constructor when `BENCHMARK.sandbox.otherHunterTile` is set (compute its world position via `tileCentre`), plus `pvpCombatSeconds`.

- [ ] **Step 5: Full validation**

Run: `pnpm validate`
Expected: PASS — no leftover single-hound references, temp `hound` getter removed, no unused vars.

- [ ] **Step 6: Commit**

```bash
git add apps/game-client/src/scenes/benchmark-scene.ts apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/core/config/benchmark.ts
git commit -m "feat(client): render the hound pack + stand-in Hunter with per-hound hit feel (GD-0006 test-bed)"
```

---

### Task 6: verify, report, update PR #19

- [ ] **Step 1: Full validation** — `pnpm validate` green.
- [ ] **Step 2: Nightly report** — create `docs/agent/reports/2026-07-30-combat-testbed.md` per the template: outcome (combat test-bed — hound pack targeting nearest Hunter, creature↔creature + Hunter↔Hunter separation, stand-in Hunter AI, per-hound feel), status, changes, decisions applied (config-driven/reversible; PvP combat-timer stub), how to verify (attack a hound → it recoils/flashes; walk into the pack → they don't stack; walk through the stand-in normally → pass through; attack it → they collide + it flees), deferred (final PvP model, D01), risks.
- [ ] **Step 3: Commit the report.**
- [ ] **Step 4: Push to PR #19** — `git push` (same branch `agent/combat-push-apart-collision`). Update the PR #19 body to note the test-bed addition. Do NOT merge.

---

## Self-Review

**Coverage:** config-driven reversible test-bed → Task 1; symmetric + nearest helpers → Task 2; multi-hound sim, nearest-Hunter targeting, creature↔Hunter + creature↔creature separation, multi-target attack + hitIndex → Task 3; stand-in Hunter AI (wander/flee) + mutual-combat timer + Hunter↔Hunter separation + PvP attack trigger → Task 4; scene render of the pack + stand-in + per-hound feel + remove temp getter → Task 5; report/PR → Task 6. ✓

**Intermediate-state note:** Task 3 keeps a temporary `get hound()` so the scene compiles while still rendering one hound; Task 5 removes it and renders all. Each task ends `pnpm validate`-green — this is an intentional, documented seam, not a placeholder.

**Type consistency:** `separatePairSymmetric`/`nearestOf`/`combatSeparation` (ruin-hound), `StandInHunterState`/`stepStandInHunter` (stand-in-hunter), `AttackResult.hitIndex`/`hitOtherHunter`, `hounds`/`otherHunter`/`pvpEngaged` getters, and `BENCHMARK.sandbox.*` names are used consistently across Tasks 1–5. ✓

**GD-0006 fidelity:** all separation is soft + combat-gated (creatures in `chase`; Hunters while `pvpEngaged`); only the "other" body is displaced against the player (player keeps authority); out of combat everything overlaps. The PvP timer is a labelled benchmark stub, not the final rule. ✓
