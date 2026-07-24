# Style guide (production-facing)

> Status: Draft — palette **proposed**, awaiting Game Design Lead approval.
> Scope: the first visual benchmark. Not a final art bible.

Operationalizes [`../game-design/visual-direction.md`](../game-design/visual-direction.md)
(dark naturalist; functional semi-chibi; dark coloured 1px outline; diffuse upper
light; rendered ellipse shadows; contextual UI; controlled medium detail) into
concrete values the pipeline uses. Anything not restated here defers to the
approved docs.

## Proposed palette (hex) — benchmark scope, awaiting GD approval

Medium-low saturation, controlled contrast. High saturation is **reserved** for the
rarity accent and combat-critical danger only. Seeded from the approved palette
direction and the current greybox placeholders in
[`../../apps/game-client/src/core/config/benchmark.ts`](../../apps/game-client/src/core/config/benchmark.ts).

```text
Grounds / soil:   soil-dark #2a2620 · soil #3b342a · dirt #4a3f30
Vegetation:       moss-dark #2f3a2c · moss #4a7a3f · leaf #6fae5f
Stone / masonry:  stone-dark #4a4750 · stone #74707a · stone-light #9a96a0
Aged wood:        wood-dark #3a2e22 · wood #6b5a48
Metal / rust:     iron-dark #2e2a28 · iron #5c5650 · rust #7a4a2f
Leather / skin:   leather #6b4a32 · skin #d8c9a0
Water:            water-dark #223038 · water #35545e
Reserved accent (rarity, used sparingly):  brass #c9b88a · brass-soft #d8c48a
Danger (combat-critical only):             danger #7a2222 · danger-bright #b23b3b
UI text:          ui-fg #f4f4ec
```

Organized per the approved `global + materials/biomes/states` scheme
([asset-spec](../technical/asset-specification.md#palette-technical-organization)).
The exact registry is an approved **open item** — this is a proposal for the
benchmark, not a locked rule.

## PixelLab parameter mapping

Approved direction → generation parameters (see the per-asset briefs for exact calls):

| Direction | PixelLab param |
| --- | --- |
| Dark coloured 1px outline (not pure black) | `outline: "single color outline"` (finalized in Aseprite) |
| Controlled medium detail | `detail: "medium detail"` |
| Diffuse upper light | `shading: "basic shading"` |
| Functional semi-chibi (humanoids) | `proportions: preset "chibi"` or a custom mid value (Hunter pass) |
| 8 directions for main entities | `n_directions: 8` |

**Soft-guidance caveat.** In `standard` mode PixelLab treats `outline`, `shading`,
`detail` and `proportions` as *hints* — output may drift from the palette/outline.
That drift is expected and is corrected in **Aseprite (Stage 3)**; assets stay
`review` until then. Do not treat raw PixelLab output as palette-accurate.

## View / perspective

The game is **2D oblique** (Tibia-like). PixelLab options:

- **Default: `low top-down`** (~20°, classic 3/4 RPG) — safe, supports 8 directions.
- **Evaluate `oblique`** (BETA: true 3/4 oblique, but **4 directions only, ≤128px,
  standard mode only**) during the pilot and record whether its look beats
  `low top-down` enough to accept the 4-direction limitation. Decision deferred to
  the pilot retro.

## Sizes / canvas

Per the [asset-spec](../technical/asset-specification.md#dimensions-and-geometry):
tile 48×48; Hunter 64×80, ~48px tall, feet-midpoint pivot, circular footprint
0.33 tile. Creature canvas per size-class is an open item — record the medium
ruin-hound's actual PixelLab output size/canvas during the pilot. Small item drop
~32px. Rendered ellipse shadows only; **no baked ground shadow**.
