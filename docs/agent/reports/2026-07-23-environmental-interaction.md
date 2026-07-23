# Nightly report — environmental interaction (greybox: explore → interact)

## Outcome

The greybox now supports the `Interact` step of the loop. A blocking overgrowth
obstruction sits on the explore path; when the Hunter comes within range a
discreet contextual prompt `[E] Cut` appears, and pressing `E` clears the
obstruction (a short fade), removing it from collision so the passage opens. The
target is chosen deterministically (nearest active obstruction within range),
interaction never fires out of range, and it is single-fire per obstruction. All
of this logic is Phaser-free and unit-tested; the client-side simulation remains
**benchmark-only and non-authoritative**. Builds on the Spawn→Observe→Explore
slice merged in PR #11.

## Status

- Build: `passed`
- Unit tests: `passed`
- Integration tests: `passed`
- Client validation: `passed`
- Demonstration: `available`

Details: `pnpm validate` (root) → lint, typecheck, 104 unit tests (17 files),
production build all pass (+15 tests vs the previous slice: interaction 10, sim
interaction 5). `dotnet test` (server, untouched) → still 7 unit + 4 integration.
A headless-Chrome screenshot of the running greybox shows the overgrowth and the
in-range `[E] Cut` prompt.

## Changes

- Added `apps/game-client/src/gameplay/interaction.ts` (Phaser-free): the
  `Interactable` model, `findInteractTarget` (nearest active in range, id
  tie-break), `activeBlockingRects` (dynamic solids), `clearInteractable`
  (immutable state transition), `distanceToBounds`. 10 unit tests.
- Extended `benchmark-simulation.ts`: the simulation now owns interactables,
  folds active blocking obstructions into movement collision, exposes the current
  in-range `target`, and provides `tryInteract()` (single-fire clear) and
  interactable-aware `reset()`. `HunterSimConfig` gains `interactRange`. 5 new
  unit tests.
- `core/config/benchmark.ts`: added `interaction.range`, an `interactables`
  layout (one overgrowth obstruction), and overgrowth/prompt colours — all
  benchmark-only.
- `BenchmarkScene`: renders interactables, a range-gated contextual `[E] Cut`
  prompt (world-space), the `E` interact key, and a fade on clear. Hint bar
  updated to include `E: interact`.
- Exposed the interaction API via the `@gameplay` barrel.
- Docs: client README, client-architecture, and this report.

## Decisions applied automatically

- Level B — interaction reach (`interaction.range`) and the overgrowth layout are
  provisional, centralized in `benchmark.ts`, and marked benchmark-only.
- Level A — the obstruction is modelled as a dynamic solid: while active it is
  merged into the collision set; clearing it removes it so movement opens. Kept
  in the pure simulation (not the scene) so it stays testable and transport-ready.
- Level A — interaction is a semantic action (`E` binding in the scene); target
  selection is deterministic (nearest, id tie-break) per GD-0004, and never
  auto-moves the Hunter.

## Human decisions required

- `D01 — Realtime client↔server transport (ADR)`: unchanged from PR #11 — still
  required before interaction/movement authority can move server-side; not
  blocking. The benchmark interaction is non-authoritative.
- `D02 — Promotion of benchmark values to rules`: interaction range, the obstruction
  model and gather feel remain provisional until a Game-Design-Lead decision.

## Not completed

- No item/resource yield from clearing (kept minimal — this is not a gathering
  system); the fragment pickup is the next increment (Phase 5).
- No tool/axe animation or timing windows; clearing is instantaneous with a fade.
- Ruin-hound threat, combat, combat camera, loop-completion feedback and
  production art remain deferred.

## Known risks

- Placeholder visuals only; the overgrowth and prompt are primitives/text.
- Client-only, non-authoritative simulation.
- `updatePrompt`/render wiring lives in the scene (Phaser) and is covered by the
  build + manual run rather than unit tests; the interaction _logic_ it drives is
  unit-tested.

## How to verify

1. `pnpm validate` at the repo root → lint, typecheck, 104 tests and build pass.
2. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
3. Walk east from the spawn pocket toward the green overgrowth patch. It blocks
   you; a `[E] Cut` prompt appears when you are close. Press `E`: the patch fades
   and you can now walk through. Press `R` to restart (obstruction returns).

## Files and evidence

- Branch: `agent/environmental-interaction` (from `dev` after PR #11 merged).
- Relevant paths: `apps/game-client/src/gameplay/interaction.ts`,
  `apps/game-client/src/gameplay/benchmark-simulation.ts`,
  `apps/game-client/src/core/config/benchmark.ts`,
  `apps/game-client/src/scenes/benchmark-scene.ts`,
  `apps/game-client/src/gameplay/index.ts`.
- Screenshots, logs or artifacts: headless-Chrome capture of the Hunter beside the
  overgrowth with the `[E] Cut` prompt visible. Validation: `pnpm validate` exit 0
  (104 tests); `dotnet test` exit 0 (11 tests).
