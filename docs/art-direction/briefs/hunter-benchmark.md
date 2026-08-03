# Brief — benchmark Hunters (player + stand-in)

> Status: Draft (benchmark). Generated assets stay `review` until approved in context.
> Two provisional benchmark characters, **not final lore**.

## Identity & world context

Two initial explorer Hunters used in the benchmark combat test-bed:

- **Hunter Bruno Dentes** — the **player-controlled** Hunter (replaces the greybox
  rectangle).
- **Hunter Eduardo Careca** — a **stand-in "other player"** Hunter (the test-bed dummy
  that wanders and, once attacked, retaliates). Provisional benchmark stand-in, not lore.

Both are practical, prepared explorers — not heroic, not class-locked (per the pillars
and the first-playable-loop brief's Hunter description).

## Category

`character` / Hunter. 8 directions.

## Scale / canvas

Generated at **68×68px** (PixelLab, low top-down). Note: this differs from the
asset-specification's 64×80 Hunter canvas — accepted as **benchmark art** for now; a
production Hunter would be re-cut to spec. Feet-pivot ~`(34, 60)` (provisional;
calibrated in the client). Rendered ellipse shadow only; **no baked shadow**.

## Directions / animation

8 directions (`n, ne, e, se, s, sw, w, nw`). Present:

- **idle** — the 8-dir static rotation (at-rest pose).
- **run** (`running-4-frames`) — 4 frames × **all 8 directions** (movement). Complete.
- **punch** (`cross-punch`) — 6 frames, used for the `Space` attack. **Partial**:
  Bruno = `s, se, sw`; Eduardo = `s, se`. The remaining directions failed to generate
  on the PixelLab trial (heavy load) and are **pending completion** when credits allow.
  The client falls back to the nearest covered direction meanwhile.

## Palette / style

Dark-naturalist benchmark palette (see [`../style-guide.md`](../style-guide.md)); basic
shading, single-color outline, medium detail (PixelLab soft-guidance — palette drift is
corrected in Aseprite in a later pass, not now). Readable at the benchmark zoom; the
world stays the visual protagonist over the Hunters.

## Provenance

Both characters were generated **manually by the Game Design Lead** in PixelLab
(`create_character` + template `running-4-frames` + `cross-punch`), 2026-07-30. Frames
downloaded to `apps/game-client/src/assets/source/characters/hunter/<slug>/body/…` with a
per-character `metadata.json` (status `review`). Not `approved` until reviewed in context.

## Prohibited

Heroic pose, heavy armor, strong class identity, neon/high saturation, baked ground
shadow, excessive microdetail.

## References

- [`../style-guide.md`](../style-guide.md) — benchmark palette & style.
- [`../../game-design/first-playable-loop-benchmark.md`](../../game-design/first-playable-loop-benchmark.md) — "Hunter" description.
- [`../../technical/asset-specification.md`](../../technical/asset-specification.md) — canvas, pivot, directions, metadata, review states.
- [`../../decisions/GD-0006-circumstantial-entity-collision.md`](../../decisions/GD-0006-circumstantial-entity-collision.md) — the combat test-bed the stand-in serves.
