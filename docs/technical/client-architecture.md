# Client architecture

Architecture of the Hunter Order browser client (`apps/game-client`). This
document describes the client **infrastructure** and the first gameplay slice —
the benchmark greybox (`scenes/benchmark-scene.ts` plus the Phaser-free
`gameplay/` domain). Most gameplay systems still do not exist.

See also: [`architecture.md`](./architecture.md) (whole-system direction) and the
package [`README`](../../apps/game-client/README.md).

## Goals

- A foundation that scales to an MMORPG client without large refactors.
- Clear layering and dependency direction.
- Cross-cutting concerns (config, logging, events, services) available to every
  scene through a single composition root.
- Business logic kept out of the framework: infrastructure is Phaser-free and
  unit-tested; Phaser is confined to the thin edges.

## Layers

Dependencies point **downward** only:

```text
scenes/        Feature scenes (BootScene, BenchmarkScene). Extend BaseScene.
   │
app/           Composition & startup: bootstrap(), game-config
   │
core/          Framework-light building blocks
   │             config · logger · events · services · context · scenes(base)
   │
shared/        Zero-dependency utilities (assert)

gameplay/      Phaser-free domain logic driven by scenes (pure, unit-tested):
               vec2 · direction · movement-intent · movement · collision ·
               interaction · world · camera · benchmark simulation
```

- `shared` depends on nothing.
- `core` depends on `shared` only.
- `app` depends on `core` (and the `scenes` list it registers).
- `gameplay` is pure TypeScript (no Phaser), depending only on itself.
- `scenes` depend on `core` and `gameplay`.

## Modules (`src/`)

| Path             | Responsibility                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `main.ts`        | Entry point. Calls `createGame('game-root')`.                                            |
| `app/`           | `bootstrap.ts` (`createGame`), `game-config.ts` (Phaser config).                         |
| `core/config/`   | `constants.ts`, `env.ts` (typed `import.meta.env`, dev/prod).                            |
| `core/logger/`   | Scoped, level-gated logger with injectable sink.                                         |
| `core/events/`   | Typed `EventBus<M>` + `GameEventMap` (app lifecycle events).                             |
| `core/services/` | `Service` contract + `ServiceRegistry` (service locator seam).                           |
| `core/context/`  | `GameContext` + `createGameContext()` (the composition root).                            |
| `core/scenes/`   | `BaseScene` (context access) + `SceneKeys`.                                              |
| `gameplay/`      | Phaser-free domain: movement, collision, interaction, item pickup / possession log, camera, tile world, benchmark sim. |
| `scenes/`        | Feature scenes (`BootScene`, `BenchmarkScene`). `index.ts` exports `sceneClasses`.       |
| `shared/utils/`  | `assert`, `assertDefined`.                                                               |
| `assets/`        | Bundled asset organization (see its README).                                             |

## Composition root: `GameContext`

`createGameContext()` builds one object holding the cross-cutting singletons:

```ts
interface GameContext {
  env: Env; // mode, isDev/isProd, logLevel
  logger: Logger; // root logger ('app')
  events: EventBus<GameEventMap>; // app-wide bus
  services: ServiceRegistry; // future feature services
}
```

At startup, `createGame()` builds the context and passes it to `createGameConfig`,
which stores it on the Phaser game registry inside the `preBoot` callback (before
any scene boots). `BaseScene` then exposes it to every scene:

```ts
export class MyScene extends BaseScene {
  create() {
    this.log.info("ready"); // scoped logger (this.context.logger.child(key))
    this.bus.emit("scene:started", { key: this.scene.key });
    // this.context.env / this.context.services also available
  }
}
```

> `bus` is used instead of `events` to avoid shadowing `Phaser.Scene.events`
> (the per-scene emitter).

## Conventions

- **Files:** kebab-case (`boot-scene.ts`); classes/types PascalCase.
- **Barrels:** each module has an `index.ts`; import from the module barrel
  (`@core/logger`) rather than deep files. There is intentionally no mega `@core`
  barrel so Phaser-free code never transitively imports Phaser.
- **Path aliases** (tsconfig `paths`, resolved everywhere by
  `vite-tsconfig-paths`): `@app`, `@core/*`, `@scenes`, `@shared/*`, `@assets/*`,
  `@/*`.
- **Imports** are sorted by `eslint-plugin-simple-import-sort` (run `pnpm lint`).

## Environment configuration

`core/config/env.ts` reads Vite's `import.meta.env`. Defaults: log level `debug`
in development, `warn` in production. Override with `VITE_LOG_LEVEL` in a
`.env.local` / `.env.[mode].local` file (git-ignored). See `.env.example`.
Only non-secret, `VITE_`-prefixed values belong in client env — they are embedded
in the public bundle.

## Testing strategy

Infrastructure and domain modules are Phaser-free and unit-tested in a Node
environment (`logger`, `event-bus`, `service-registry`, `env` parser, `assert`,
`constants`, `game-context`, and the whole `gameplay/` domain — movement,
collision, camera, world, simulation). `BaseScene`, `game-config`, `bootstrap`
and `BenchmarkScene` touch Phaser and are verified by the production build and by
running the client. When DOM/scene tests are needed, add a browser-like
environment (jsdom) plus a canvas stub.

## How to extend

- **Add a scene:** create `scenes/<name>-scene.ts` extending `BaseScene`, add its
  key to `core/scenes/scene-keys.ts`, and register it in `scenes/index.ts`.
- **Add a service:** implement `Service`, register it on
  `context.services` during bootstrap, resolve it via `context.services.get(...)`.
- **Add an app event:** add the entry (name → payload) to `GameEventMap`.
