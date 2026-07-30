# Feel Pass — combat & camera (design spec)

> Status: Approved for implementation
> Date: 2026-07-30
> Branch: `agent/feel-pass-combat-camera` (from `dev`, after PR #17 merge)
> Scope owner: Game Design Lead (Bruno)
> Related: [first-playable-loop-benchmark.md](../../game-design/first-playable-loop-benchmark.md),
> [GD-0004](../../decisions/GD-0004-movement-and-exploration.md),
> [ADR-0002](../../decisions/ADR-0002-server-authoritative.md),
> [client-architecture.md](../../technical/client-architecture.md)

## Goal

Advance the benchmark into **Stage 3 (feel pass)** without any new art and without a
product/gameplay decision. Give the existing greybox loop tactile weight by polishing
what already exists — combat hit feedback, combat-camera behaviour, pickup/interaction
feedback, and the closing **Recover** beat — at a **restrained / tactile** intensity
level consistent with the benchmark's "grounded, damp, restrained" tone and its
browser-first constraint (no uncontrolled particles/effects).

This directly serves benchmark "what the loop must prove" items #5 (camera supports
combat without exposing hidden rules), #10 (creature reads as a threat), #11 (contextual
UI without MMO clutter), and the loop's Reward/Recover beats.

## Non-goals / hard constraints

- **Presentation-only (GD-0004 / ADR-0002).** No change to `benchmark-simulation.ts`
  or `ruin-hound.ts`. Juice must never alter logical position, range, perception, line
  of sight, hit reach, cooldown, AI, or any gameplay rule. If it changes what the player
  can do or perceive as game state, it is out of scope.
- **No new art, no PixelLab.** Everything uses existing sprites/primitives and tweens.
- **No copy/lore changes.** The discovery lines already exist and are reused as-is
  (`"You found an unidentified ancient fragment."`, `"The ruin hound is driven off — the
  pocket falls quiet."`).
- **No new combat/damage model.** The final combat model is open decision **D01**
  (Level C) and stays untouched; this pass only adds feedback to the existing repel stub.
- **Browser-first / lightweight.** Short, bounded, self-decaying effects only; no
  particle systems, no per-frame allocation storms, no heavy re-render.

## Intensity target

"**Contido / tátil**" as chosen by GD. Reference constants (all tunable, benchmark-only):

| Constant | Ref value | Meaning |
|---|---|---|
| `hitStopSeconds` | `0.05` | micro visual hold on the hound at impact |
| `shakePeakPx` | `3` | max camera render offset at full shake |
| `shakeDecayRate` | `9` /s | exponential decay of shake envelope |
| `shakeFrequency` | `60` | oscillation frequency for the shake offset |
| `flashDecayRate` | `8` /s | decay of the impact-flash envelope |
| `recoilPeakPx` | `6` | max **visual** hound recoil offset |
| `recoilDecayRate` | `12` /s | decay of the recoil envelope |
| `pickupPopScale` | `1.15` | fragment pickup pop peak scale |
| `pickupPopMs` | `180` | fragment pickup pop+fade duration |

These live in a new `feel` block in `apps/game-client/src/core/config/benchmark.ts`,
labelled benchmark-only/non-authoritative like the rest of that file.

## Architecture — Approach A (pure module + thin scene adapter)

Follows the repo pattern: Phaser-free, unit-tested logic in `src/gameplay`; the scene is
a thin adapter that consumes it and applies pixels.

### New pure module: `apps/game-client/src/gameplay/impact-feel.ts`

Models **decaying envelopes** as an immutable value object. No Phaser, no time source of
its own — the caller passes `dt`.

```ts
export interface ImpactFeel {
  /** 0..1 normalized shake intensity. */
  readonly shake: number;
  /** 0..1 normalized impact-flash intensity. */
  readonly flash: number;
  /** 0..1 normalized hound visual-recoil intensity. */
  readonly recoil: number;
  /** Seconds of visual hit-stop remaining (>0 => micro-hold active). */
  readonly hitStop: number;
}

/** Zeroed state (no active feel). */
export function zeroImpact(): ImpactFeel;

/**
 * Peak all impulses for a landed hit. Saturates at 1 (does NOT stack above 1 on
 * rapid repeats); resets hitStop to `hitStopSeconds`.
 */
export function triggerImpact(prev: ImpactFeel, cfg: ImpactFeelConfig): ImpactFeel;

/**
 * Advance one frame: shake/flash/recoil decay exponentially toward 0 at their
 * configured rates (never below 0); hitStop -= dt clamped at 0.
 */
export function decayImpact(prev: ImpactFeel, dt: number, cfg: ImpactFeelConfig): ImpactFeel;

/** Convenience predicate for the micro-hold window. */
export function isHitStopped(state: ImpactFeel): boolean; // state.hitStop > 0
```

`ImpactFeelConfig` is the subset of the `feel` block the module needs
(`hitStopSeconds`, `shakeDecayRate`, `flashDecayRate`, `recoilDecayRate`). Pixel
magnitudes (`shakePeakPx`, `recoilPeakPx`, `shakeFrequency`, pop values) are applied by
the scene, not the module — the module deals only in normalized envelopes + the hitStop
clock, which keeps it trivially testable and deterministic.

Exponential decay uses the existing `approach`/`expDecay` style already used in the scene
(`approach(value, 0, rate, dt)`), reused or mirrored so behaviour matches the camera
smoothing already in the codebase.

### Scene adapter changes: `apps/game-client/src/scenes/benchmark-scene.ts`

- Hold `private impact = zeroImpact()` and a `private recoilDir` (unit vector, the
  Hunter's facing captured at the moment of a landed hit).
- In `update(dt)`: `this.impact = decayImpact(this.impact, dt, cfg)`.
- On a landed hit (where the scene already reacts to `tryAttack()` returning `hit`):
  `this.impact = triggerImpact(this.impact, cfg)` and capture `recoilDir` from the
  Hunter's facing vector.
- **Flash:** drive the existing hit-flash alpha from `impact.flash` (envelope) instead of
  a one-shot, so it decays smoothly.
- **Hit-stop:** while `isHitStopped(impact)`, pause the hound sprite's animation / hold
  its current frame (visual only — the simulation keeps advancing; input stays live).
- **Recoil:** offset the **hound sprite render position** by
  `recoilDir * recoilPeakPx * impact.recoil`. The hound's logical `state.position` is
  never touched; the shadow follows the same visual offset so it stays grounded.
- **Camera shake:** add a bounded offset to the camera each frame,
  `offset = shakePeakPx * impact.shake * f(t)` where `f` is a small decaying oscillation
  (deterministic; e.g. `sin(elapsed * shakeFrequency)` for x and a phase-shifted sin for
  y). Applied via the camera's scroll/followOffset the scene already manipulates for
  look-ahead — added on top, never replacing look-ahead. Bounded to `shakePeakPx` so it
  can never move the world enough to reveal off-screen information (GD-0004).
- **Camera hysteresis:** the combat camera already eases zoom/look-ahead/danger via
  `approach(..., intensitySmoothing, dt)`. Tune it so it **enters** combat slightly
  faster than it **exits** (asymmetric smoothing) and add a small dead-zone around the
  engage/disengage threshold so brief contact flickers don't toggle the view. Still
  presentation-only; does not change aggro/deaggro (those are the sim's job).
- **Pickup pop:** on fragment collect, before removing the sprite, run a short
  scale-up-to-`pickupPopScale` + fade tween over `pickupPopMs`, then destroy. The
  existing self-fading discovery line stays as the "trace".
- **Overgrowth cut:** reuse the flash envelope lightly at the cut point so the axe swing
  on overgrowth reads as a connected hit (small, not a combat-grade flash).
- **Recover beat:** verify + smooth the settle — on disengage the danger vignette eases
  to 0 (already), the camera eases zoom/look-ahead back (already), the "pocket falls
  quiet" line plays on repel (already); ensure the impact envelopes are at rest and no
  residual camera offset lingers so the scene visibly quiets. Mostly verification +
  smoothing, not new systems.

## Testing (TDD)

New `apps/game-client/src/gameplay/impact-feel.test.ts` (vitest, node env). Write each
test first, watch it fail, then implement:

1. `zeroImpact()` → all fields `0`.
2. `triggerImpact` sets `shake`, `flash`, `recoil` to `1` and `hitStop` to
   `cfg.hitStopSeconds`.
3. `triggerImpact` on an already-active state does **not** exceed `1` (saturates, no
   stacking) and re-arms `hitStop`.
4. `decayImpact` strictly reduces `shake`/`flash`/`recoil` for a positive `dt` and never
   returns a value `< 0`; after a large accumulated time they are `~0`.
5. `decayImpact` decrements `hitStop` by `dt`, clamped at `0` (never negative).
6. `isHitStopped` is `true` iff `hitStop > 0`.

Scene changes are the thin Phaser adapter and are not unit-tested (repo convention);
they are covered by `pnpm validate` (lint + typecheck + build) and an optional
isolated-port headless screenshot of a landed hit. The existing
`benchmark-simulation.test.ts` / `ruin-hound.test.ts` remain unchanged and continue to
lock the logical behaviour — proving the feel pass added nothing gameplay-affecting.

## Definition of done

- `impact-feel.ts` + tests; all new tests green; `pnpm validate` green (lint, typecheck,
  full test suite, build).
- Scene consumes the module; the 4 feel elements are visible at the "contido/tátil"
  level; simulation files untouched (diff proves it).
- Nightly report in `docs/agent/reports/2026-07-30-feel-pass-combat-camera.md`.
- Draft PR `agent/feel-pass-combat-camera` → `dev` (human merges).

## Open items / backlog (explicitly out of this slice)

- Hunter + hand-axe real art, real tiles (blocked on paid PixelLab).
- High-object / canopy occlusion case (#8) — separate greybox slice.
- Contextual-UI reusable system extraction (#11) — separate slice.
- Final combat/damage/defeat model — **D01**, Level C, needs a GD decision.
- Sound/audio feedback — not in the benchmark scope yet.
