# @hunter-order/game-client

Browser game client for Hunter Order. This package currently contains only the
technical foundation: the rendering stack and a minimal boot screen. No gameplay,
player, map, camera, networking, HUD or assets are implemented yet.

## Stack

| Concern       | Choice                                             |
| ------------- | -------------------------------------------------- |
| Language      | TypeScript (strict)                                |
| Rendering     | [Phaser 3](https://phaser.io/)                     |
| Bundler / dev | [Vite](https://vitejs.dev/)                        |
| Unit tests    | [Vitest](https://vitest.dev/) (node environment)   |
| Linting       | ESLint 9 flat config + `typescript-eslint`         |
| Formatting    | Prettier 3 (`eslint-config-prettier` avoids clash) |

React (planned in `docs/technical/architecture.md` for UI overlays) is
intentionally **not** installed yet — it will be added when the first HUD/overlay
slice is scoped.

## Project structure

```text
apps/game-client/
  index.html              Vite entry document; hosts the #game-root canvas container
  vite.config.ts          Vite + Vitest configuration
  tsconfig.json           TypeScript compiler options (strict, noEmit)
  eslint.config.js        Flat ESLint configuration
  .prettierrc.json        Prettier options
  src/
    main.ts               Entry point: creates the Phaser.Game instance
    vite-env.d.ts         Vite client type references (import.meta.env)
    game/
      constants.ts        Phaser-free game constants (unit-tested)
      constants.test.ts   Unit tests for the game constants
      config.ts           createGameConfig() factory (Phaser glue)
      scenes/
        BootScene.ts      Boot screen: title + dev-only FPS counter
```

## Testing note

Unit tests run in a plain Node environment and deliberately avoid importing the
Phaser runtime, which performs canvas/WebGL feature detection at import time and
is impractical to load headlessly without native dependencies. Phaser-derived
values are therefore isolated in `constants.ts` and tested there; `config.ts` and
`BootScene.ts` are verified by the production build and by running the client.
When DOM/scene-level tests are needed, add a browser-like environment (e.g.
jsdom) plus a canvas stub at that time.

## Boot screen

`BootScene` renders:

- a solid dark background (`#0d0f14`);
- centered "Hunter Order" text;
- a live FPS counter shown **only** in development (`import.meta.env.DEV`);
- a canvas that scales responsively to the viewport (`Phaser.Scale.FIT`,
  centered), from a base resolution of 1280×720.

## Commands

Run from the repository root (they delegate to this package) or from
`apps/game-client`:

```bash
pnpm install        # install workspace dependencies (run once at the root)
pnpm dev            # start the Vite dev server (http://localhost:5173)
pnpm build          # type-check then produce a production build in dist/
pnpm preview        # serve the production build locally
pnpm test           # run unit tests once (vitest run)
pnpm lint           # run ESLint
pnpm typecheck      # run tsc --noEmit
pnpm format         # format sources with Prettier
pnpm validate       # root aggregate: lint + typecheck + test + build
```
