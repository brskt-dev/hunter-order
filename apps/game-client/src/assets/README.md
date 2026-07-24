# Assets

Organization convention for client assets. The first **benchmark pilot** art now
lives under `source/` (see below); everything else is still convention.

## Two locations

- **`src/assets/`** (this folder) — assets **imported** into code and processed
  by Vite (hashing, inlining, bundling). Import them so the build tracks them:

  ```ts
  import logoUrl from '@assets/images/logo.png';
  ```

  Subfolders:
  - `images/` — sprites, spritesheets, textures, UI images
  - `audio/` — music and sound effects
  - `fonts/` — bitmap/web fonts

- **`public/`** (at the package root, created when first needed) — static files
  served verbatim at the site root, referenced by absolute URL (`/foo.png`).
  Use for large or rarely-changing files that should not be bundled.

## `source/` — pipeline art (loose frames)

Loose source frames produced by the asset pipeline
([`tools/asset-pipeline/`](../../../../tools/asset-pipeline/README.md)), one
`metadata.json` per asset family, named per the approved
[asset-specification](../../../../docs/technical/asset-specification.md) (e.g.
`source/creatures/ruin-hound/body/idle/sw/000.png`,
`source/items/fragments/ancient-fragment/000.png`). Current pilot assets are
status **`review`** (benchmark-only, not `approved`). The scene loads them via the
benchmark art manifest ([`scenes/benchmark-assets.ts`](../scenes/benchmark-assets.ts))
and falls back to greybox primitives when a texture is absent. A generated runtime
atlas (vs. these loose frames) is a deferred open item.

## Conventions

- Kebab-case filenames (`forest-tileset.png`).
- Group by domain as the catalogue grows (e.g. `images/creatures/`).
- Loading assets is a scene/loader concern and will be added with the first real
  asset; keep asset **keys** centralized (alongside scene keys) when that time
  comes.
