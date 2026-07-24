# Nightly report — axe response & repelling the ruin hound (first playable loop, Phase 7 "Respond/Reward")

## Outcome

The greybox loop now closes the threat beat: the Hunter can **respond** to the
ruin hound with the hand axe. Pressing **Space** swings the axe; hits that land in
range and inside a cone in front of the Hunter's facing count, and after a couple
of hits the hound is **driven off** — it flees (running away faster than it
chased) and a brief "the pocket falls quiet" line plays as the combat camera eases
back to exploration (**Recover**). A swing shows a short arc, a landed hit flashes
the hound. This is a deliberate **benchmark stub**: there is no health bar, no
damage numbers, and the Hunter cannot be defeated (contact is still only the
danger state from Phase 6). The final combat/damage model stays a Level C
non-goal. Everything remains **benchmark-only and non-authoritative**.

## Status

- Build: `passed`
- Unit tests: `passed` (151 client tests; +18 this increment)
- Integration tests: `not run` (none exist for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build)
- Demonstration: `available` (run the dev server; see "How to verify"). No live
  in-browser screenshot was captured this round — see "Not completed".

## Changes

- `gameplay/direction.ts` (+ test): added `directionToVector` (unit vector per
  facing); the scene now uses it instead of a private duplicate.
- `gameplay/ruin-hound.ts` (+ test): a terminal `flee` mode (runs away, never
  re-engages), a `hits` counter on the state, `registerHoundHit` (flee once
  `hitsToRepel` is reached) and `houndInAttackReach` (range + facing-arc test).
- `gameplay/benchmark-simulation.ts` (+ test): `tryAttack()` returns
  `{ swung, hit, repelled }` — off cooldown it lands a hit when the hound is in
  reach/arc and repels it at the threshold; an attack cooldown paces swings;
  `reset` clears combat. New `attackRange` / `attackArcCos` / `attackCooldownSeconds`
  on `HunterSimConfig`.
- `core/config/benchmark.ts`: `combat` block (attack range/arc/cooldown), hound
  `hitsToRepel` + `fleeSpeedMultiplier`, and attack/hit-flash colours.
- `scenes/benchmark-scene.ts`: **Space** swings the axe; a transient swing arc, a
  hit flash on the hound, and on repel a discovery-style line + the hound fading
  out as it flees. New `effect` render layer for transient combat visuals.
- Tests: `directionToVector` (axis vectors, unit length, round-trip); hound flee /
  registerHoundHit / attack-reach; sim attack (miss, cooldown, repel-after-hits,
  reset); config guardrail for the attack tunables.
- Docs: updated `apps/game-client/README.md` and `client-architecture.md`.

## Decisions applied automatically

- **Repel-by-hits stub, no damage model.** Rationale: the user approved advancing
  with the proposed "hit it a couple of times → it's driven off" stub; it validates
  the attack action, hit feedback, creature reaction and combat-exit without
  committing HP, damage numbers, Hunter defeat or balancing (all Level C).
- **`flee` is terminal for the encounter.** Rationale: a clean, legible resolution
  and a natural loop-completion trace; avoids a re-aggro/oscillation model.
- **Attack = Space, single swing per press, paced by a cooldown.** Rationale: the
  doc's recommended control; the cooldown stops OS key-repeat from auto-repelling.
- **Directional hit test (range + arc), shared `directionToVector`.** Rationale:
  reads as a directed swing (not an aura) and removes a duplicated direction map.

## Human decisions required

- `D01 — Combat & damage model` (Level C, still open): health, damage numbers,
  Hunter injury/defeat, hitboxes, incapacitation vs. flee, and balancing. Only the
  repel stub exists. Any of these must be a Game Design decision (and will be
  server-authoritative — pending the realtime-transport ADR). The current stub is
  clearly marked temporary and easy to replace.
- Carried over: inventory/identification model (Phase 5) remains open.

## Not completed

- **Reward polish / explicit loop-completion:** the repel line is minimal; a fuller
  "loop complete" summary (fragment + threat resolved) is deferred.
- **Hunter consequences:** the Hunter cannot take damage or be defeated (only the
  danger vignette) — deferred with the combat model.
- **Live in-browser screenshot/recording:** not captured (did not start a local
  server, to avoid disturbing the running dev server). Logic is covered by unit
  tests and the build; the combat visuals are thin. Isolated-port capture on request.

## Known risks

- The repel threshold, attack range/arc/cooldown, flee speed, and the swing/flash
  visuals are **placeholders** (benchmark-only), not approved combat or art.
- No pathfinding (carried from Phase 6): a fleeing hound runs straight and may stop
  against geometry / the world edge; it stays there, invisible after fading. Fine
  for a greybox stub.
- `Space` is not `preventDefault`-ed; on a page taller than the viewport it could
  scroll. The benchmark canvas fills the viewport (Scale.FIT), so this is not
  expected in practice.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Explore south-east into the lower pocket to rouse the hound (it chases; the
   camera tightens; contact shows the danger vignette).
3. Face the hound and press `Space` a couple of times with it in front and close:
   each swing shows an arc, a hit flashes the hound, and the second hit drives it
   off — it flees, a brief line plays, and the camera eases back (Recover).
4. Alternatively, just retreat: it breaks off on its own past the de-aggro radius.
5. `R` restarts: the hound is back on patrol, unhurt, and the camera is reset.
6. Automated: `pnpm validate` (lint + typecheck + 151 tests + build) is green.

## Files and evidence

- Branch: `agent/hound-combat-response` (new branch from `dev`; PR targets `dev`).
- Relevant paths: `apps/game-client/src/gameplay/ruin-hound.ts`,
  `apps/game-client/src/gameplay/direction.ts`,
  `apps/game-client/src/gameplay/benchmark-simulation.ts`,
  `apps/game-client/src/core/config/benchmark.ts`,
  `apps/game-client/src/scenes/benchmark-scene.ts`, plus their tests.
- Screenshots, logs or artifacts: none this round (see "Not completed").
