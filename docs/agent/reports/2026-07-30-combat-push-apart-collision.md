# Nightly report — combat push-apart collision (GD-0006)

## Outcome

The ruin hound is now hittable. Previously it chased to the Hunter's exact centre and
stacked on top, so the hand-axe swing frequently whiffed (the attack cone pointed away
from a target sitting on the Hunter's centre). Implementing the newly-approved decision
[GD-0006](../decisions/GD-0006-circumstantial-entity-collision.md), the hound and Hunter
now collide via a **soft push-apart while the encounter is engaged** (`mode === 'chase'`),
so the hound holds at biting distance in front of the Hunter instead of piling onto its
centre. Only the hound is displaced (the player keeps authority over their own position),
and out of combat there is no separation — the two overlap freely, exactly as GD-0004
intended for the non-combat world. A more tolerant point-blank attack additionally lets a
hound that is right on top of the Hunter connect regardless of facing. The feel-pass
values (merged separately) were re-tuned to a perceptible-but-restrained level for
playtest.

## Status

- Build: `passed`
- Unit tests: `passed` (171 client tests; +3 `combatSeparation`, +1 point-blank, +1 sim integration, +config)
- Integration tests: `not run` (none beyond the client sim tests)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` — runs in the browser; the hound visibly holds at biting
  distance during an encounter and hits now land (see How to verify).

## Changes

- `docs/decisions/GD-0006-*.md` + `docs/game-design/movement-and-exploration.md`: the
  decision record (circumstantial, combat-gated soft push-apart) and the amendment of
  GD-0004's "no body blocking" rule (qualified by the combat exception).
- `gameplay/ruin-hound.ts` (+ test): pure `combatSeparation(houndPos, hunterPos, minDistance)`
  (push an overlapping hound out to a standoff; unchanged when already clear) and an
  optional `pointBlankRange` on `houndInAttackReach` (connect regardless of facing when
  very close; default `0` preserves prior behaviour).
- `gameplay/benchmark-simulation.ts` (+ test): `HunterSimConfig.pointBlankRange`; in
  `update`, while `mode === 'chase'`, apply `combatSeparation` (minDistance = hound
  footprint + Hunter footprint) and re-resolve the pushed hound against world solids;
  `tryAttack` passes the point-blank range. Only the hound is displaced.
- `core/config/benchmark.ts`: `combat.pointBlankRange` (30) + the re-tuned `feel` values
  (perceptible-but-restrained, playtest, values remain open).
- `scenes/benchmark-scene.ts`: passes `pointBlankRange` into the sim config (one line).

## Decisions applied automatically

- **Implements the approved GD-0006, benchmark scope.** Separation is combat-gated
  (chase only), soft (push to a standoff, never a rigid wall), and displaces only the
  hound. The general symmetric / Hunter↔Hunter combat-collision model is explicitly
  deferred (GD-0006 open items) and was NOT built.
- **Point-blank tolerance is scoped and backward-compatible** (default `0`), so it only
  affects the benchmark sim that opts in via config.

## Human decisions required

- `D01 — Combat / damage / defeat model`: still open. This slice only adds spacing +
  hit tolerance to the existing repel stub; no HP/damage/defeat.
- The broader multiplayer combat-collision model (exact "in combat" enter/exit for
  Hunter↔Hunter, timeout, NPC participation, symmetric resolution, server reconciliation)
  remains open per GD-0006 — future work, must not be inferred from this benchmark stub.

## Not completed / deferred

- Symmetric push-apart and Hunter↔Hunter combat collision (GD-0006 future work).
- Real art / tiles (paid PixelLab), canopy occlusion, reusable contextual UI — unrelated
  open benchmark items.

## Known risks

- The standoff is produced by step-then-push-out each frame (the hound advances in
  `stepHound`, then `combatSeparation` clamps it back to `minDistance`), so it "holds" at
  biting distance rather than gliding to it — acceptable for the benchmark; tune later if
  a smoother approach is wanted.
- `minDistance`, `pointBlankRange` and the re-tuned feel values are benchmark-only tuning,
  not approved balance numbers.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Let the ruin hound aggro and chase: it now stops at biting distance in front of you
   instead of overlapping your body.
3. Face it and press `Space`: hits land reliably; a hound right on top connects even if
   you are not perfectly facing it. Two hits drive it off.
4. Walk away so it de-aggros (or before it engages): out of combat the bodies overlap
   again — no separation (GD-0004 unchanged outside combat).
5. Automated: `pnpm validate` (lint + typecheck + 171 tests + build) is green.

## Files and evidence

- Branch: `agent/combat-push-apart-collision` (from `dev`, after PR #18). Draft PR → `dev`.
- Decision: `docs/decisions/GD-0006-circumstantial-entity-collision.md`.
  Plan: `docs/superpowers/plans/2026-07-30-combat-push-apart-collision.md`.
- Paths: `apps/game-client/src/gameplay/ruin-hound.ts`,
  `apps/game-client/src/gameplay/benchmark-simulation.ts`,
  `apps/game-client/src/core/config/benchmark.ts`, `apps/game-client/src/scenes/benchmark-scene.ts`.
- Review: subagent-driven — per-task spec+quality reviews all clean; final whole-branch
  review verdict **Ready to merge** (no Critical/Important; only cosmetic nits).
