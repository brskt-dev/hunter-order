# Brief — ruin hound (medium creature)

> Status: Draft (pilot). Provisional benchmark label, **not final lore**. Generated
> assets stay `review` until approved in context.

## Identity & world context

A medium predator/scavenger adapted to the overgrown ruins — the benchmark's local
threat. Provisional name only; not approved lore.

## Category

`creature` / medium size-class. 8 directions.

## Silhouette

Thin, aggressive wolf/dog-like quadruped; wild, ruin-adapted; alert, lean. Threat
must read from **shape/silhouette before texture**.

## Palette constraints

Dark earthy fur (`iron-dark`, `wood-dark`, `soil` families) with subtle moss/rust
accents (`moss-dark`, `rust`). Dark coloured outline. **Not** demonic, neon,
overly fantastical, or boss-scale.

## Scale / canvas

Medium size-class. PixelLab `size` ~48–64 → canvas ~40% larger; **record the actual
output size/canvas** (medium creature canvas is an approved open item). Rendered
ellipse shadow only; **no baked shadow**.

## Directions / animation

8 directions (`n,ne,e,se,s,sw,w,nw`). Pilot: **idle first** (the 8-dir rotation is
the static idle baseline; add a cheap south idle animation to exercise the
animation branch). Walk/attack/hit deferred to a later pass.

## Prohibited

Demonic/horror styling, neon or high saturation, boss scale, baked ground shadow,
excessive microdetail.

## PixelLab calls

1. `create_character`:
   - `description`: "thin aggressive ruin-adapted wolf-dog, dark earthy fur, subtle moss and rust accents"
   - `body_type`: "quadruped", `template`: "dog"
   - `n_directions`: 8, `mode`: "standard", `view`: "low top-down"
   - `detail`: "medium detail", `outline`: "single color outline"
   - `name`: "Ruin Hound"
2. `animate_character` (cheap idle, south only):
   - `mode`: "v3", `directions`: ["south"]
   - `action_description`: "idle breathing, subtle weight shift"
   - `frame_count`: 6

Save 8-dir frames to `apps/game-client/src/assets/source/creatures/ruin-hound/body/idle/<dir>/…`
(+ `metadata.json`, status `review`), mapping PixelLab cardinal names → our
`<dir>` keys.

## References

- [`../../game-design/visual-direction.md`](../../game-design/visual-direction.md) — "Creature — ruin hound".
- [`../../game-design/first-playable-loop-benchmark.md`](../../game-design/first-playable-loop-benchmark.md) — "Creature — ruin hound (provisional)".
- [`../../technical/asset-specification.md`](../../technical/asset-specification.md) — size-class system, frame budget, directions, metadata.
