# @hunter-order/game-client

Browser game client for Hunter Order. It contains the **client infrastructure**
(rendering stack, application architecture) and the **first playable-loop
greybox** — a benchmark-only, non-authoritative vertical slice with continuous
movement, static collision and an exploration camera. Final combat, interaction,
inventory, AI, networking, persistence, HUD and production art are **not**
implemented yet.

## Stack

| Concern       | Choice                                             |
| ------------- | -------------------------------------------------- |
| Language      | TypeScript (strict)                                |
| Rendering     | [Phaser 3](https://phaser.io/)                     |
| Bundler / dev | [Vite](https://vitejs.dev/)                        |
| Unit tests    | [Vitest](https://vitest.dev/) (node environment)   |
| Linting       | ESLint 9 flat config + `typescript-eslint`         |
| Import order  | `eslint-plugin-simple-import-sort`                 |
| Path aliases  | tsconfig `paths` + `vite-tsconfig-paths`           |
| Formatting    | Prettier 3 (`eslint-config-prettier` avoids clash) |

React (planned in `docs/technical/architecture.md` for UI overlays) is
intentionally **not** installed yet — it will be added with the first HUD/overlay
slice.

## Architecture

Full write-up: [`docs/technical/client-architecture.md`](../../docs/technical/client-architecture.md).

Layered, dependencies point downward: `scenes → app → core → shared`, plus a
Phaser-free `gameplay` domain the scenes drive. A single `GameContext` (env,
logger, event bus, service registry) is built at bootstrap and injected into
Phaser so every `BaseScene` can reach it.

```text
src/
  main.ts                 Entry point → createGame('game-root')
  app/
    bootstrap.ts          createGame(): builds context + Phaser game
    game-config.ts        Phaser GameConfig (+ injects context via preBoot)
  core/
    config/               constants, env (typed import.meta.env)
    logger/               scoped, level-gated logger
    events/               typed EventBus + GameEventMap
    services/             Service contract + ServiceRegistry
    context/              GameContext + createGameContext (composition root)
    scenes/               BaseScene, SceneKeys
  gameplay/               Phaser-free domain: vec2, direction, movement-intent,
                          movement, collision, world, camera, benchmark-sim
  scenes/
    boot-scene.ts         Boot screen (title + dev FPS) → hands off to benchmark
    benchmark-scene.ts    First playable-loop greybox (thin Phaser adapter)
    index.ts              sceneClasses registry
  shared/utils/           assert / assertDefined
  assets/                 bundled asset organization (see assets/README.md)
```

Path aliases: `@app`, `@core/*`, `@gameplay`, `@scenes`, `@shared/*`,
`@assets/*`, `@/*`.

## Boot screen

`BootScene` renders a solid background (`#0d0f14`), a centered "Hunter Order"
title, a dev-only FPS counter (`import.meta.env.DEV`), on a responsive
`Phaser.Scale.FIT` canvas at a 1280×720 base resolution. After a short splash it
hands off to `BenchmarkScene`.

## First playable loop — greybox benchmark

`BenchmarkScene` is the first playable vertical slice of the
[first-playable-loop benchmark](../../docs/game-design/first-playable-loop-benchmark.md):
an "Overgrown Ruin" greybox you can move a placeholder Hunter around.

**Implemented (this slice):** boot → benchmark handoff; a 32×32 logical-tile
greybox with a tile grid, static ruin-wall / tree / debris obstacles and a safe
spawn pocket; a Hunter placeholder (feet-pivot body + separate runtime shadow +
8-direction facing tick); semantic input (WASD / arrows) → continuous,
frame-rate-independent movement with normalized diagonals and immediate
stop/turn; circular-footprint collision against solids and world bounds with
wall sliding; an exploration camera that follows with smooth, direction-based
look-ahead and stays within world bounds. `R` restarts the scene; losing window
focus releases held keys.

| Input                        | Action                              |
| ---------------------------- | ----------------------------------- |
| `W` `A` `S` `D` / Arrow keys | Move (semantic actions; remappable) |
| `R`                          | Restart the scene                   |

**Where the logic lives.** All movement, collision, facing and camera math is in
the Phaser-free, unit-tested `src/gameplay/` core (`@gameplay`). `BenchmarkScene`
is a thin Phaser adapter: it reads input, drives the simulation and renders the
resulting logical state with placeholder primitives. Logical position (owned by
the simulation) is kept separate from the rendered position (GD-0004).

**Benchmark-only / temporary.** The client-side simulation is
**non-authoritative** — there is no realtime server transport yet (that needs
its own ADR; see
[GD-0004](../../docs/decisions/GD-0004-movement-and-exploration.md)). Every
feel / geometry value (speed, footprint radius, look-ahead, smoothing, camera
lerp, greybox layout, palette) is a provisional value centralized in
[`src/core/config/benchmark.ts`](./src/core/config/benchmark.ts) and marked
temporary — not an approved game rule.

**Not yet implemented:** environmental interaction, item pickup, the ruin-hound
threat, combat, the combat camera, loop-completion feedback, and all production
art. These are the next increments.

Reproduce: `pnpm --filter @hunter-order/game-client dev`, open
`http://localhost:5173`, wait for the greybox, then walk the Hunter with WASD /
arrows — bump into and slide along the ruin walls, feel the camera lead your
movement, and press `R` to restart.

## Environment

`VITE_LOG_LEVEL` (`debug|info|warn|error|silent`) tunes logging; defaults to
`debug` in dev and `warn` in prod. Override in a git-ignored `.env.local`. See
[`.env.example`](./.env.example). Only non-secret `VITE_`-prefixed values belong
in client env — they ship in the public bundle.

## Commands

Run from the repository root (they delegate here) or from `apps/game-client`:

```bash
pnpm install        # install workspace dependencies (run once at the root)
pnpm dev            # start the Vite dev server (http://localhost:5173)
pnpm build          # type-check then produce a production build in dist/
pnpm preview        # serve the production build locally
pnpm test           # run unit tests once (vitest run)
pnpm lint           # run ESLint (incl. import sorting)
pnpm typecheck      # run tsc --noEmit
pnpm format         # format sources with Prettier
pnpm validate       # root aggregate: lint + typecheck + test + build
```

## Testing note

Unit tests run in Node and cover the Phaser-free infrastructure. Phaser-touching
code (`BaseScene`, `game-config`, `bootstrap`) is verified by the build and by
running the client; add jsdom + a canvas stub when DOM/scene tests are needed.
