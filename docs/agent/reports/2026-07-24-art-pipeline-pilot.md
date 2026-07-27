# Nightly report — Stage 2 art-pipeline pilot (fragment + ruin hound)

## Outcome

Stood up and validated the art pipeline (ChatGPT brief → Claude Code + PixelLab →
Aseprite) end-to-end on two real greybox assets. The `docs/art-direction/` gate
spec + a proposed dark-naturalist palette now exist; `tools/asset-pipeline/`
documents the flow; a pure `Direction8 → frame` helper was added (TDD). Two pilot
assets were generated via PixelLab and saved as loose frames + `metadata.json` at
status **`review`**: the **ancient fragment** (32×32 static, item-drop layer) and
the **ruin hound** (8-direction idle, 68×68, quadruped/`dog`) plus a south idle
animation as an animation-branch validation artifact. Both are rendered in the
client through a small art manifest with **fallback to the greybox primitives**;
the Hunter, tiles and overgrowth remain greybox. `pixelArt` (nearest-neighbor) was
enabled per GD-0005 #6. All benchmark-only / non-authoritative; nothing is
`approved`.

## Status

- Build: `passed`
- Unit tests: `passed` (153 client tests; +2 for the sprite-direction helper)
- Integration tests: `not run` (none exist for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build)
- Demonstration: `available` (run the dev server; the fragment + hound render as
  real art). **No headless screenshot was auto-captured** — see "Not completed".

## Changes

- `docs/art-direction/` — `README` (the gate), `style-guide` (proposed palette
  hexes, PixelLab param mapping, view note, soft-guidance→Aseprite caveat, sizes),
  and briefs for the fragment + ruin hound.
- `tools/asset-pipeline/README.md` — the manual flow + `metadata.json` template.
- `gameplay/sprite-directions.ts` (+ test) — `pixelLabCardinal`,
  `directionalFrameKey`; exported from the barrel.
- `assets/source/…` — fragment (`items/fragments/ancient-fragment/`) and ruin hound
  (`creatures/ruin-hound/body/idle/<dir>/` + `anim/idle/s/`) frames + metadata.
- `scenes/benchmark-assets.ts` — the art manifest; `scenes/benchmark-scene.ts` —
  preload + real-art rendering with greybox fallback; `app/game-config.ts` —
  `pixelArt: true`.
- Docs: `apps/game-client/README.md`, `src/assets/README.md`,
  `docs/technical/client-architecture.md`.

## Pipeline retro (the point of this pass)

- **Budget:** 3 generations spent (fragment 1 + hound rotation 1 + south idle 1);
  **17 of 20 trial generations remain.** `create_character` standard is
  outstanding value — **1 generation for all 8 directions**. Template animations
  cost 1 generation/direction.
- **Style adherence (the big finding):** in `standard` mode, style params are
  *soft guidance*. Silhouette/threat read **well** (the hound is clearly a lean,
  aggressive quadruped in all 8 directions; the fragment reads as a small stone
  shard). But the **palette drifted** — the hound's fur came out cool/purple, not
  the briefed earthy brown + moss/rust; the fragment's moss/brass accents are
  faint. This is exactly the **Aseprite (Stage 3)** job; assets stay `review`.
- **View:** used `low top-down`. The BETA `oblique` view (true 3/4, but **4-dir,
  ≤128px, standard-only**) was **not** tried — evaluate it next against our 2D
  oblique look, weighing the 4-direction limitation.
- **Size → canvas:** requested 48px hound → **68×68** output (a provisional data
  point for the open "medium creature canvas"); fragment 32×32 as requested.
- **Ops:** generation is async (~30–90s items, ~7 min for the 8-dir character);
  one transient PixelLab queue error occurred and a retry succeeded (no generation
  lost). Map objects expire in 8h → downloaded immediately. Small PNGs (<4KB) are
  inlined as data URIs by Vite.
- **Integration:** the manifest + fallback pattern works — real art and greybox
  coexist, so partial art never breaks the loop.

## Decisions applied automatically

- **Static 8-dir rotation is the rendered idle**; the south idle *animation* is a
  saved validation artifact, not wired to render (keeps the render consistent and
  cheap). Rationale: validates the `animate_character` branch without a mixed
  1-animated/7-static look.
- **Enabled `pixelArt: true`** globally — implements approved decision GD-0005 #6
  (nearest-neighbor), needed for crisp sprites.
- **Integrated at `review` with greybox fallback**; no Aseprite polish this pass
  (documented as Stage 3). Palette drift logged rather than hand-fixed.

## Human decisions required

- **Palette approval:** `docs/art-direction/style-guide.md` proposes a
  dark-naturalist hex registry — please approve or adjust (it's an approved *open
  item*).
- **In-context art review:** the two `review` assets need a human to review them
  **in context** before any `approved` promotion (asset-spec quality gate).
- Carried over (unrelated): D01 combat/damage model; inventory/identification.

## Not completed

- **Auto headless screenshot:** deferred — the in-context review is the GD Lead's
  to do in the dev server (the authoritative review that gates `approved`); an
  isolated-port screenshot can be produced on request.
- **Aseprite palette/outline cleanup**, the Hunter/hand-axe/tiles/overlays/object
  art, and a runtime atlas — the next pass(es).

## Known risks

- Generated art is `review`, **palette-inaccurate** (cool fur) pending Aseprite;
  do not treat as final or `approved`.
- Trial budget is finite (17 left); the Hunter (8-dir idle + walk) will likely
  want a paid plan.
- The proposed palette and all pilot art are benchmark-only, not approved rules.

## How to verify

1. `pnpm --filter @hunter-order/game-client dev`, open `http://localhost:5173`.
2. Move into the ruin interior → the **ancient fragment** is now a real stone
   sprite on the ground (item-drop layer); `E` picks it up.
3. Head to the lower pocket → the **ruin hound** is a real 8-direction sprite
   (facing follows its movement) with a separate runtime shadow; it patrols/chases.
4. Hunter, tiles and overgrowth remain greybox primitives (fallback intact).
5. Automated: `pnpm validate` (lint + typecheck + 153 tests + build) is green.

## Files and evidence

- Branch: `agent/art-pipeline-pilot` (from `dev` incl. #15). Draft PR → `dev`.
- Spec/plan: `docs/superpowers/specs/2026-07-24-art-pipeline-pilot-design.md`,
  `docs/superpowers/plans/2026-07-24-art-pipeline-pilot.md`.
- Assets: `apps/game-client/src/assets/source/{items/fragments/ancient-fragment,creatures/ruin-hound}/…`.
- Screenshots: none auto-captured (see "Not completed").
