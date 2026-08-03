# Benchmark combat model (GD-0007) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make combat real in the benchmark per [GD-0007](../../decisions/GD-0007-benchmark-combat-model.md): HP on the player, hounds and the stand-in; the player's attack deals damage; hounds (on contact) and the stand-in (on punch) deal damage to the player; entities are defeated (brief "downed" → the creature vanishes / the stand-in resets); the player respawns at the safe pocket on defeat; and a real PvP combat-state. Restrained over-head HP bars (only in combat) + a discreet player HP indicator.

**Architecture:** All combat state is orchestrated in the benchmark simulation (`BenchmarkSimulation`) — HP and cooldowns/downed-timers live in the sim as arrays/fields parallel to the existing entity states; the pure movement modules stay movement-only. The hound's old `hitsToRepel`/`registerHoundHit`/`hits` repel stub is REPLACED by HP + damage; defeat sets the hound's terminal `flee` mode after a brief downed freeze. The scene renders HP bars and defeat/respawn feedback. Everything is **benchmark-only / non-authoritative** (server untouched; ADR-0002).

**Tech Stack:** TypeScript, Vitest (node env), Phaser 3.90. Builds on GD-0006 + the test-bed (multi-hound + stand-in) already on this branch (PR #19).

## Global Constraints

- **Benchmark-only / non-authoritative** (GD-0007). Numbers are provisional tuning, not balance. NO permadeath (player defeat = respawn + encounter reset, keeping progress). Server-authoritative resolution/balancing/death-model remain future.
- **Player authority:** the player's logical position is only changed by its own movement and the defeat-respawn — never by separation (GD-0006 holds).
- **Restrained feedback** (benchmark contextual-UI rule): over-head HP bars appear only while in combat or recently damaged, and hide otherwise; a small player HP indicator. No always-on MMO bars.
- **TDD** for all sim/pure changes. Gate: `pnpm validate` green from repo root (lint enforced — keep imports/exports sorted). Do NOT start a dev server / bind 5173.
- Work stays on branch `agent/combat-push-apart-collision` (PR #19).

---

### Task 1: config — `combatModel` block (replaces the repel stub)

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts`
- Test: `apps/game-client/src/core/config/benchmark.test.ts`

**Interfaces produced:** `BENCHMARK.combatModel = { hunterMaxHp, playerAttackDamage, hound:{ maxHp, contactDamage, contactCooldownSeconds, downedSeconds }, standIn:{ maxHp, punchDamage, downedSeconds } }`. `BENCHMARK.hound.hitsToRepel` is REMOVED.

- [ ] **Step 1: Write the failing test**

In `benchmark.test.ts`: (a) replace the existing `hitsToRepel` assertion (in the "has sane hand-axe / repel tunables" test — it references `BENCHMARK.hound.hitsToRepel`) with combat-model assertions; (b) add a combat-model sanity test:

```ts
  it('has a benchmark combat model with positive HP and damage', () => {
    const c = BENCHMARK.combatModel;
    for (const v of [
      c.hunterMaxHp, c.playerAttackDamage,
      c.hound.maxHp, c.hound.contactDamage, c.hound.contactCooldownSeconds, c.hound.downedSeconds,
      c.standIn.maxHp, c.standIn.punchDamage, c.standIn.downedSeconds,
    ]) {
      expect(v).toBeGreaterThan(0);
    }
    // A few axe hits should down a hound / the stand-in (benchmark pacing).
    expect(c.hound.maxHp).toBeLessThanOrEqual(c.playerAttackDamage * 5);
    expect(c.standIn.maxHp).toBeLessThanOrEqual(c.playerAttackDamage * 6);
  });
```

Also remove the `expect(BENCHMARK.hound.hitsToRepel)...` line from the existing test.

- [ ] **Step 2: Run → fail** (`pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`) — `combatModel` undefined (and the old test still references the to-be-removed field until you edit it).

- [ ] **Step 3: Add the config, remove `hitsToRepel`**

In `benchmark.ts`: delete `hitsToRepel` from the `hound` block. Add a `combatModel` block after the `combat` block:

```ts
  /**
   * Benchmark combat model (GD-0007 — BENCHMARK-ONLY, non-authoritative). HP,
   * fixed per-hit damage, and brief "downed" durations. Provisional tuning, NOT
   * approved balance; the server-authoritative model is future work.
   */
  combatModel: {
    /** Player Hunter max HP. */
    hunterMaxHp: 5,
    /** Damage the player's axe/punch deals per connecting hit. */
    playerAttackDamage: 1,
    hound: {
      /** Hound HP (was the `hitsToRepel` repel stub). */
      maxHp: 2,
      /** Damage a hound deals to the player per contact bite. */
      contactDamage: 1,
      /** Seconds between a hound's contact bites. */
      contactCooldownSeconds: 1.2,
      /** Seconds a hound stays "downed" (frozen) before it flees/vanishes. */
      downedSeconds: 0.6,
    },
    standIn: {
      /** Stand-in Hunter HP. */
      maxHp: 3,
      /** Damage the stand-in's punch deals to the player. */
      punchDamage: 1,
      /** Seconds the stand-in stays "downed" before it recedes/resets. */
      downedSeconds: 0.6,
    },
  },
```

- [ ] **Step 4: Run → pass** (`pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`). Then confirm nothing else referenced `hitsToRepel`: grep `hitsToRepel` across `apps/game-client/src` — any remaining refs (ruin-hound config/tests, scene `buildHoundConfigs`) will be handled in Tasks 2–3, but note them.

- [ ] **Step 5: Commit** — `git add` the two files; `git commit -m "feat(client): add benchmark combat model config; drop the hound hitsToRepel stub (GD-0007)"`.

> Note: removing `hitsToRepel` will break the type of `RuinHoundConfig` consumers until Task 2/3. If `pnpm validate` (full) is run here it may fail typecheck; this task's gate is the focused `benchmark.test.ts` run. Tasks 2 and 3 restore a green `pnpm validate`.

---

### Task 2: pure `ruin-hound` — replace the hit/repel stub with a defeat helper

**Files:**
- Modify: `apps/game-client/src/gameplay/ruin-hound.ts` (+ test)
- Modify: `apps/game-client/src/gameplay/index.ts` (barrel)

**Interfaces:**
- `HoundState` loses `hits`. `RuinHoundConfig` loses `hitsToRepel`.
- Remove `registerHoundHit`.
- Add `defeatHound(state: HoundState): HoundState` → `{ ...state, mode: 'flee' }` (the defeated hound runs off; the sim decides *when* via HP). Pure. Export from the barrel; remove the `registerHoundHit` export.

- [ ] **Step 1: Update the tests first (RED)**

In `ruin-hound.test.ts`: remove the `registerHoundHit` describe/tests and any `hits`/`hitsToRepel` usage; add:

```ts
describe('defeatHound', () => {
  it('sends the hound into terminal flee', () => {
    const s = createHoundState(CONFIG); // CONFIG without hitsToRepel
    expect(defeatHound({ ...s, mode: 'chase' }).mode).toBe('flee');
  });
});
```

Update the file's `CONFIG`/fixtures to drop `hitsToRepel`. Run → fail (`defeatHound` not exported; `hits` refs gone).

- [ ] **Step 2: Implement**

In `ruin-hound.ts`: remove `hits` from `HoundState`; remove `hitsToRepel` from `RuinHoundConfig`; `createHoundState` drops `hits`; delete `registerHoundHit`; add:

```ts
/**
 * Marks a hound as defeated: it enters the terminal `flee` mode and runs off
 * (the benchmark's "downed → vanish", GD-0007). The caller (sim) decides WHEN a
 * hound is defeated, from HP. Pure.
 */
export function defeatHound(state: HoundState): HoundState {
  return { ...state, mode: 'flee' };
}
```

Update `gameplay/index.ts`: drop `registerHoundHit`, add `defeatHound` (sorted).

- [ ] **Step 3: Run → pass** (`pnpm --filter @hunter-order/game-client test -- ruin-hound.test.ts`).

- [ ] **Step 4: Commit** — `git commit -m "refactor(client): replace hound registerHoundHit/hits with a pure defeatHound (GD-0007)"`.

> `pnpm validate` may still be red until Task 3 updates the sim + scene consumers of `hitsToRepel`/`registerHoundHit`.

---

### Task 3: sim — HP + the player dealing damage & defeating targets

**Files:**
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts` (+ test)
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (construction: drop `hitsToRepel` from `buildHoundConfigs`; pass `combatModel` into the sim)

**Interfaces produced (sim):** constructor takes the combat model; getters `playerHp`, `houndHp: readonly number[]`, `standInHp`, `houndDowned: readonly boolean[]`, `standInDowned: boolean`; `AttackResult.repelled` now means "this hit defeated the hound" (HP reached 0). `tryAttack` applies `playerAttackDamage`.

- [ ] **Step 1: Write failing tests**

In `benchmark-simulation.test.ts` (drop `hitsToRepel` from the fixtures; add a `combatModel` arg to the constructor per the shape you choose — pass `BENCHMARK.combatModel`-shaped literal): 

```ts
it('damages a hound on a connecting hit and defeats it at 0 HP (GD-0007)', () => {
  // hound maxHp 2, playerAttackDamage 1, hound placed in reach & facing
  const sim = /* build with one hound in front of the Hunter */;
  const first = sim.tryAttack();
  expect(first.hit).toBe(true);
  expect(first.repelled).toBe(false);       // 2 -> 1
  expect(sim.houndHp[0]).toBe(1);
  // wait out the attack cooldown, hit again
  sim.update(new Set(), 0.4);
  const second = sim.tryAttack();
  expect(second.repelled).toBe(true);        // 1 -> 0 => defeated
  expect(sim.houndHp[0]).toBe(0);
  expect(sim.houndDowned[0]).toBe(true);     // brief downed before it flees
});

it('damages the stand-in on a connecting hit and downs it at 0 HP', () => {
  // no hound in reach; stand-in in front. standIn maxHp 3.
  const sim = /* build with a stand-in in front, no hounds */;
  sim.tryAttack(); // 3 -> 2, starts pvp
  expect(sim.standInHp).toBe(2);
  expect(sim.pvpEngaged).toBe(true);
});
```

Match the file's existing world/config construction; place entities in reach of the default facing (south), like the existing `tryAttack`/separation tests.

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement**

In `benchmark-simulation.ts`:
1. Constructor: add a `combatModel: CombatModelConfig` parameter (define/import a `CombatModelConfig` type mirroring `BENCHMARK.combatModel`). Initialise `playerHp = combatModel.hunterMaxHp`; `houndHp = houndConfigs.map(() => combatModel.hound.maxHp)`; `houndDownedTimer = houndConfigs.map(() => 0)`; `standInHp = combatModel.standIn.maxHp`; `standInDownedTimer = 0`.
2. Getters: `get playerHp()`, `get houndHp(): readonly number[]` (return the array), `get standInHp()`, `get houndDowned(): readonly boolean[]` (`this.houndDownedTimer.map((t) => t > 0)`), `get standInDowned() { return this.standInDownedTimer > 0; }`.
3. `update` — hound stepping: for a hound whose `houndDownedTimer[i] > 0`, DECREMENT the timer and do NOT step it (freeze in place, skip separation); when the timer transitions to 0 this frame, set that hound's mode via `defeatHound(...)` so it flees. Otherwise step as today. (Downed hounds are also skipped by the creature↔creature pass — guard on `houndDownedTimer[i] === 0`.)
4. `update` — stand-in: if `standInDownedTimer > 0`, decrement and skip stepping/attacking; when it expires, respawn the stand-in at its spawn (`spawnStandIn`) with `standInHp = combatModel.standIn.maxHp` and clear `pvpTimer`.
5. `tryAttack`: when a hound is hit, `houndHp[hitIndex] -= playerAttackDamage`; if `houndHp[hitIndex] <= 0` set `houndDownedTimer[hitIndex] = combatModel.hound.downedSeconds` and return `repelled: true` (defeated); else `repelled: false`. Replace the `registerHoundHit(...)` call entirely. When the stand-in is the target, `standInHp -= playerAttackDamage`; if `<= 0` set `standInDownedTimer = combatModel.standIn.downedSeconds`; keep starting the pvp timer.
6. `reset`: reinitialise `playerHp`, `houndHp`, `houndDownedTimer`, `standInHp`, `standInDownedTimer`.
7. Do NOT apply damage to the player yet (Task 4).

In `benchmark-scene.ts` `create()`: remove `hitsToRepel` from `buildHoundConfigs`; pass `BENCHMARK.combatModel` into the `new BenchmarkSimulation(...)` call (match the new constructor parameter position).

- [ ] **Step 4: Run → pass**, then `pnpm validate` FULLY green (this task restores the green build: all `hitsToRepel`/`registerHoundHit` consumers are now updated).

- [ ] **Step 5: Commit** — `git commit -m "feat(client): HP model — the player damages and defeats hounds/stand-in (GD-0007)"`.

---

### Task 4: sim — enemies damage the player; defeat → respawn

**Files:**
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts` (+ test)

**Interfaces produced:** getter `playerMaxHp`; a per-frame `playerStruck` pulse (`get playerStruck(): boolean`) for the scene's hit-flash; player defeat triggers an encounter respawn (keeps collected/cleared progress).

- [ ] **Step 1: Write failing tests**

```ts
it('a hound in contact damages the player on its cooldown', () => {
  // one hound placed within contactRadius of the Hunter, in chase
  const sim = /* ... */;
  const before = sim.playerHp;
  sim.update(new Set(), 0.05);          // first contact bite
  expect(sim.playerHp).toBe(before - BENCHMARK_HOUND_CONTACT_DAMAGE);
  expect(sim.playerStruck).toBe(true);
  // no second bite before the contact cooldown elapses
  sim.update(new Set(), 0.05);
  expect(sim.playerHp).toBe(before - BENCHMARK_HOUND_CONTACT_DAMAGE);
});

it('respawns the player at the safe pocket on defeat but keeps collected items', () => {
  // drive playerHp to 0 via repeated contact; assert:
  expect(sim.playerHp).toBe(sim.playerMaxHp);            // restored
  expect(sim.hunter.position).toEqual(world.spawn);      // back at spawn
  // an item collected before defeat is still collected (progress kept)
});
```

Use the file's construction patterns; put a hound in contact and drive the clock. (Use the actual config values; the illustrative constant names above are just for readability.)

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement**

In `benchmark-simulation.ts`:
1. Add `houndAttackCooldown = houndConfigs.map(() => 0)` and `playerStruckThisFrame = false`; getters `playerMaxHp` and `playerStruck`.
2. In `update` (after the hounds are stepped, before the pvp timer decrement): reset `playerStruckThisFrame = false`. For each hound `i` that is NOT downed: decrement `houndAttackCooldown[i]`; if `houndInContact(hound, playerPos, config)` and `houndAttackCooldown[i] <= 0`, apply `this.playerHp -= combatModel.hound.contactDamage`, set `houndAttackCooldown[i] = combatModel.hound.contactCooldownSeconds`, and `playerStruckThisFrame = true`.
3. Stand-in punch: where `standInStruckThisFrame` is set true (the existing punch-lands branch), also `this.playerHp -= combatModel.standIn.punchDamage` and set `playerStruckThisFrame = true`.
4. After all damage this frame: if `this.playerHp <= 0`, call a new private `respawnAfterDefeat()` — reset the player to spawn, `playerHp = combatModel.hunterMaxHp`, reset all hounds (`houndStates`/`houndHp`/`houndDownedTimer`/`houndAttackCooldown`) and the stand-in (`spawnStandIn` + `standInHp` + timers), clear `pvpTimer`/`standInCooldown`/`attackCooldown` — but do NOT touch `interactableList`/`collectedList` (keep progress). (Factor the shared entity-reset out of `reset()` so both call it; `reset()` additionally re-seeds interactables + clears collected.)
5. `reset`: reinitialise `houndAttackCooldown` + `playerStruckThisFrame`.

- [ ] **Step 4: Run → pass**, `pnpm validate` FULLY green.

- [ ] **Step 5: Commit** — `git commit -m "feat(client): enemies damage the player; defeat respawns at the safe pocket (GD-0007)"`.

---

### Task 5: scene — HP bars, defeat/downed & respawn feedback

**Files:** Modify `apps/game-client/src/scenes/benchmark-scene.ts` (+ `core/config/benchmark.ts` for HP-bar colours).

Thin adapter — no unit tests; gate `pnpm validate` + visual. Reuse existing idioms (over-head marker like the `EM COMBATE` label; the feel-flash idiom).

- [ ] **Step 1: Over-head HP bars (restrained, combat-only).** Add a small HP bar (a back rect + a fill rect, or two `rectangle`s) that follows each hound and the stand-in, driven from `sim.houndHp[i]`/`sim.standInHp` vs the config max. Show a bar only when that entity is **in combat or damaged** (hound: `mode==='chase'` or contact or `hp<max`; stand-in: `sim.pvpEngaged` or `hp<max`), hidden otherwise. Add `colors.hpBarBack`/`colors.hpBarFill` (+ maybe a low-HP tint). Manage the bar objects in the existing per-entity view structures (`HoundView`/`StandInView`) and rebuild them in `create()` (restart-safe, like the other view fields).
- [ ] **Step 2: Player HP indicator.** A small fixed HP bar in a screen corner (scroll-factor 0), driven from `sim.playerHp`/`sim.playerMaxHp`. Always visible or fade-in-on-damage — keep it discreet.
- [ ] **Step 3: Downed + player-hit feedback.** When `sim.houndDowned[i]` / `sim.standInDowned` is true, show a brief downed cue (e.g. tint/alpha dip on that sprite) — the existing `fadeOutHound(index)` already handles a hound leaving via flee. When `sim.playerStruck` pulses, flash the player (reuse `showPlayerHitFlash`).
- [ ] **Step 4: Respawn feedback.** Player defeat is a sim respawn (position jumps to spawn, HP restored, encounter reset). Add a brief restrained cue — a short screen flash/fade — when a defeat-respawn happens this frame (detect via a `playerHp` transition from `<=0`… since the sim clamps to a respawn, expose a one-frame `get playerDefeatedThisFrame()` pulse from Task 4, or detect the position snap). Prefer a small sim pulse `playerDefeatedThisFrame` (add it in Task 4 if simplest) → the scene plays a brief fade. Keep it restrained.
- [ ] **Step 5:** `pnpm validate` FULLY green; commit `feat(client): HP bars + defeat/respawn feedback (GD-0007)`.

> If Step 4's `playerDefeatedThisFrame` pulse is needed, add it to the sim in Task 4 (a `get playerDefeatedThisFrame()` set true the frame `respawnAfterDefeat()` runs, reset next update) — note this dependency when implementing Task 4.

---

### Task 6: verify, report, update PR #19

- [ ] **Step 1:** `pnpm validate` green.
- [ ] **Step 2:** Nightly report `docs/agent/reports/2026-07-31-benchmark-combat-model.md` (outcome: real HP/damage/defeat + player respawn + PvP combat, restrained HP bars; status; changes; decisions applied — GD-0007 benchmark stub, no permadeath, non-authoritative; how to verify; deferred — balancing, server authority, death/consequence model, D01-canonical; risks).
- [ ] **Step 3:** Commit the report; `git push` (PR #19). Update the PR #19 body to add the combat-model slice. Do NOT merge.

---

## Self-Review

**Coverage (GD-0007):** HP on all entities + config → T1/T3; hound repel stub replaced by HP/defeat → T2/T3; player deals damage + target defeat (downed→vanish/reset) → T3; enemies damage the player + defeat respawn (keeps progress) → T4; PvP damage reuses the model (stand-in punch already gated by `pvpEngaged`) → T4; restrained HP bars + defeat/respawn feedback → T5; report/PR → T6. PvP combat-state entry/exit already exists (GD-0006 stub) and now carries damage. ✓

**Placeholder note:** T5 (scene) is structural guidance generalising existing over-head-label / feel-flash / per-entity-view idioms already in the scene; the correctness-critical config/pure/sim code is fully specified. Test snippets say "match the file's construction" where fixtures are involved — intentional, not a gap.

**Type/name consistency:** `combatModel` shape (T1) = the `CombatModelConfig` the sim consumes (T3/T4) = the maxes the scene reads (T5). `defeatHound` (T2) replaces `registerHoundHit` in the sim (T3). Getters `playerHp`/`playerMaxHp`/`houndHp`/`standInHp`/`houndDowned`/`standInDowned`/`playerStruck`/`playerDefeatedThisFrame` are defined in T3/T4 and consumed in T5. `AttackResult.repelled` now = "hit defeated the hound". `hitsToRepel` removed in T1, its consumers updated in T2 (pure) + T3 (sim/scene). ✓

**GD-0007 fidelity:** benchmark-only/non-authoritative; player never displaced except its own move + defeat-respawn; no permadeath (respawn keeps collected/cleared progress); numbers are config tuning. ✓
