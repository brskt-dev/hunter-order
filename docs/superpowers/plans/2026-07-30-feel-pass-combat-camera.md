# Feel Pass — combat & camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the benchmark greybox loop tactile weight — combat hit feedback, camera juice, pickup feedback, and a settled Recover beat — at a restrained "contido/tátil" level, purely in the presentation layer.

**Architecture:** A new Phaser-free, unit-tested `impact-feel` module models decaying juice envelopes (shake / flash / recoil / hit-stop). `BenchmarkScene` (thin adapter) consumes it each frame and applies pixels — camera shake offset, hound recoil/flash, a micro hit-stop hold — plus asymmetric combat-camera easing and a pickup pop. The simulation is never touched.

**Tech Stack:** TypeScript, Phaser 3.90, Vitest (node env), Vite. Path aliases `@gameplay`, `@core/config`, `@scenes`.

## Global Constraints

- **Presentation-only — GD-0004 / ADR-0002.** Do NOT edit `apps/game-client/src/gameplay/benchmark-simulation.ts` or `apps/game-client/src/gameplay/ruin-hound.ts`. Juice must never change logical position, range, perception, line of sight, hit reach, cooldown or AI. Hound recoil is a sprite-render offset only; camera shake is a bounded render offset only.
- **No new art / no PixelLab.** Use existing sprites/primitives and tweens only.
- **No copy/lore changes.** Reuse the existing discovery lines verbatim.
- **No combat-model change.** Decision D01 (final combat/damage/defeat) stays open and untouched.
- **Browser-first / lightweight.** Short, bounded, self-decaying effects; no particle systems; no per-frame allocation storms.
- **Intensity = "contido/tátil".** Use the reference constants in Task 1 exactly.
- **TDD.** Pure module: write the failing test first, watch it fail, implement minimally. Scene changes are the thin adapter (not unit-tested per repo convention) and are gated by `pnpm validate`.
- **Commands:** run client checks from repo root with `pnpm --filter @hunter-order/game-client test` (single run) and `pnpm validate` (full: lint + typecheck + test + build). Never start a dev server on the user's machine / never bind port 5173.

---

### Task 1: `feel` config block + tunables test

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts` (add a `feel` block; add `exitSmoothing` to `combatCamera`)
- Test: `apps/game-client/src/core/config/benchmark.test.ts` (add one `feel` sanity test)

**Interfaces:**
- Consumes: nothing.
- Produces: `BENCHMARK.feel` = `{ hitStopSeconds: number; shakePeakPx: number; shakeDecayRate: number; shakeFrequency: number; flashDecayRate: number; recoilPeakPx: number; recoilDecayRate: number; pickupPopScale: number; pickupPopMs: number }`; `BENCHMARK.combatCamera.exitSmoothing: number` (the existing `intensitySmoothing` is kept as the engage/enter rate).

- [ ] **Step 1: Write the failing test**

Add to `apps/game-client/src/core/config/benchmark.test.ts`, inside the `describe('benchmark config', ...)` block:

```ts
  it('has restrained, positive feel tunables', () => {
    const f = BENCHMARK.feel;
    for (const v of [
      f.hitStopSeconds,
      f.shakePeakPx,
      f.shakeDecayRate,
      f.shakeFrequency,
      f.flashDecayRate,
      f.recoilPeakPx,
      f.recoilDecayRate,
      f.pickupPopMs,
    ]) {
      expect(v).toBeGreaterThan(0);
    }
    // Restrained: a hit-stop micro-hold, a few px of shake, a small pop.
    expect(f.hitStopSeconds).toBeLessThanOrEqual(0.12);
    expect(f.shakePeakPx).toBeLessThanOrEqual(6);
    expect(f.pickupPopScale).toBeGreaterThan(1);
    expect(f.pickupPopScale).toBeLessThanOrEqual(1.4);
  });

  it('eases combat camera out no faster than it eases in (gentle recover)', () => {
    expect(BENCHMARK.combatCamera.exitSmoothing).toBeLessThanOrEqual(
      BENCHMARK.combatCamera.intensitySmoothing,
    );
    expect(BENCHMARK.combatCamera.exitSmoothing).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading 'hitStopSeconds')` (no `feel` block) and `exitSmoothing` undefined.

- [ ] **Step 3: Add the config**

In `apps/game-client/src/core/config/benchmark.ts`, add `exitSmoothing` to the `combatCamera` block (right after `intensitySmoothing`):

```ts
    /** Engage eases in at `intensitySmoothing`; disengage eases out gentler. */
    exitSmoothing: 2.5,
```

Then add a new `feel` block immediately after the `combatCamera` block closes (before the `oblique` block):

```ts
  /**
   * Feel-pass juice (PRESENTATION ONLY — GD-0004). Decaying envelopes applied to
   * the camera and the hound sprite when the hand-axe lands a hit; a pickup pop
   * on the fragment. "Contido/tátil": short, bounded, self-decaying. None of this
   * touches logical position, range, perception or the combat model. Benchmark-only.
   */
  feel: {
    /** Visual micro-hold on the hound at impact (seconds). */
    hitStopSeconds: 0.05,
    /** Max camera render offset at full shake (world px). Small on purpose. */
    shakePeakPx: 3,
    /** Exponential decay rate of the shake envelope (per second). */
    shakeDecayRate: 9,
    /** Oscillation frequency of the shake offset (rad/s-ish). */
    shakeFrequency: 60,
    /** Exponential decay rate of the impact-flash envelope (per second). */
    flashDecayRate: 8,
    /** Max hound VISUAL recoil offset (world px) — never the logical position. */
    recoilPeakPx: 6,
    /** Exponential decay rate of the recoil envelope (per second). */
    recoilDecayRate: 12,
    /** Fragment pickup pop peak scale. */
    pickupPopScale: 1.15,
    /** Fragment pickup pop + fade duration (ms). */
    pickupPopMs: 180,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hunter-order/game-client test -- benchmark.test.ts`
Expected: PASS (all benchmark-config tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/game-client/src/core/config/benchmark.ts apps/game-client/src/core/config/benchmark.test.ts
git commit -m "feat(client): add benchmark feel tunables + gentle camera exit smoothing"
```

---

### Task 2: pure `impact-feel` envelope module

**Files:**
- Create: `apps/game-client/src/gameplay/impact-feel.ts`
- Test: `apps/game-client/src/gameplay/impact-feel.test.ts`
- Modify: `apps/game-client/src/gameplay/index.ts` (export the module)

**Interfaces:**
- Consumes: nothing (pure; the caller passes `dt` and an `ImpactFeelConfig`).
- Produces:
  - `interface ImpactFeel { readonly shake: number; readonly flash: number; readonly recoil: number; readonly hitStop: number }`
  - `interface ImpactFeelConfig { readonly hitStopSeconds: number; readonly shakeDecayRate: number; readonly flashDecayRate: number; readonly recoilDecayRate: number }`
  - `zeroImpact(): ImpactFeel`
  - `triggerImpact(prev: ImpactFeel, cfg: ImpactFeelConfig): ImpactFeel`
  - `decayImpact(prev: ImpactFeel, dt: number, cfg: ImpactFeelConfig): ImpactFeel`
  - `isHitStopped(state: ImpactFeel): boolean`

- [ ] **Step 1: Write the failing test**

Create `apps/game-client/src/gameplay/impact-feel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import {
  decayImpact,
  type ImpactFeelConfig,
  isHitStopped,
  triggerImpact,
  zeroImpact,
} from './impact-feel';

const CFG: ImpactFeelConfig = {
  hitStopSeconds: 0.05,
  shakeDecayRate: 9,
  flashDecayRate: 8,
  recoilDecayRate: 12,
};

describe('impact-feel', () => {
  it('starts at rest', () => {
    expect(zeroImpact()).toEqual({ shake: 0, flash: 0, recoil: 0, hitStop: 0 });
  });

  it('peaks all impulses and arms the hit-stop on trigger', () => {
    const s = triggerImpact(zeroImpact(), CFG);
    expect(s.shake).toBe(1);
    expect(s.flash).toBe(1);
    expect(s.recoil).toBe(1);
    expect(s.hitStop).toBe(CFG.hitStopSeconds);
  });

  it('saturates at 1 on re-trigger (does not stack) and re-arms hit-stop', () => {
    const decayed = decayImpact(triggerImpact(zeroImpact(), CFG), 0.02, CFG);
    const again = triggerImpact(decayed, CFG);
    expect(again.shake).toBe(1);
    expect(again.flash).toBe(1);
    expect(again.recoil).toBe(1);
    expect(again.hitStop).toBe(CFG.hitStopSeconds);
  });

  it('decays the envelopes toward zero without going negative', () => {
    const start = triggerImpact(zeroImpact(), CFG);
    const next = decayImpact(start, 0.05, CFG);
    expect(next.shake).toBeGreaterThan(0);
    expect(next.shake).toBeLessThan(start.shake);
    expect(next.flash).toBeLessThan(start.flash);
    expect(next.recoil).toBeLessThan(start.recoil);

    let s = start;
    for (let i = 0; i < 200; i += 1) {
      s = decayImpact(s, 0.05, CFG);
    }
    expect(s.shake).toBeGreaterThanOrEqual(0);
    expect(s.shake).toBeCloseTo(0, 3);
    expect(s.flash).toBeCloseTo(0, 3);
    expect(s.recoil).toBeCloseTo(0, 3);
  });

  it('counts the hit-stop clock down by dt, clamped at zero', () => {
    const start = triggerImpact(zeroImpact(), CFG); // hitStop = 0.05
    const mid = decayImpact(start, 0.02, CFG);
    expect(mid.hitStop).toBeCloseTo(0.03, 5);
    const past = decayImpact(mid, 0.1, CFG);
    expect(past.hitStop).toBe(0);
  });

  it('reports hit-stop only while the clock is positive', () => {
    expect(isHitStopped(triggerImpact(zeroImpact(), CFG))).toBe(true);
    expect(isHitStopped(zeroImpact())).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hunter-order/game-client test -- impact-feel.test.ts`
Expected: FAIL — cannot resolve `./impact-feel` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `apps/game-client/src/gameplay/impact-feel.ts`:

```ts
// Presentation-only "juice" envelopes for the benchmark feel pass (GD-0004).
// Pure and framework-free: the scene passes `dt` and a config, and maps the
// returned 0..1 envelopes + hit-stop clock onto pixels. Never affects logical
// state — it only describes how visual feedback decays over time.

export interface ImpactFeel {
  /** 0..1 normalized camera-shake intensity. */
  readonly shake: number;
  /** 0..1 normalized impact-flash intensity. */
  readonly flash: number;
  /** 0..1 normalized hound visual-recoil intensity. */
  readonly recoil: number;
  /** Seconds of visual hit-stop remaining (> 0 => micro-hold active). */
  readonly hitStop: number;
}

export interface ImpactFeelConfig {
  readonly hitStopSeconds: number;
  readonly shakeDecayRate: number;
  readonly flashDecayRate: number;
  readonly recoilDecayRate: number;
}

/** Peak value every impulse is raised to on a landed hit. */
const PEAK = 1;

const REST: ImpactFeel = { shake: 0, flash: 0, recoil: 0, hitStop: 0 };

/** Exponential decay toward 0 (matches the scene's `approach(x, 0, rate, dt)`). */
const decay = (value: number, rate: number, dt: number): number =>
  dt <= 0 || rate <= 0 ? value : Math.max(0, value * Math.exp(-rate * dt));

/** Zeroed state (no active feel). */
export function zeroImpact(): ImpactFeel {
  return REST;
}

/**
 * Raise every impulse to its peak (saturating — never stacks above `PEAK`) and
 * re-arm the hit-stop clock. Called when the hand-axe lands a hit.
 */
export function triggerImpact(prev: ImpactFeel, cfg: ImpactFeelConfig): ImpactFeel {
  return {
    shake: Math.max(prev.shake, PEAK),
    flash: Math.max(prev.flash, PEAK),
    recoil: Math.max(prev.recoil, PEAK),
    hitStop: cfg.hitStopSeconds,
  };
}

/**
 * Advance one frame: each envelope decays exponentially toward 0 (never below 0);
 * the hit-stop clock counts down by `dt`, clamped at 0.
 */
export function decayImpact(prev: ImpactFeel, dt: number, cfg: ImpactFeelConfig): ImpactFeel {
  return {
    shake: decay(prev.shake, cfg.shakeDecayRate, dt),
    flash: decay(prev.flash, cfg.flashDecayRate, dt),
    recoil: decay(prev.recoil, cfg.recoilDecayRate, dt),
    hitStop: Math.max(0, prev.hitStop - dt),
  };
}

/** True while the visual hit-stop micro-hold is active. */
export function isHitStopped(state: ImpactFeel): boolean {
  return state.hitStop > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hunter-order/game-client test -- impact-feel.test.ts`
Expected: PASS (6 tests green).

- [ ] **Step 5: Export from the gameplay barrel**

In `apps/game-client/src/gameplay/index.ts`, add (keep the existing alphabetical grouping — place after the `directionalFrameKey`/`sprite-directions` export or near the other envelope-ish helpers):

```ts
export {
  decayImpact,
  type ImpactFeel,
  type ImpactFeelConfig,
  isHitStopped,
  triggerImpact,
  zeroImpact,
} from './impact-feel';
```

- [ ] **Step 6: Run the full client test suite to verify nothing broke**

Run: `pnpm --filter @hunter-order/game-client test`
Expected: PASS (all existing tests + 6 new).

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/gameplay/impact-feel.ts apps/game-client/src/gameplay/impact-feel.test.ts apps/game-client/src/gameplay/index.ts
git commit -m "feat(client): add pure impact-feel envelope module (shake/flash/recoil/hit-stop)"
```

---

### Task 3: wire combat hit feel into the scene (shake + recoil + flash + hit-stop)

**Files:**
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts`

**Interfaces:**
- Consumes: `zeroImpact`, `triggerImpact`, `decayImpact`, `isHitStopped`, `type ImpactFeel` from `@gameplay`; `BENCHMARK.feel`.
- Produces: nothing consumed by later tasks (scene-internal).

This task is the thin Phaser adapter — no unit test; the gate is `pnpm validate` plus a visual check. Make the edits, then verify build + lint + typecheck.

- [ ] **Step 1: Import the module and add scene fields**

In `apps/game-client/src/scenes/benchmark-scene.ts`, extend the `@gameplay` import to include the new symbols (add these names to the existing import list, keeping it sorted):

```ts
  decayImpact,
  type ImpactFeel,
  isHitStopped,
  triggerImpact,
  zeroImpact,
```

Add these fields to the class (next to the other combat/render fields around `private combatIntensity = 0;`):

```ts
  private impact: ImpactFeel = zeroImpact();
  private recoilDir: Vec2 = ZERO;
  private shakeClock = 0;
  private houndFlash?: Phaser.GameObjects.Ellipse;
```

`Vec2` and `ZERO` are already imported.

- [ ] **Step 2: Reset feel state on (re)start**

In `create()`, alongside the existing resets (`this.combatIntensity = 0; this.dangerAlpha = 0;`), add:

```ts
    this.impact = zeroImpact();
    this.recoilDir = ZERO;
    this.shakeClock = 0;
    this.houndFlash = undefined;
```

- [ ] **Step 3: Advance the envelopes each frame**

In `update()`, right after `const dt = clampDeltaSeconds(delta, BENCHMARK.movement.maxDeltaSeconds);`, add:

```ts
    this.impact = decayImpact(this.impact, dt, BENCHMARK.feel);
    this.shakeClock += dt;
```

- [ ] **Step 4: Trigger the impulse on a landed hit**

Replace the hit branch in `handleAttack()`:

```ts
    if (result.hit) {
      this.flashHound();
    }
```

with:

```ts
    if (result.hit) {
      this.registerHit();
    }
```

And add the `registerHit` method (place it next to `handleAttack`), then delete the now-unused `flashHound()` method entirely:

```ts
  /** Presentation-only hit feedback: peak the juice envelopes + capture the recoil
   * direction (the Hunter's facing). Never touches logical state (GD-0004). */
  private registerHit(): void {
    this.impact = triggerImpact(this.impact, BENCHMARK.feel);
    this.recoilDir = directionToVector(this.sim.hunter.facing);
  }
```

- [ ] **Step 5: Add a persistent hound flash overlay in `createHound()`**

In `createHound()`, after `this.houndShadow = this.add.ellipse(...)...;` and before the `let children: ...` declaration, create the flash overlay:

```ts
    // Envelope-driven hit flash (alpha set each frame in renderHound). A container
    // child so it rides the body — including the recoil offset.
    this.houndFlash = this.add
      .ellipse(0, -HOUND_BODY_HEIGHT * 0.4, HOUND_BODY_WIDTH, HOUND_BODY_HEIGHT, colors.hitFlash, 1)
      .setAlpha(0);
```

Then include `this.houndFlash` in BOTH `children` arrays so it is added to the container:
- real-sprite branch: `children = [this.houndSprite, this.houndFlash];`
- greybox branch: `children = [body, this.houndFacingTick, this.houndFlash];`

- [ ] **Step 6: Apply recoil + flash + hit-stop in `renderHound()`**

In `renderHound()`, replace the body-position line:

```ts
    this.hound.setPosition(state.position.x, state.position.y);
```

with a recoil-offset position (shadow stays on the logical position — leave the `houndShadow.setPosition(...)` line unchanged):

```ts
    const recoil = BENCHMARK.feel.recoilPeakPx * this.impact.recoil;
    this.hound.setPosition(
      state.position.x + this.recoilDir.x * recoil,
      state.position.y + this.recoilDir.y * recoil,
    );
```

Drive the flash overlay alpha (add right after the `houndShadow.setDepth(...)` line):

```ts
    this.houndFlash?.setAlpha(this.impact.flash * 0.85);
```

Gate the animation logic with the hit-stop hold — wrap the existing `if (this.houndSprite) { ... }` moving/idle block so it is skipped while hit-stopped (holding the current frame). Change:

```ts
    if (this.houndSprite) {
      // Moving -> play the directional run loop; at rest -> the static idle pose.
      const moving = ...
      ...
    } else if (this.houndFacingTick) {
```

to:

```ts
    if (this.houndSprite && !isHitStopped(this.impact)) {
      // Moving -> play the directional run loop; at rest -> the static idle pose.
      const moving = ...
      ...
    } else if (!this.houndSprite && this.houndFacingTick) {
```

(Only the two `if` conditions change; the block bodies stay exactly as they are. During the micro hit-stop the sprite holds its current frame — a visual-only pause; the simulation keeps stepping.)

- [ ] **Step 7: Add the camera shake offset in `updateCombatCamera()`**

Replace the follow-offset line:

```ts
    this.cameras.main.setFollowOffset(-this.lookAhead.x, -this.lookAhead.y);
```

with a bounded shake added on top of the look-ahead:

```ts
    const shakeMag = BENCHMARK.feel.shakePeakPx * this.impact.shake;
    const shakeX = shakeMag * Math.sin(this.shakeClock * BENCHMARK.feel.shakeFrequency);
    const shakeY = shakeMag * Math.sin(this.shakeClock * BENCHMARK.feel.shakeFrequency * 1.3 + 1.7);
    this.cameras.main.setFollowOffset(-(this.lookAhead.x + shakeX), -(this.lookAhead.y + shakeY));
```

- [ ] **Step 8: Verify build + lint + typecheck**

Run: `pnpm validate`
Expected: PASS — lint (no unused `flashHound`, no unused vars), typecheck, full test suite, and build all green.

- [ ] **Step 9: Commit**

```bash
git add apps/game-client/src/scenes/benchmark-scene.ts
git commit -m "feat(client): tactile combat hit feel — camera shake, hound recoil, flash, micro hit-stop"
```

---

### Task 4: asymmetric combat-camera easing (gentle recover)

**Files:**
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (`updateCombatCamera`)

**Interfaces:**
- Consumes: `BENCHMARK.combatCamera.intensitySmoothing` (enter) and `BENCHMARK.combatCamera.exitSmoothing` (exit, from Task 1).
- Produces: nothing.

Rationale: the sim already provides engage/disengage hysteresis via the hound's aggro/de-aggro radii, so the camera needs no artificial dead-zone — it only eases in a touch faster than it eases out, so the Recover beat settles gently instead of snapping.

- [ ] **Step 1: Use the enter/exit rates for the combat intensity**

In `updateCombatCamera()`, replace:

```ts
    const engaged = this.sim.threatEngaged ? 1 : 0;
    this.combatIntensity = approach(this.combatIntensity, engaged, cc.intensitySmoothing, dt);
```

with:

```ts
    const engaged = this.sim.threatEngaged ? 1 : 0;
    const intensityRate = this.sim.threatEngaged ? cc.intensitySmoothing : cc.exitSmoothing;
    this.combatIntensity = approach(this.combatIntensity, engaged, intensityRate, dt);
```

- [ ] **Step 2: Use the enter/exit rates for the danger vignette**

In the same method, replace:

```ts
    const dangerTarget = this.sim.inDanger ? DANGER_MAX_ALPHA : 0;
    this.dangerAlpha = approach(this.dangerAlpha, dangerTarget, cc.intensitySmoothing, dt);
    this.dangerOverlay?.setAlpha(this.dangerAlpha);
```

with:

```ts
    const dangerTarget = this.sim.inDanger ? DANGER_MAX_ALPHA : 0;
    const dangerRate = this.sim.inDanger ? cc.intensitySmoothing : cc.exitSmoothing;
    this.dangerAlpha = approach(this.dangerAlpha, dangerTarget, dangerRate, dt);
    this.dangerOverlay?.setAlpha(this.dangerAlpha);
```

- [ ] **Step 3: Verify build + lint + typecheck**

Run: `pnpm validate`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/game-client/src/scenes/benchmark-scene.ts
git commit -m "feat(client): ease the combat camera + danger vignette out gently on recover"
```

---

### Task 5: pickup pop + overgrowth cut feedback

**Files:**
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (`handleInteract` + a new `showCutFeedback`)

**Interfaces:**
- Consumes: `BENCHMARK.feel.pickupPopScale`, `BENCHMARK.feel.pickupPopMs`; the existing `DEPTH`, `BENCHMARK.colors.hitFlash`.
- Produces: nothing.

- [ ] **Step 1: Give the fragment pickup a pop, and the overgrowth cut a chop flash**

Replace the whole `handleInteract()` body's view/branch section. Current:

```ts
    const view = this.interactableViews.get(resolved.id);
    if (view) {
      this.tweens.add({
        targets: view,
        alpha: 0,
        duration: 180,
        onComplete: () => view.setVisible(false),
      });
    }
    if (resolved.collectible) {
      this.showDiscovery(DISCOVERY_MESSAGE[resolved.kind] ?? 'You found something.');
      this.updatePossession();
      this.log.info('Benchmark pickup: collected item', resolved.id);
    } else {
      this.log.info('Benchmark interaction: cleared obstruction', resolved.id);
    }
```

with:

```ts
    const view = this.interactableViews.get(resolved.id);
    if (resolved.collectible) {
      // A small pop + fade "trace" on the fragment as it is taken (not a loot burst).
      if (view) {
        const pop = BENCHMARK.feel.pickupPopScale;
        this.tweens.add({
          targets: view,
          scaleX: pop,
          scaleY: pop,
          alpha: 0,
          duration: BENCHMARK.feel.pickupPopMs,
          ease: 'Quad.easeOut',
          onComplete: () => view.setVisible(false),
        });
      }
      this.showDiscovery(DISCOVERY_MESSAGE[resolved.kind] ?? 'You found something.');
      this.updatePossession();
      this.log.info('Benchmark pickup: collected item', resolved.id);
    } else {
      // The axe-cut reads as a connected hit: a brief chop flash as the overgrowth clears.
      if (view) {
        this.tweens.add({
          targets: view,
          alpha: 0,
          duration: 180,
          onComplete: () => view.setVisible(false),
        });
      }
      this.showCutFeedback(resolved);
      this.log.info('Benchmark interaction: cleared obstruction', resolved.id);
    }
```

- [ ] **Step 2: Add the `showCutFeedback` helper**

Add near `showSwing()` / `showDiscovery()`:

```ts
  /** A brief, restrained flash where overgrowth is cut, so the axe reads as connecting. */
  private showCutFeedback(target: Interactable): void {
    const cx = target.bounds.x + target.bounds.width / 2;
    const cy = target.bounds.y + target.bounds.height / 2;
    const flash = this.add
      .rectangle(cx, cy, target.bounds.width * 0.9, target.bounds.height * 0.9, BENCHMARK.colors.hitFlash, 0.5)
      .setDepth(DEPTH.effect);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 160,
      onComplete: () => flash.destroy(),
    });
  }
```

`Interactable` is already imported.

- [ ] **Step 3: Verify build + lint + typecheck**

Run: `pnpm validate`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/game-client/src/scenes/benchmark-scene.ts
git commit -m "feat(client): pickup pop on the fragment + a chop flash when cutting overgrowth"
```

---

### Task 6: verify the loop, nightly report, draft PR

**Files:**
- Create: `docs/agent/reports/2026-07-30-feel-pass-combat-camera.md`

- [ ] **Step 1: Full validation**

Run: `pnpm validate`
Expected: PASS — lint + typecheck + full test suite (existing + `impact-feel` + `benchmark` feel tests) + build all green.

- [ ] **Step 2: Confirm the simulation was never touched (GD-0004 proof)**

Run: `git diff --stat origin/dev...HEAD -- apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/gameplay/ruin-hound.ts`
Expected: empty output (no changes to either file).

- [ ] **Step 3: Optional in-context visual check**

If a visual capture is wanted, use the isolated-port headless screenshot recipe (Edge `--headless=new` on an isolated CDP/preview port, never 5173) to grab a landed hit and the Recover settle. Skip if not requested; do NOT start a dev server on the user's machine.

- [ ] **Step 4: Write the nightly report**

Create `docs/agent/reports/2026-07-30-feel-pass-combat-camera.md` following `docs/agent/report-template.md`, covering: outcome (Stage 3 feel pass — hit feel, camera juice/hysteresis, pickup pop, gentle Recover), status (build/tests passed), changes (the `impact-feel` module + scene wiring + config), decisions applied automatically (presentation-only, asymmetric easing instead of an artificial dead-zone), the GD-0004 proof (Step 2), what is deferred (art, canopy occlusion, D01), and how to verify.

- [ ] **Step 5: Commit the report**

```bash
git add docs/agent/reports/2026-07-30-feel-pass-combat-camera.md
git commit -m "docs: record the Feel Pass (combat & camera) nightly report"
```

- [ ] **Step 6: Push and open a draft PR to `dev`**

```bash
git push -u origin agent/feel-pass-combat-camera
gh pr create --draft --base dev --title "feat(client): Feel Pass — combat & camera juice (presentation-only)" --body "<summary + GD-0004 note + link to spec/plan>"
```

Do NOT merge — the human merges. Report the PR URL back to the user.

---

## Self-Review

**Spec coverage:**
- Pure `impact-feel` module (shake/flash/recoil/hit-stop envelopes) → Task 2. ✓
- `feel` config block + intensity constants → Task 1. ✓
- Hit feedback (envelope flash, micro hit-stop hold, visual recoil) → Task 3. ✓
- Camera juice (bounded shake + asymmetric hysteresis) → Tasks 3 (shake) + 4 (hysteresis). ✓
- Pickup/interact feedback (fragment pop + overgrowth cut) → Task 5. ✓
- Recover beat settle (gentle vignette/zoom ease-out) → Task 4 (exit smoothing on intensity + danger). ✓
- GD-0004 presentation-only proof → Task 6 Step 2. ✓
- Tests (TDD for the pure module) → Task 2; config sanity → Task 1. ✓
- Report + draft PR → Task 6. ✓
- Note: the spec mentioned a camera dead-zone; Task 4 documents why it is unnecessary (the sim's aggro/de-aggro already provides engage hysteresis) and implements the meaningful part — asymmetric easing. This is a deliberate, recorded simplification, not a gap.

**Placeholder scan:** none — every step shows the exact code/commands.

**Type consistency:** `ImpactFeel` / `ImpactFeelConfig` field names (`shake`, `flash`, `recoil`, `hitStop`) and function names (`zeroImpact`, `triggerImpact`, `decayImpact`, `isHitStopped`) are identical across Tasks 2 and 3. `BENCHMARK.feel.*` and `combatCamera.exitSmoothing` names match between Task 1 and their consumers in Tasks 3–5. ✓
