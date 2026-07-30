# Nightly report — Feel Pass (combat & camera)

## Outcome

The benchmark greybox loop now has tactile weight at a restrained "contido/tátil"
level, entirely in the presentation layer. Landing a hand-axe hit on the ruin hound
produces a short, decaying package of feedback: a bounded camera shake (≤3 px), a
visual recoil of the hound's body (the shadow stays pinned to its true position so the
jolt reads honestly), an envelope-driven impact flash, and a ~50 ms micro hit-stop that
holds the hound's animation frame. The combat camera and danger vignette now ease *out*
gentler than they ease *in*, so disengaging settles the scene instead of snapping —
giving the Recover beat a real ending. Picking up the ancient fragment gives a small
scale-pop-and-fade "trace" (not a loot burst), and cutting overgrowth gets a brief chop
flash so the axe reads as connecting. None of this touches gameplay: the simulation is
byte-for-byte unchanged.

## Status

- Build: `passed` (`pnpm validate` build step)
- Unit tests: `passed` (165 client tests; +6 for `impact-feel`, +2 for benchmark feel config)
- Integration tests: `not run` (none for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` — runs in the browser via the client dev server; visual feel
  is best confirmed live (see How to verify). No isolated screenshot was captured this pass.

## Changes

- `gameplay/impact-feel.ts` (+ test): pure, framework-free envelope module —
  `ImpactFeel` (shake/flash/recoil/hitStop), `zeroImpact`, `triggerImpact` (saturating
  peak), `decayImpact` (exponential decay, hit-stop clock), `isHitStopped`. 6 tests.
- `gameplay/index.ts`: barrel export for the new module.
- `core/config/benchmark.ts` (+ test): a `feel` tuning block (hit-stop, shake, flash,
  recoil, pickup pop — all restrained) and `combatCamera.exitSmoothing` for a gentler
  disengage. 2 config sanity tests.
- `scenes/benchmark-scene.ts`: consumes the module — per-frame decay, `registerHit()` on
  a landed hit, a persistent envelope-driven hound flash overlay, recoil + hit-stop in
  `renderHound()`, bounded camera shake in `updateCombatCamera()`, asymmetric
  enter/exit easing for combat intensity + danger vignette, a fragment pickup pop and an
  overgrowth `showCutFeedback()` chop flash. Removed the old one-shot `flashHound()`.

## Decisions applied automatically

- **Presentation-only, per GD-0004 / ADR-0002.** All juice is confined to render offsets,
  alpha and animation gating. The simulation (`benchmark-simulation.ts`, `ruin-hound.ts`)
  is unchanged — verified: `git diff --stat 5aaeb8a..HEAD -- <those two files>` is empty.
  Hound recoil is a container offset only; the shadow stays on the logical position.
- **No artificial camera dead-zone.** The hound's aggro/de-aggro radii already provide
  engage/disengage hysteresis, so the camera only adds asymmetric easing (in faster than
  out) rather than a redundant threshold band.
- **Feel literals kept inline where they are one-shot shaping constants** (flash alpha,
  the secondary shake wave, the cut-flash factors); the sweepable tunables live in
  `BENCHMARK.feel`. Can be promoted later if the Game Design Lead wants to sweep them.

## Human decisions required

- `D01 — Combat / damage / defeat model`: unchanged and still open. This pass only adds
  feedback to the existing repel *stub*; it introduces no HP, damage or defeat rules.

## Not completed

- Real tile textures, real Hunter sprite, real hand-axe art — blocked on a paid PixelLab
  plan (deferred by the Game Design Lead). The Hunter is still the greybox primitive.
- High-object / canopy occlusion case (#8) and a reusable contextual-UI system (#11) —
  separate future slices, out of this pass by design.
- Audio feedback — not in the benchmark scope yet.

## Known risks

- The feel values are benchmark-only tuning, not approved rules; they will be re-tuned
  once the real Hunter/hound art and tiles land (silhouettes change what reads as weighty).
- Visual "feel" is subjective and was validated by design intent + code review, not by an
  in-context capture this pass; a quick live look is recommended before merge.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Walk to the ruin hound and press `Space` to land hits: expect a brief camera shake, a
   flash, the hound's body jolting back (shadow staying put), and a micro-freeze on impact.
3. Land the final hit: the hound is driven off, the vignette and combat zoom ease back
   *gently* (no snap), and the "pocket falls quiet" line plays — the scene settles.
4. Pick up the fragment (`E`): it pops slightly and fades as the discovery line appears.
   Cut overgrowth (`E`): a brief chop flash as it clears.
5. Automated: `pnpm validate` (lint + typecheck + 165 tests + build) is green.

## Files and evidence

- Branch: `agent/feel-pass-combat-camera` (from `dev`). Draft PR → `dev`.
- Spec: `docs/superpowers/specs/2026-07-30-feel-pass-combat-camera-design.md`.
  Plan: `docs/superpowers/plans/2026-07-30-feel-pass-combat-camera.md`.
- Relevant paths: `apps/game-client/src/gameplay/impact-feel.ts` (+ test),
  `apps/game-client/src/scenes/benchmark-scene.ts`,
  `apps/game-client/src/core/config/benchmark.ts` (+ test).
- GD-0004 proof: `git diff --stat 5aaeb8a..HEAD -- apps/game-client/src/gameplay/benchmark-simulation.ts apps/game-client/src/gameplay/ruin-hound.ts` → empty.
- Review: subagent-driven — per-task spec+quality reviews all clean; final whole-branch
  review verdict **Ready to merge: Yes** (no Critical/Important; Minor items documented).
