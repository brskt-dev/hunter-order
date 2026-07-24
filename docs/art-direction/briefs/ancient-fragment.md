# Brief — unidentified ancient fragment (item drop)

> Status: Draft (pilot). Generated assets stay `review` until approved in context.

## Identity & world context

A small unidentified ancient fragment found on the ground in an overgrown ruin —
reads as an **opportunity without explanation** (long-lived discovery). No heavy
lore; identity is deliberately unknown.

## Category

`item` / item-drop layer. Static, single sprite, 1 direction.

## Silhouette

Small, ancient stone-or-metal shard, irregular; partly moss/dirt-covered; worn.
Readable on the ground at benchmark zoom without being loud.

## Palette constraints

Stone/metal neutrals (`stone`, `iron`, `wood` families) with a **sparing** reserved
rarity accent (`brass` / `brass-soft`). **No glow, no beams, no mobile-loot
styling.** Dark coloured outline.

## Scale / canvas

~32×32 px, transparent background. No baked shadow (the scene renders shadows; an
item drop needs none unless approved).

## Directions / animation

1 direction; no animation.

## Prohibited

Excessive glow/emissive, rarity beams, sparkles, cartoonish proportions, bright
saturation outside the reserved accent.

## PixelLab call

`create_map_object`:
- `description`: "small ancient stone-and-metal fragment, partly moss and dirt covered, worn, subtle brass accent, no glow"
- `width`: 32, `height`: 32
- `detail`: "medium detail"
- `outline`: "single color outline"
- `view`: "high top-down"

Save to `apps/game-client/src/assets/source/items/fragments/ancient-fragment/000.png`
(+ `metadata.json`, status `review`). Download immediately (map objects expire in 8h).

## References

- [`../../game-design/visual-direction.md`](../../game-design/visual-direction.md) — "Item drop — unidentified ancient fragment".
- [`../../game-design/first-playable-loop-benchmark.md`](../../game-design/first-playable-loop-benchmark.md) — "Item drop — unidentified ancient fragment".
- [`../../technical/asset-specification.md`](../../technical/asset-specification.md) — item-drop layer, metadata, statuses.
