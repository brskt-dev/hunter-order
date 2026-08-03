# Combat push-apart collision (GD-0006) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the ruin hound hittable in the benchmark by stopping it from stacking on the Hunter's centre — via a soft, combat-gated push-apart — plus a more tolerant point-blank attack, implementing [GD-0006](../../decisions/GD-0006-circumstantial-entity-collision.md) at benchmark scale.

**Architecture:** All logic lives in the Phaser-free gameplay core. A pure `combatSeparation` helper resolves an overlapping hound to a biting-distance standoff; `BenchmarkSimulation.update` applies it only while the hound is engaged (`mode === 'chase'`) and re-resolves the pushed position against world solids. `houndInAttackReach` gains a point-blank radius so a hound right on top connects regardless of facing. The scene only passes one new config field. A separate config-only commit re-applies the perceptible feel-pass values (now that the feel pass is merged into `dev`).

**Tech Stack:** TypeScript, Vitest (node env), Phaser 3.90 (scene adapter only).

## Global Constraints

- This implements the **approved** decision GD-0006 (which amends GD-0004). Entity separation is now legitimate **logical** gameplay in the benchmark sim — this is NOT a GD-0004 violation.
- **Soft push-apart, combat-gated:** separation applies ONLY while the hound is engaged (`mode === 'chase'`). In `patrol` / `return` / `flee`, no separation (GD-0004's overlap behaviour holds).
- **Benchmark scope:** only the hound is displaced by the separation (the player keeps authority over their own position); the general symmetric / Hunter↔Hunter model is future work (GD-0006 open items). Do not build it here.
- **Server authority (ADR-0002)** is unchanged — this is the benchmark-only client simulation; no persistence, no transport.
- **No new combat/damage model (D01 stays open).** Only spacing + hit tolerance are added to the existing repel stub.
- **TDD** for every pure/sim change: failing test first, watch it fail, minimal implementation. Gate: `pnpm validate` green from repo root.
- Do NOT start a dev server / do NOT bind port 5173.

---

### Task 1: config — point-blank attack range

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts` (`combat` block)
- Test: `apps/game-client/src/core/config/benchmark.test.ts`

**Interfaces:**
- Produces: `BENCHMARK.combat.pointBlankRange: number`.

- [ ] **Step 1: Write the failing test**

Add inside `describe('benchmark config', ...)` in `benchmark.test.ts`:

```ts
  it('has a point-blank range within the attack range (GD-0006 combat feel)', () => {
    expect(BENCHMARK.combat.pointBlankRange).toBeGreaterThan(0);
    expect(BENCHMARK.combat.pointBlankRange).toBeLessThanOrEqual(BENCHMARK.combat.attackRange);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: FAIL — `pointBlankRange` is undefined.

- [ ] **Step 3: Add the config**

In `benchmark.ts`, in the `combat` block, add after `attackCooldownSeconds`:

```ts
    /**
     * Point-blank reach (world px): a hound this close connects regardless of the
     * Hunter's facing — forgiving when the creature is right on top of you
     * (GD-0006 combat feel). Smaller than the biting-distance standoff, so at normal
     * range the facing arc still gates the hit.
     */
    pointBlankRange: 30,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/game-client/src/core/config/benchmark.ts apps/game-client/src/core/config/benchmark.test.ts
git commit -m "feat(client): add point-blank attack range config (GD-0006)"
```

---

### Task 2: pure gameplay — combat separation + tolerant attack reach

**Files:**
- Modify: `apps/game-client/src/gameplay/ruin-hound.ts`
- Test: `apps/game-client/src/gameplay/ruin-hound.test.ts`
- Modify: `apps/game-client/src/gameplay/index.ts` (export `combatSeparation`)

**Interfaces:**
- Consumes: `length`, `normalize` from `./vec2` (already imported in ruin-hound.ts), `Vec2`.
- Produces:
  - `combatSeparation(houndPos: Vec2, hunterPos: Vec2, minDistance: number): Vec2`
  - `houndInAttackReach(state, hunterPos, facingVec, range, arcCos, pointBlankRange?: number): boolean` (new optional last param, default `0`).

- [ ] **Step 1: Write the failing tests**

Add to `ruin-hound.test.ts` (import `combatSeparation` alongside the existing imports):

```ts
describe('combatSeparation', () => {
  const hunter = { x: 100, y: 100 };

  it('leaves a hound that is already clear untouched', () => {
    const pos = { x: 100, y: 160 }; // 60 away
    expect(combatSeparation(pos, hunter, 36)).toBe(pos);
  });

  it('pushes an overlapping hound out to exactly minDistance along the away direction', () => {
    const pos = { x: 110, y: 100 }; // 10 away, east
    const out = combatSeparation(pos, hunter, 36);
    expect(out.x).toBeCloseTo(136, 5);
    expect(out.y).toBeCloseTo(100, 5);
  });

  it('resolves a hound coincident with the Hunter to a deterministic standoff', () => {
    const out = combatSeparation({ x: 100, y: 100 }, hunter, 36);
    expect(Math.hypot(out.x - hunter.x, out.y - hunter.y)).toBeCloseTo(36, 5);
  });
});
```

And add point-blank cases to the existing `describe('houndInAttackReach', ...)`:

```ts
  it('connects at point-blank regardless of facing', () => {
    const s = { ...baseState, position: { x: 90, y: 100 } }; // 10px WEST of the hunter
    const east = { x: 1, y: 0 };
    // Facing east, hound is west (behind) → arc fails without point-blank...
    expect(houndInAttackReach(s, { x: 100, y: 100 }, east, 52, 0.5)).toBe(false);
    // ...but within a 30px point-blank it connects regardless of facing.
    expect(houndInAttackReach(s, { x: 100, y: 100 }, east, 52, 0.5, 30)).toBe(true);
  });
```

> Note: use the same state-construction style already used in this file's `houndInAttackReach` block (reuse its existing `s`/`hunter` helpers; the snippet's `baseState`/positions are illustrative — match the file's existing pattern so the hound sits ~10px behind the Hunter's facing).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @hunter-order/game-client test -- ruin-hound.test.ts`
Expected: FAIL — `combatSeparation` is not exported; the point-blank assertion fails (6th arg ignored / function arity).

- [ ] **Step 3: Implement**

In `ruin-hound.ts`, add `combatSeparation` (near `houndInContact`):

```ts
/**
 * Circumstantial combat collision (GD-0006): resolve a hound overlapping the Hunter
 * to a soft, non-stacking standoff. Returns the hound position pushed OUT to
 * `minDistance` from the Hunter along the current separation direction; a hound
 * already at/beyond `minDistance` is returned unchanged (only pushes out, never in).
 * Pure. The caller decides when this applies (only while in combat) and re-resolves
 * the result against world solids.
 */
export function combatSeparation(houndPos: Vec2, hunterPos: Vec2, minDistance: number): Vec2 {
  const away = { x: houndPos.x - hunterPos.x, y: houndPos.y - hunterPos.y };
  const d = length(away);
  if (d >= minDistance) {
    return houndPos;
  }
  if (d < 1e-6) {
    return { x: hunterPos.x + minDistance, y: hunterPos.y };
  }
  const scale = minDistance / d;
  return { x: hunterPos.x + away.x * scale, y: hunterPos.y + away.y * scale };
}
```

Extend `houndInAttackReach` — add the optional `pointBlankRange` param and the early point-blank connect:

```ts
export function houndInAttackReach(
  state: HoundState,
  hunterPos: Vec2,
  facingVec: Vec2,
  range: number,
  arcCos: number,
  pointBlankRange = 0,
): boolean {
  const to = { x: state.position.x - hunterPos.x, y: state.position.y - hunterPos.y };
  const dist = length(to);
  if (dist > range) {
    return false;
  }
  if (dist <= pointBlankRange || dist < 1e-6) {
    return true;
  }
  const dir = normalize(to);
  return dir.x * facingVec.x + dir.y * facingVec.y >= arcCos;
}
```

Update the doc comment above `houndInAttackReach` to mention the point-blank behaviour.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @hunter-order/game-client test -- ruin-hound.test.ts`
Expected: PASS (existing 5-arg calls still pass via the default; new cases pass).

- [ ] **Step 5: Export `combatSeparation` from the barrel**

In `apps/game-client/src/gameplay/index.ts`, add `combatSeparation` to the existing `./ruin-hound` export block (keep it alphabetical: it goes before `createHoundState`).

- [ ] **Step 6: Run the full suite**

Run: `pnpm --filter @hunter-order/game-client test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/gameplay/ruin-hound.ts apps/game-client/src/gameplay/ruin-hound.test.ts apps/game-client/src/gameplay/index.ts
git commit -m "feat(client): add combat push-apart separation + point-blank attack reach (GD-0006)"
```

---

### Task 3: wire separation + tolerant attack into the simulation

**Files:**
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts`
- Test: `apps/game-client/src/gameplay/benchmark-simulation.test.ts`
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (pass the new config field)

**Interfaces:**
- Consumes: `combatSeparation`, `houndInAttackReach` (extended) from `./ruin-hound`; `BENCHMARK.combat.pointBlankRange`.
- Produces: `HunterSimConfig.pointBlankRange: number` (new required field).

- [ ] **Step 1: Write the failing test**

In `benchmark-simulation.test.ts`, first update the existing `CONFIG` literal to include the new field (add `pointBlankRange: 30,`). Then add a test proving the engaged hound no longer stacks. Use the existing test helpers/world; construct a hound whose home waypoint is on top of the Hunter spawn with a large aggro radius so it enters `chase` immediately:

```ts
it('keeps an engaged hound at biting distance instead of stacking on the Hunter (GD-0006)', () => {
  const world = /* same world builder used by the other tests in this file */;
  const spawn = world.spawn;
  const houndConfig = {
    speed: 118,
    footprintRadius: 20,
    waypoints: [spawn, spawn],      // starts on the Hunter
    aggroRadius: 1000,              // immediately chases
    deAggroRadius: 2000,
    contactRadius: 40,
    arriveEpsilon: 6,
    hitsToRepel: 2,
    fleeSpeedMultiplier: 1.4,
  };
  const sim = new BenchmarkSimulation(world, CONFIG, [], houndConfig);
  sim.update(new Set(), 0.1); // no movement input; hound chases onto the Hunter
  const h = sim.hound!;
  const dist = Math.hypot(h.position.x - sim.hunter.position.x, h.position.y - sim.hunter.position.y);
  const minDistance = houndConfig.footprintRadius + CONFIG.footprintRadius; // 20 + 16
  expect(h.mode).toBe('chase');
  expect(dist).toBeGreaterThanOrEqual(minDistance - 0.5);
});
```

> Match the file's existing world-construction pattern (reuse its `createTileWorld(...)` setup / helper). If `CONFIG.footprintRadius` differs in the test, compute `minDistance` from the same values.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark-simulation.test.ts`
Expected: FAIL — without separation the hound sits on the Hunter (`dist ≈ 0`), so `dist >= minDistance` is false. (The `CONFIG` update alone won't pass the new assertion.)

- [ ] **Step 3: Implement the wiring**

In `benchmark-simulation.ts`:

1. Import `combatSeparation` (add to the existing `./ruin-hound` import) and `resolveMovement` is already imported.
2. Add `readonly pointBlankRange: number;` to the `HunterSimConfig` interface (with a short doc comment).
3. In `update`, replace the hound step block:

```ts
    if (this.houndState && this.houndConfig) {
      this.houndState = stepHound(
        this.houndState,
        this.state.position,
        dtSeconds,
        this.world,
        this.houndConfig,
      );
    }
```

with:

```ts
    if (this.houndState && this.houndConfig) {
      let hound = stepHound(
        this.houndState,
        this.state.position,
        dtSeconds,
        this.world,
        this.houndConfig,
      );
      // GD-0006: while engaged (in combat), the hound and Hunter collide via a soft
      // push-apart so the hound holds at biting distance instead of stacking on the
      // Hunter's centre. Benchmark scope: only the hound is displaced (the player keeps
      // authority over its own position); out of combat there is no separation.
      if (hound.mode === 'chase') {
        const minDistance = this.houndConfig.footprintRadius + this.config.footprintRadius;
        const separated = combatSeparation(hound.position, this.state.position, minDistance);
        if (separated !== hound.position) {
          const position = resolveMovement(
            hound.position,
            separated,
            this.houndConfig.footprintRadius,
            this.world.solids,
            this.world.bounds,
          );
          hound = { ...hound, position };
        }
      }
      this.houndState = hound;
    }
```

4. In `tryAttack`, pass the point-blank range to `houndInAttackReach`:

```ts
    const inReach = houndInAttackReach(
      this.houndState,
      this.state.position,
      facing,
      this.config.attackRange,
      this.config.attackArcCos,
      this.config.pointBlankRange,
    );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark-simulation.test.ts`
Expected: PASS (new separation test green; existing sim tests still green with the updated CONFIG).

- [ ] **Step 5: Pass the config field from the scene**

In `apps/game-client/src/scenes/benchmark-scene.ts`, in `create()` where the `BenchmarkSimulation` config object is built, add:

```ts
        pointBlankRange: BENCHMARK.combat.pointBlankRange,
```

(next to `attackArcCos: BENCHMARK.combat.attackArcCos,`).

- [ ] **Step 6: Full validation**

Run: `pnpm validate`
Expected: PASS — lint + typecheck (no missing `pointBlankRange` anywhere) + full suite + build.

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/gameplay/benchmark-simulation.test.ts apps/game-client/src/scenes/benchmark-scene.ts
git commit -m "feat(client): engaged hound holds at biting distance + tolerant point-blank hit (GD-0006)"
```

---

### Task 4: re-apply the perceptible feel-pass values (config only)

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts` (`feel` block + `combatCamera.exitSmoothing`)

Rationale: the feel pass merged into `dev` with deliberately-restrained values that proved imperceptible in playtest. Re-apply the "perceptible but restrained" candidate so the Game Design Lead can tune feel now that combat is hittable. Values remain open/tunable.

- [ ] **Step 1: Apply the candidate values**

In `benchmark.ts`, set the `feel` block values to: `hitStopSeconds: 0.09`, `shakePeakPx: 8`, `shakeDecayRate: 7`, `shakeFrequency: 55`, `flashDecayRate: 6`, `recoilPeakPx: 16`, `recoilDecayRate: 9`, `pickupPopScale: 1.3`, `pickupPopMs: 240`. Set `combatCamera.exitSmoothing: 1.6`.

Keep the existing `benchmark.test.ts` bounds satisfied (they are: `shakePeakPx 8 ≤ 6`? NO — the existing test asserts `shakePeakPx ≤ 6`). **Update that bound** in `benchmark.test.ts` to `≤ 10` so 8 passes, keeping the "restrained" intent (still a small offset). Also confirm `hitStopSeconds 0.09 ≤ 0.12` ✓, `pickupPopScale 1.3 ≤ 1.4` ✓, `exitSmoothing 1.6 ≤ intensitySmoothing 4` ✓.

- [ ] **Step 2: Run the config test**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: PASS (with the updated `shakePeakPx` bound).

- [ ] **Step 3: Commit**

```bash
git add apps/game-client/src/core/config/benchmark.ts apps/game-client/src/core/config/benchmark.test.ts
git commit -m "tune(client): perceptible feel-pass values for playtest (values remain open)"
```

---

### Task 5: verify, nightly report, draft PR

**Files:**
- Create: `docs/agent/reports/2026-07-30-combat-push-apart-collision.md`

- [ ] **Step 1: Full validation**

Run: `pnpm validate`
Expected: PASS.

- [ ] **Step 2: Write the nightly report**

Create the report per `docs/agent/report-template.md`: outcome (GD-0006 benchmark combat collision — engaged hound holds at biting distance, tolerant point-blank hit, feel values re-tuned), status, changes, decisions applied (GD-0006; benchmark-scope hound-only displacement), how to verify (walk to hound, it no longer overlaps you; hits land; out of combat it still overlaps), what's deferred (symmetric/Hunter↔Hunter model, D01), risks.

- [ ] **Step 3: Commit the report**

```bash
git add docs/agent/reports/2026-07-30-combat-push-apart-collision.md
git commit -m "docs: record the GD-0006 combat push-apart nightly report"
```

- [ ] **Step 4: Push and open a draft PR to `dev`**

```bash
git push -u origin agent/combat-push-apart-collision
gh pr create --draft --base dev --title "feat(client): combat push-apart collision + tolerant hit (GD-0006)" --body "<summary + GD-0006 link + feel re-tune note>"
```

Do NOT merge. Report the PR URL to the user.

---

## Self-Review

**Spec coverage (vs GD-0006):** soft push-apart, combat-gated (chase only) → Task 3; benchmark hound-only displacement → Task 3; tolerant point-blank attack → Tasks 1+2+3; out-of-combat overlap preserved (no separation in patrol/return/flee) → Task 3 (gated on `mode === 'chase'`); feel re-tune so it's testable → Task 4; report/PR → Task 5. ✓

**Placeholder scan:** the two integration-test snippets say "match the file's existing world/state construction" rather than pasting helpers the implementer must reconcile — this is intentional (reuse existing patterns), not a placeholder for logic. All production code is shown in full.

**Type consistency:** `combatSeparation(houndPos, hunterPos, minDistance)` and the 6-arg `houndInAttackReach(..., pointBlankRange?)` names/signatures match across Tasks 2 and 3. `HunterSimConfig.pointBlankRange` (Task 3) ← `BENCHMARK.combat.pointBlankRange` (Task 1) ← scene passes it (Task 3). ✓
