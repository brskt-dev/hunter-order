# Nightly report — combat feel (i-frames, take-hit, telegraph) + punch art

## Outcome

The benchmark combat now reads and feels much better. The two Hunters' **punch is
complete in all 8 directions** (the fallback is dropped). Three combat-feel additions the
GD Lead chose landed: **i-frames** (a brief invulnerability window after taking a hit and
after respawn — no more getting chain-drained by a pack or bitten the instant you
respawn); a weighty **take-hit reaction** (flash + a light camera-shake + micro hit-stop
when you're hit; the stand-in flashes/recoils when you hit it; and your punch's impact now
syncs to the animation's **connect frame** rather than the keypress); and an enemy
**attack telegraph** — hounds and the stand-in now **wind up** briefly before they bite/
punch, with a visible tell, so you can react/back off. All benchmark-only tuning (GD-0007).

## Status

- Build: `passed`
- Unit tests: `passed` (214 client tests; +i-frame, +telegraph, config sanity; 7 timing tests adapted)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build, exit 0)
- Demonstration: `available` in the browser (visual check deferred to the human).

## Changes

- **Art:** completed `cross-punch` 8-dir for both Hunters (66 new PNGs); `metadata.json` `punch.directions` → 8; `benchmark-assets.ts` `PLAYER_PUNCH_DIRS`/`TEST_PUNCH_DIRS` → 8 (the `nearestCoveredDirection` fallback is now inert but kept as a safety net).
- `core/config/benchmark.ts`: `combatModel.playerInvulnSeconds` (0.7), `hound.windupSeconds` (0.35), `standIn.windupSeconds` (0.3).
- `gameplay/benchmark-simulation.ts`: i-frames (`playerInvulnTimer`/`playerInvulnerable`, gates both damage sources, set on damage + respawn); enemy telegraph (`houndWindupTimer[]`/`standInWindupTimer`, bite/punch resolve only after the wind-up, cancel on leaving contact/range/downed/flee/!pvp; getters `houndWindingUp`/`standInWindingUp`).
- `scenes/benchmark-scene.ts`: player take-hit shake + micro hit-stop; i-frame alpha blink; stand-in flash+recoil on being hit; enemy telegraph tell (tint/scale while winding up); punch connect-sync (impact fires at the connect frame, immediate fallback for greybox) — all presentation-only, restart-safe.

## Decisions applied automatically

- **Benchmark-only tuning (GD-0007).** Player logical position never displaced by any
  recoil (camera/sprite visual only); damage stays i-frame-gated. Art stays `review`.
- **Wind-up during i-frames still "resolves" but deals no damage** (the enemy commits to
  its attack; you just don't take the hit) — intentional, documented.
- Applied one review robustness tweak: the connect-sync fires on the first frame at or
  past the connect frame (not a strict `===`), so a frame hitch can't drop the impact.

## Human decisions required

- None new. Tuning pass on the new values (invuln/wind-up durations, shake scale) in
  playtest, as with the earlier feel numbers. The canonical combat/PvP/death model and the
  transport ADR remain the open items from GD-0007.

## Not completed / deferred (non-blocking)

- Greybox telegraph tell is scale-only (no tint) — real art gets the tint; both Hunters/
  hound use real art in this benchmark so it's moot.
- `pendingPunchImpact` is single-slot (documented) — inert while the attack cooldown
  exceeds the connect time; make it a queue if that ever changes.
- Balance numbers remain provisional.

## Known risks

- All combat/feel numbers are benchmark tuning, not approved balance.
- Telegraph timing changes the combat cadence — worth a feel check that the wind-ups feel
  fair (not too long/short).

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Attack in any direction (`Space`): the punch plays for that facing (all 8), and the
   hit flash/shake lands with the fist (connect frame), not on the keypress.
3. Stand in a hound's contact: it **winds up** (a tell) before each bite; after a bite you
   get a brief **invulnerability blink** — a pack can't chain-drain you every frame.
4. Get defeated: after respawn you're briefly invulnerable (no instant re-bite).
5. Hit the stand-in: it flashes/recoils; it also winds up before punching you back.
6. Automated: `pnpm validate` (lint + typecheck + 214 tests + build) is green.

## Files and evidence

- Branch: `agent/combat-push-apart-collision` (PR #19). Plan: `docs/superpowers/plans/2026-08-03-combat-feel-punch-update.md`.
- Review: subagent-driven — per-task spec+quality reviews clean (one connect-sync comment
  + one robustness tweak applied); final whole-branch review of the delta **Ready to
  merge** — player authority, i-frame gating (both sources), telegraph resolve/cancel, and
  restart-safety all verified.
