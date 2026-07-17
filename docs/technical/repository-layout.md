# Repository layout

```text
apps/
  game-client/        Phaser game and React HUD
  web-portal/         Public website, account and community surfaces
  admin/              Internal administration tools
server/
  src/                 .NET production projects
  tests/               Unit and integration tests
packages/
  game-protocol/       Protocol schemas and generated contracts
  game-data/           Shared static game definitions
  ui/                  Shared web UI components
  tooling/             Shared TypeScript tooling
  eslint-config/       Shared lint configuration
tools/
  world-generator/     Generation and inspection tools
  asset-pipeline/      Pixel-art and asset processing automation
  map-inspector/       World visualization tools
  load-testing/        Realtime and simulation load tests
docs/
  vision/              Stable product principles
  game-design/         Approved gameplay specifications
  technical/           Architecture and engineering guidance
  decisions/           ADRs and game-design decisions
  agent/               Autonomous development operating system
infrastructure/        Deployment and environment definitions
scripts/               Repository automation
```

Empty directories contain `.gitkeep` placeholders until their first implementation.
