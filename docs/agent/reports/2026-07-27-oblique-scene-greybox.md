# Nightly report — oblique 2.5D presentation for the greybox

## Outcome

The benchmark greybox now presents in a **2.5D oblique (Tibia-like) style**,
still with placeholder colours. The floor reads as tiled (a subtle 2-tone grass
checker + a dirt path), and the ruin walls render as **blocks with a lit top face
and a shaded front face** on their south-exposed edges, depth-sorted with the
entities so the Hunter and ruin hound pass **in front of** walls below them and
**behind** walls above them. This is presentation-only: collision and all logic
stay orthogonal on the tile AABBs (GD-0004). A headless in-context screenshot
confirms it renders (walls show depth, floor reads tiled, hound is the real
sprite, Hunter/overgrowth remain greybox — fallback intact).

Real tile textures (grass/dirt/stone) are **deferred**: the PixelLab pro tile tool
(`create_tiles_pro`) is gated behind a paid plan (the trial refused it even with
generations showing). The extrusion geometry is built to be textured later — the
placeholders just get swapped for real tiles once PixelLab is paid.

## Status

- Build: `passed`
- Unit tests: `passed` (157 client tests; +4 for the oblique-walls helper)
- Integration tests: `not run` (none for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build)
- Demonstration: `available` — verified via an **isolated-port headless screenshot**
  (Edge headless on CDP 9345, build served on 5290; the user's 5173/browsers were
  never touched).

## Changes

- `scenes/oblique-walls.ts` (+ test): pure helper `obliqueWallTiles(solids)` → the
  set of top-face cells (all solids) and south-exposed front-face cells.
- `scenes/benchmark-scene.ts`: `drawWorld` now paints a tiled-floor read (2-tone
  grass + dirt path) and `drawObliqueWalls` (top face per solid cell at the
  low-object layer; a raised front face + dark cap line per south-exposed cell,
  depth-sorted in the entity band by base edge). Removed the flat grid + flat
  solid rectangles.
- `core/config/benchmark.ts`: `oblique` block (`wallHeight`, `dirtTiles`) and
  placeholder colours (`wallTop`, `wallFront`, `wallEdge`, `groundAlt`, `dirt`).

## Decisions applied automatically

- **Procedural extrusion, not a world skew or a generated oblique tileset.** A
  global shear would parallelogram the tiles (the visual-direction says "square
  tiles, not diamond isometry"); a full oblique autotile is the rejected-foundation
  path and needs the paid pro tool. Procedural top+front faces give the oblique
  depth cheaply and stay ready to be textured.
- **Per-tile front faces on south-exposed edges only** (via the tested helper), so
  occlusion is correct on tall/L-shaped walls without a full low/high object split.
- **Presentation-only.** Wall height is a benchmark-only constant; collision is
  unchanged (the sim's AABBs) — GD-0004.

## Human decisions required

- None new. When PixelLab is paid, approve the generated tile textures in context
  (as with the other `review` assets). The oblique presentation approach could be
  recorded as a short ADR / visual-direction open-item when it firms up.

## Not completed / deferred

- **Real tile textures** (grass/dirt/stone) — blocked on a paid PixelLab plan;
  placeholders in the meantime. This is the one remaining piece of the "piso +
  paredes oblíquas" ask; the geometry is done.
- Tall-object low/high split and any height offset for objects (trees) — future
  art-pass polish.

## Known risks

- Placeholder colours only; the oblique look will improve markedly with real
  stone/grass/dirt tiles.
- Wall height / floor tones are benchmark-only tuning values, not approved rules.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. From spawn, the floor is a tiled 2-tone grass with a dirt path; the ruin walls
   (down-right) show a top + a shaded front face (2.5D depth).
3. Walk around a wall: the Hunter/hound draw in front of it when south of it and
   are occluded when north of it. Collision is unchanged (still the tile AABBs).
4. Automated: `pnpm validate` (lint + typecheck + 157 tests + build) is green.

## Files and evidence

- Branch: `agent/oblique-scene-greybox` (from `dev`). Draft PR → `dev`.
- Paths: `apps/game-client/src/scenes/oblique-walls.ts` (+ test),
  `apps/game-client/src/scenes/benchmark-scene.ts`,
  `apps/game-client/src/core/config/benchmark.ts`.
- Screenshot: captured in-session (isolated-port headless) — walls show depth,
  floor tiled, hound real, Hunter/overgrowth greybox.
