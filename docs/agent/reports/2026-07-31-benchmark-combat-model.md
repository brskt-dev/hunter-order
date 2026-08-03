# Nightly report — benchmark combat model (GD-0007)

## Outcome

Combat is now **real** in the benchmark (client-only, non-authoritative). Every combat
entity has **HP**; the player's `Space` attack deals damage and **defeats** a target at 0
HP (a brief "downed" freeze, then the hound flees/vanishes and the stand-in respawns).
**Hounds bite** the player on contact (on a cooldown) and the **stand-in punches** for
damage; when the player's HP reaches 0 they **respawn at the safe pocket** and the
encounter resets — **keeping collected/cleared progress** (no permadeath; the loop's
"Recover" beat). The hound's old `hitsToRepel` repel stub is gone, replaced by HP + a pure
`defeatHound`. Feedback is restrained: small **over-head HP bars shown only in combat**, a
discreet **player HP corner bar**, downed/hit cues, and a brief respawn flash. This
resolves `D01` at the benchmark level per [GD-0007](../decisions/GD-0007-benchmark-combat-model.md).

## Status

- Build: `passed`
- Unit tests: `passed` (206 client tests; +combat-model config, +HP/damage/defeat/respawn sim tests, +`defeatHound`)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` in the browser (visual check deferred to the human).

## Changes

- `core/config/benchmark.ts`: `combatModel` block (HP, damage, cooldowns, downed durations); removed `hound.hitsToRepel`; HP-bar colours.
- `gameplay/ruin-hound.ts` (+ test): removed `hits`/`hitsToRepel`/`registerHoundHit`; added pure `defeatHound(state)→flee`.
- `gameplay/benchmark-simulation.ts` (+ test): HP for player/hounds/stand-in; `tryAttack` deals damage + defeats (downed→flee/respawn); hound **contact bite** on a cooldown; stand-in **punch damage**; **player respawn on defeat** (shared `resetCombatEntities`, keeps progress); getters `playerHp`/`playerMaxHp`/`houndHp`/`standInHp`/`houndDowned`/`standInDowned`/`playerStruck`/`playerDefeatedThisFrame`.
- `scenes/benchmark-scene.ts`: over-head HP bars (combat-gated, restart-safe) + player HP bar + downed/hit/respawn feedback; `fadeOutHound` moved to the downed→flee transition.

## Decisions applied automatically

- **Benchmark-only / non-authoritative (GD-0007).** No permadeath — defeat respawns and
  keeps collected/cleared progress. Numbers are provisional tuning, not balance.
- **Player authority preserved** — the player's logical position changes only via its own
  movement and the defeat-respawn; never by any separation (GD-0006 holds).
- **Repel stub replaced** by HP; `AttackResult.repelled` now means "this hit defeated the hound".
- **Fix from final review:** a defeated/fleeing hound no longer bites the player (added a
  `mode !== 'flee'` guard to the contact-bite loop + a focused test) — a defeated entity
  can't act (GD-0007).

## Human decisions required

- The **canonical** combat model, balancing, server-authoritative resolution, the real
  **death/consequence/penalty** model, and PvP safe-zones/flagging remain open (GD-0007
  open items; need the realtime-transport ADR + server).
- Tuning pass on the numbers (HP/damage/cooldowns) in playtest — as with the feel pass.

## Not completed / deferred (non-blocking)

- HP-bar geometry constants are provisional (offsets/sizes) — polish later.
- No post-respawn grace period (in the real greybox layout the hound resets far from the
  spawn pocket, so this is currently unobservable).
- No dedicated test for the (now-guarded) fleeing-hound case beyond the one added.

## Known risks

- All combat numbers are benchmark tuning, not approved balance.
- The stand-in retaliate + PvP damage can keep combat "sticky" while it stays in range
  (intended stub; revisit with the canonical model).

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Fight a hound (`Space`): its HP bar drops; at 0 HP it goes briefly downed, then flees/
   vanishes. Standing in a hound's contact drains your HP (corner bar) on a cadence.
3. Let your HP hit 0: you respawn at the start pocket, the encounter resets, but a
   fragment you'd already collected stays collected.
4. Attack the stand-in: its HP drops; the PvP `EM COMBATE` state carries damage both ways.
5. Automated: `pnpm validate` (lint + typecheck + 206 tests + build) is green.

## Files and evidence

- Branch: `agent/combat-push-apart-collision` (PR #19). Decision: `docs/decisions/GD-0007-benchmark-combat-model.md`. Plan: `docs/superpowers/plans/2026-07-31-benchmark-combat-model.md`.
- Review: subagent-driven — per-task spec+quality reviews clean (one stale-doc Minor fixed);
  final whole-branch review found one Important (defeated hound could still bite) → **fixed**
  + tested; player authority + no-permadeath + progress-kept all verified.
