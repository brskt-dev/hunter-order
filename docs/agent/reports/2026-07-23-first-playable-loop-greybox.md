# Nightly report — first playable loop (greybox: spawn → explore)

## Outcome

The client now boots into a playable "Overgrown Ruin" greybox. A human can open
the client in a browser, watch the boot screen hand off to `BenchmarkScene`, and
walk a placeholder Hunter continuously around a 32×32 logical-tile area with
WASD / arrow keys: diagonals are speed-normalized, stops and turns are instant,
the Hunter collides with (and slides along) static ruin-wall / tree / debris
obstacles, cannot leave the scene bounds, and an exploration camera follows with
smooth, direction-based look-ahead. `R` restarts the scene. This delivers the
`Spawn → Observe → Explore` segment of the reference loop with primitives; no
final art, interaction, item, threat or combat is included yet. All gameplay
logic is Phaser-free and unit-tested; the client-side simulation is explicitly
**benchmark-only and non-authoritative**.

## Status

- Build: `passed`
- Unit tests: `passed`
- Integration tests: `passed`
- Client validation: `passed`
- Demonstration: `available`

Details: `pnpm validate` (root) → lint, typecheck, 89 unit tests (16 files),
production build all pass. `dotnet test` (server, untouched) → 7 unit + 4
integration pass. A headless-Chrome screenshot of the running greybox was
captured (see Files and evidence).

## Changes

- Added a Phaser-free gameplay domain `apps/game-client/src/gameplay/` (alias
  `@gameplay`): `vec2`, `direction` (8-way facing), `movement-intent` (semantic
  actions → normalized intent), `movement` (dt-based, frame-rate-independent
  integration), `collision` (circular footprint vs AABB solids + world bounds
  with axis-separated sliding), `world` (tile world → solids/bounds/spawn),
  `camera` (look-ahead target + exponential smoothing), and `benchmark-simulation`
  (composed step + stateful wrapper, marked non-authoritative). 59 new unit tests.
- Added `apps/game-client/src/core/config/benchmark.ts` centralizing every
  benchmark-only value (geometry, speed, camera, palette) and the greybox layout,
  plus a config-sanity test.
- Added `apps/game-client/src/scenes/benchmark-scene.ts` — a thin Phaser adapter
  that renders the greybox with primitives, reads keyboard input, drives the
  simulation, sorts by layer/`pivot.y`, and runs the exploration camera.
- Wired the scene in: `SceneKeys.Benchmark`, `sceneClasses`, `@gameplay` tsconfig
  path, and a short `BootScene` splash that hands off to the benchmark.
- Documentation: client `README.md`, `docs/technical/client-architecture.md`, and
  this report.

## Decisions applied automatically

- Level B — All feel/geometry numbers (walk speed, footprint radius, look-ahead
  distance/smoothing, camera lerp, dt cap, greybox layout, palette) are
  provisional. Rationale: the benchmark doc and GD-0004/GD-0005 list these as
  open; the session brief authorizes provisional values for the greybox. They are
  centralized in `core/config/benchmark.ts`, marked temporary, and adjustable
  without touching systems.
- Level A/B — New Phaser-free `gameplay/` layer + `@gameplay` alias. Rationale:
  the client architecture mandates keeping business logic out of Phaser; this is
  the smallest structure that makes movement/collision/camera unit-testable and
  keeps the simulation transport-agnostic (so authority can later move to the
  server without discarding the slice).
- Level A — Identity logical→screen projection for now; oblique presentation is
  deferred to the art pass. Logical vs rendered position are kept separate so the
  projection can change without touching the simulation.

## Human decisions required

- `D01 — Realtime client↔server transport (ADR)`: The design is
  server-authoritative but no realtime transport exists; choosing one (e.g.
  WebSocket) needs its own ADR (already flagged by GD-0004). Not blocking this
  increment — the greybox runs a non-authoritative client-only simulation. Needed
  before movement/collision authority can move server-side.
- `D02 — Promotion of benchmark values to rules`: Turning any provisional value
  (speed, ranges, zoom, camera constants, combat numbers) into an approved game
  rule is a Game-Design-Lead (Level C) decision. Until then they remain
  benchmark-only.

## Not completed

- Loop phases beyond Explore: `Interact / Discover / Threat / Respond / Reward /
Recover` (Phases 4–7) — intentionally deferred to later increments per the
  small-increment plan.
- Manual run (`Shift`) and the speed modifier chain — deferred; base walk speed
  is structured to accept a mode multiplier later.
- Production art, runtime atlas, and the oblique projection — deferred to the
  visual-integration pass (Phase 8).

## Known risks

- Placeholder visuals only (primitives); readability/feel claims are provisional
  until real art is integrated.
- Client-only simulation is non-authoritative; it must not be mistaken for final
  movement/collision authority.
- The collision resolver assumes per-frame displacement smaller than a solid
  (true given the clamped dt and benchmark speed); very large speeds/dt would need
  swept collision.
- Depth uses the approved layer stack with `pivot.y` sorting on the entity layer;
  static solids render on a fixed low-object layer (no split low/high objects
  yet), so "pass fully behind a tall object" is not demonstrated until Phase 8.

## How to verify

1. `pnpm install` then `pnpm validate` at the repo root → expect lint, typecheck,
   89 tests and build to pass.
2. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
3. Expected: boot title briefly, then the greybox. Move with WASD / arrows —
   continuous movement, normalized diagonals, instant stop/turn; collide with and
   slide along the ruin walls; cannot exit the world; camera follows with
   look-ahead. Press `R` to restart. (Optional: `dotnet test` for the untouched
   server baseline.)

## Files and evidence

- Branch: `agent/first-playable-loop-greybox` (from latest `dev`).
- Relevant paths: `apps/game-client/src/gameplay/**`,
  `apps/game-client/src/scenes/benchmark-scene.ts`,
  `apps/game-client/src/core/config/benchmark.ts`,
  `apps/game-client/src/core/scenes/scene-keys.ts`,
  `apps/game-client/src/scenes/index.ts`,
  `apps/game-client/src/scenes/boot-scene.ts`, `apps/game-client/tsconfig.json`.
- Screenshots, logs or artifacts: headless-Chrome screenshot of the running
  greybox (Hunter in the spawn pocket, ruin-wall corner, tile grid, camera
  follow, contextual hint). Validation logs: `pnpm validate` exit 0 (89 tests);
  `dotnet test` exit 0 (11 tests).
