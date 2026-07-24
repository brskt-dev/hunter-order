# Nightly report — ruin-hound threat & combat camera (first playable loop, Phase 6 "Threat")

## Outcome

The greybox loop now reaches **Threat**. A medium "ruin hound" paces the lower
"dangerous pocket": it patrols a short path, notices the Hunter within an aggro
radius, chases, and gives up once the Hunter escapes past a larger de-aggro radius
(hysteresis, so it does not flicker at the boundary). While it chases, a
presentation-only **combat camera** eases into a moderate zoom-in with reduced
look-ahead and eases back out on disengage (**Recover**); contact raises a
restrained danger vignette. The player can already respond defensively by moving,
spacing and retreating. This is a deliberate **stub**: there is no attacking the
hound, no damage/incapacitation and no loop-completion reward yet — the combat
model is a Level C non-goal and is the next increment. All of it is
**benchmark-only and non-authoritative**; the server remains the authority over
creature simulation and combat.

## Status

- Build: `passed`
- Unit tests: `passed` (133 client tests; +19 for the hound: 12 AI + 5 sim + 2 config)
- Integration tests: `not run` (none exist for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build)
- Demonstration: `available` (run the dev server; see "How to verify"). No live
  in-browser screenshot was captured this round — see "Not completed".

## Changes

- `gameplay/ruin-hound.ts` (+ test): a pure, Phaser-free stub AI —
  `createHoundState`, `stepHound` (patrol → chase → return with hysteresis,
  reusing the shared movement/collision core), and `houndInContact`.
- `gameplay/benchmark-simulation.ts`: the simulation now optionally owns a hound,
  steps it after the Hunter each frame, and exposes `hound`, `threatEngaged`
  (chasing) and `inDanger` (contact); `reset` restores it to patrol.
- `gameplay/index.ts`: exported the ruin-hound API.
- `core/config/benchmark.ts`: added the `hound` block (patrol path in the lower
  pocket, speed, radii) and a `combatCamera` block (explore/combat zoom,
  look-ahead scale, intensity smoothing), plus hound/danger colours.
- `scenes/benchmark-scene.ts`: renders the hound (wide body + separate runtime
  shadow + facing tick, `pivot.y` depth); a combat camera that maps a smoothed
  engagement 0..1 to zoom + look-ahead reduction and back; and a danger vignette.
- Tests: hound AI (patrol/ping-pong, aggro, hysteresis both directions, chase
  closes distance, return→patrol, wall collision, bounds, immutability, contact),
  sim integration (spawn/engage/close-in/reset/calm), config guardrails (patrol
  in-grid & out of solids, de-aggro > aggro).
- Docs: updated `apps/game-client/README.md` and `client-architecture.md`.

## Decisions applied automatically

- **Threat + combat camera + defensive response as one slice; offense deferred.**
  Rationale: a demonstrable "one step" (a threat that pursues + a camera that
  responds + a recover) that makes no premature combat-model decision. Attacking,
  damage and incapacitation are a clean next step.
- **Stub FSM with hysteresis (aggro < de-aggro).** Rationale: the doc asks for a
  behaviour stub, not final AI; hysteresis prevents chase/return flicker at the
  boundary. No pathfinding — chasing slides along walls (documented limitation).
- **Contact = a benchmark "danger state", not a damage model.** Rationale: keeps
  the threat legible without opening the death/respawn/HP questions (Level C). The
  hound is slower than the Hunter so spacing/retreat is a real response.
- **Combat camera is presentation-only.** Zoom/look-ahead never change logical
  distance, aggro or contact (those use logical positions) — GD-0004.

## Human decisions required

- `D01 — Combat & damage model` (Level C): attacking the hound, hit feedback,
  creature and Hunter damage/incapacitation, and any death/recover-from-defeat
  rules are product/architecture decisions and benchmark non-goals. Only a stub
  (chase + contact danger) exists. The next increment needs this direction (it
  will ultimately be server-authoritative — depends on the pending realtime ADR).
- Carried over: `D-inventory` (real inventory/identification) from Phase 5 remains
  open; unaffected here.

## Not completed

- **Respond (offense) → Reward → full Recover:** attacking with the hand axe,
  hit feedback, the hound taking a hit / incapacitating or fleeing, and a
  loop-completion message — the next increment.
- **Live in-browser screenshot/recording:** not captured this round (did not start
  a local server, to avoid disturbing the running dev server). The AI is covered
  by unit tests and the production build; the camera/render layer is thin. An
  isolated-port headless capture can be produced on request.

## Known risks

- The hound has **no pathfinding**: chasing into a wall makes it slide, and it can
  loiter against geometry if the Hunter hides behind a solid. Acceptable for a
  greybox stub; documented.
- The combat zoom is applied to the main camera, so the screen-fixed HUD scales
  slightly during combat (no separate UI camera yet). Minor/benchmark-only.
- The hound, its behaviour, radii, colours and the camera constants are
  **placeholders** (benchmark-only), not approved final AI, art or camera rules.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Explore south-east across the ruin toward the lower pocket.
3. As you enter the hound's aggro radius it turns to chase; the camera eases into
   a zoom-in with reduced look-ahead.
4. Let it reach you: a restrained red danger vignette appears (contact).
5. Retreat far enough (past the de-aggro radius): it breaks off and heads home,
   and the camera eases back to exploration (Recover). No rapid toggling.
6. `R` restarts: the hound is back on patrol and the camera is reset.
7. Automated: `pnpm validate` (lint + typecheck + 133 tests + build) is green.

## Files and evidence

- Branch: `agent/ruin-hound-threat` (new branch from `dev`; PR targets `dev`).
- Relevant paths: `apps/game-client/src/gameplay/ruin-hound.ts` (+ test),
  `apps/game-client/src/gameplay/benchmark-simulation.ts`,
  `apps/game-client/src/core/config/benchmark.ts`,
  `apps/game-client/src/scenes/benchmark-scene.ts`, plus their tests.
- Screenshots, logs or artifacts: none this round (see "Not completed").
