# Assets

Organization convention for client assets. No assets exist yet (no pixel art in
scope) — this defines where they go.

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

## Conventions

- Kebab-case filenames (`forest-tileset.png`).
- Group by domain as the catalogue grows (e.g. `images/creatures/`).
- Loading assets is a scene/loader concern and will be added with the first real
  asset; keep asset **keys** centralized (alongside scene keys) when that time
  comes.
