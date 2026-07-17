# @hunter-order/game-client

Browser game client for Hunter Order. This package contains the **client
infrastructure** — the rendering stack, application architecture and a minimal
boot screen. No gameplay, player, map, camera, networking, HUD or assets are
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

Layered, dependencies point downward: `scenes → app → core → shared`. A single
`GameContext` (env, logger, event bus, service registry) is built at bootstrap
and injected into Phaser so every `BaseScene` can reach it.

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
  scenes/
    boot-scene.ts         Boot screen (title + dev FPS); reference BaseScene usage
    index.ts              sceneClasses registry
  shared/utils/           assert / assertDefined
  assets/                 bundled asset organization (see assets/README.md)
```

Path aliases: `@app`, `@core/*`, `@scenes`, `@shared/*`, `@assets/*`, `@/*`.

## Boot screen

`BootScene` renders a solid background (`#0d0f14`), a centered "Hunter Order"
title, a dev-only FPS counter (`import.meta.env.DEV`), on a responsive
`Phaser.Scale.FIT` canvas at a 1280×720 base resolution.

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
