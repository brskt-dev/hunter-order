# Nightly report — combat test-bed (multi-hound + stand-in Hunter)

## Outcome

The benchmark scene can now be exercised as a **combat test-bed** for the full GD-0006
collision model. A small pack of ruin hounds each chase the **nearest** Hunter, hold at
biting distance instead of stacking (creature↔Hunter soft push-apart while chasing) and
no longer pile onto each other (creature↔creature symmetric push-apart while both chase).
A second **stand-in "player" Hunter** with simple AI wanders the scene; attacking it
starts a short **mutual-combat timer** that turns on Hunter↔Hunter push-apart (you stop
passing through each other) and makes it flee — then, when the timer lapses, you pass
through it again (GD-0006's "circumstantial, combat-gated" rule). Hit feel (flash, recoil,
micro hit-stop) applies to the specific hound you strike; camera shake stays global. The
whole test-bed is **config-driven** (`BENCHMARK.sandbox`) and reversible.

## Status

- Build: `passed`
- Unit tests: `passed` (190 client tests; +helpers, +stand-in module, +multi-hound & pvp sim tests)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` — runs in the browser (visual check deferred to the human;
  no isolated screenshot captured this pass).

## Changes

- `core/config/benchmark.ts`: `sandbox` block (extra hound spawns, stand-in spawn,
  `pvpCombatSeconds`, stand-in AI tunables) + `colors.otherHunter`/`otherHunterFacing`.
- `gameplay/ruin-hound.ts` (+ test): pure `separatePairSymmetric` (symmetric soft
  push-apart) and `nearestOf`.
- `gameplay/stand-in-hunter.ts` (+ test): pure stand-in Hunter — deterministic wander;
  flee-from-player while in combat.
- `gameplay/benchmark-simulation.ts` (+ test): single-hound → `houndStates[]`; each hound
  targets the nearest Hunter; creature↔Hunter (chase) + creature↔creature (both-chase)
  separation; a stand-in Hunter with a mutual-combat timer gating Hunter↔Hunter push-apart;
  `tryAttack` hits the nearest hound (`hitIndex`) or starts PvP combat on the stand-in
  (`hitOtherHunter`). Removed the temporary single-hound getter.
- `scenes/benchmark-scene.ts`: renders the hound collection + the stand-in, with per-hound
  hit feel; builds the test-bed entities from `BENCHMARK.sandbox`.

## Decisions applied automatically

- **Config-driven & reversible.** Empty `sandbox.extraHoundTiles` + null `otherHunterTile`
  reproduce the original 1-Hunter/1-hound first-playable-loop exactly (the extra behaviour
  is entirely behind populated config).
- **GD-0006 fidelity.** All separation is soft + combat-gated; only the non-player body is
  ever displaced (the player keeps authority — never moved by separation); the PvP
  combat-state is a **labelled benchmark stub** (attack → timer), not the final rule.
- **Per-hound feel**; global camera shake unchanged.

## Human decisions required

- **Default composition (please confirm at merge):** this PR **ships `sandbox` populated**,
  so the benchmark scene now shows the test-bed (3 hounds + stand-in Hunter) by default —
  matching the "direto na cena" request, but changing the approved first-playable-loop
  composition. If you want the loop demo to remain the default and the test-bed to be
  opt-in, set `BENCHMARK.sandbox.extraHoundTiles: []` and `otherHunterTile: null` (one-line
  change) — the code path is identical, only the default data differs. Flagged rather than
  decided silently (CLAUDE.md composition rule).
- `D01 — combat/damage/defeat model` and the **final PvP combat-state model** remain open
  (GD-0006 future work). This test-bed only spaces bodies + starts a timer; no damage.

## Not completed / deferred (non-blocking)

- Attacking the stand-in shows only the swing arc (no dedicated PvP hit feedback) — fine
  for a no-damage stub.
- `inAttackReach` in the sim duplicates `houndInAttackReach`'s reach math (small DRY
  opportunity — could take a position instead of a `HoundState`).
- Minor test polish: the coincident-pair separation test asserts distance but not the +x
  split direction; the stand-in wander test asserts movement but not in-bounds.

## Known risks

- All sandbox/AI/PvP values are benchmark-only tuning, not approved balance numbers.
- The stand-in AI and PvP timer are deliberately minimal stubs; not the multiplayer model.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. **Pack:** lead the hounds together — they crowd you at biting distance and don't stack
   on each other. Strike one (`Space`): only that hound flashes/recoils.
3. **Stand-in Hunter:** walk through it normally → you pass through (no combat). Attack it
   → for a few seconds you collide (push-apart) and it flees; then you pass through again.
4. **Nearest-target:** the hounds split between you and the stand-in by proximity.
5. Automated: `pnpm validate` (lint + typecheck + 190 tests + build) is green.

## Files and evidence

- Branch: `agent/combat-push-apart-collision` (PR #19 — same PR as the GD-0006 combat work).
- Plan: `docs/superpowers/plans/2026-07-30-combat-testbed.md`. Decision: GD-0006.
- Review: subagent-driven — per-task spec+quality reviews all clean; final whole-branch
  review of the test-bed delta verdict **Ready to merge (with the composition confirmation
  above)** — no Critical/Important defects; player authority + combat gating verified.
