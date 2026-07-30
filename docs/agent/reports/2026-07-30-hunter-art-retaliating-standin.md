# Nightly report — Hunter art + retaliating stand-in

## Outcome

The benchmark now has **real Hunter art**. The player Hunter (Bruno Dentes) and the
test-bed stand-in (Eduardo Careca) render as directional PixelLab sprites — idle at rest,
an 8-direction run while moving, and a **punch on `Space`**. The stand-in's AI flipped
from *fleeing* to **retaliating**: once you attack it, it enters mutual combat, chases
you, and punches back (playing its punch animation and flashing you) — refreshing the
combat timer — with **no damage** (a labelled GD-0006 stub; D01 stays open). While
engaged, an **"EM COMBATE" marker + ring floats over the stand-in** so the PvP combat
state is unmistakable. Everything keeps the greybox fallback if art is missing, and the
player's logical position is never displaced by the stand-in.

## Status

- Build: `passed`
- Unit tests: `passed` (197 client tests; +`nearestCoveredDirection`, +stand-in retaliate/attack sim tests)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` in the browser (visual check deferred to the human).

## Changes

- **Art (review status):** `assets/source/characters/hunter/{bruno-dentes,eduardo-careca}/body/{idle,run,punch}/…` (110 PNGs) + per-character `metadata.json`; art-direction brief `docs/art-direction/briefs/hunter-benchmark.md`.
- `gameplay/sprite-directions.ts` (+ test): pure `nearestCoveredDirection(target, covered)` — nearest available direction (for the partial punch coverage).
- `scenes/benchmark-assets.ts`: manifest for both Hunters (idle/run/punch globs, frame-key builders, `PLAYER_ART`/`TEST_ART`, `*_PUNCH_DIRS`).
- `scenes/benchmark-scene.ts`: player Hunter sprite (idle/run/punch + `Space` punch), stand-in sprite, the `EM COMBATE` marker/label, the player hit-flash — all with greybox fallback and restart-safe transient state.
- `gameplay/stand-in-hunter.ts` (+ test): `inCombat` flips flee→**chase**.
- `gameplay/benchmark-simulation.ts` (+ test): stand-in attack stub — a one-frame `standInStruck` pulse + cooldown; landing a punch refreshes `pvpTimer` (no damage).
- `core/config/benchmark.ts`: `sandbox.otherHunter` gains `attackRange`/`attackCooldownSeconds`; `fleeSpeedMultiplier` → `combatSpeedMultiplier`; `colors.combatMarker`.

## Decisions applied automatically

- **Punch is partial art** (Bruno `s/se/sw`; Eduardo `s/se` — the other directions
  failed on the PixelLab trial and can't be regenerated now). The client falls back to
  the **nearest covered direction**, so a punch always plays. Completing the remaining
  directions is deferred to when PixelLab has credits.
- **Stand-in retaliate is a benchmark stub** (chase + punch + timer refresh, no damage).
  Player authority preserved (never displaced). Art stays `review` (never auto-approved).
- **68×68 canvas** (vs the 64×80 Hunter spec) accepted as benchmark art; provisional
  feet-pivot `(34,60)`.

## Human decisions required

- `D01 — combat/damage/defeat model` and the final PvP disengage model remain open. Note
  (per review): because the stand-in refreshes the timer each landed punch while it
  chases into range, `pvpEngaged` stays active until the stand-in is kept out of range
  for the full `pvpCombatSeconds` — intended stub behaviour, revisit with D01.
- Sandbox default composition (from the test-bed report) still applies — the benchmark
  scene shows the test-bed (3 hounds + stand-in) by default; make opt-in by emptying
  `sandbox.extraHoundTiles`/`otherHunterTile`.

## Not completed / deferred (non-blocking)

- **Complete the punch directions** when PixelLab has credits (then drop the fallback for those dirs).
- Palette/Aseprite pass on the two Hunters (soft-guidance drift) — later.
- Cosmetic minors (from review): the combat marker offset uses the greybox body height
  (may sit slightly low over the 68px sprite); `PLAYER_ART`/`TEST_ART` duplicate
  `HOUND_ART`; `playerRunReady` isn't reset symmetrically with `standInRunReady` (harmless).

## Known risks

- Punch fallback shows a downward punch when facing up (partial art) — acceptable stub.
- All AI/attack/art values are benchmark tuning, not approved balance.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Move — the player Hunter runs (8-dir sprite); press `Space` — it punches.
3. Walk into the stand-in (Eduardo) — you pass through (not in combat). Attack it (`Space`
   in range) — an **EM COMBATE** marker appears over it, it **chases and punches you**
   (you flash), and it collides (push-apart) while engaged. Run away out of range for a
   few seconds — combat ends and you pass through again.
4. Automated: `pnpm validate` (lint + typecheck + 197 tests + build) is green.

## Files and evidence

- Branch: `agent/combat-push-apart-collision` (PR #19). Plan: `docs/superpowers/plans/2026-07-30-hunter-art-retaliating-standin.md`.
- Review: subagent-driven — per-task spec+quality reviews clean (two Important caught +
  fixed: a restart-stale player punch flag, and stale flee doc comments); final
  whole-branch review of the delta verdict **Ready to merge** — no Critical/Important;
  player authority, no-damage, restart-safety, review-status art all verified.
