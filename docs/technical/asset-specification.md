# Asset specification

> Status: Approved
> Owner: Art Direction and Technical Lead
> Last reviewed: 2026-07-23

The technical foundation for producing Hunter Order assets: sizes, pivots,
footprints, anchors, directions, frame budgets, render layers, naming, metadata,
export and status. It is the technical counterpart of the art-direction decisions
in [`../game-design/visual-direction.md`](../game-design/visual-direction.md) and
the production workflow in [`art-pipeline.md`](art-pipeline.md). Adopted by
[`GD-0005`](../decisions/GD-0005-visual-direction-and-asset-foundation.md).

These are the approved values for the **first visual benchmark**. Values marked
open under [Open items](#open-items) must not be treated as final. Presentation
values here never define gameplay logic — the simulation is orthogonal and
server-authoritative.

## Dimensions and geometry

| Concern | Approved value |
| --- | --- |
| Tile visual base | **48×48 px** (1×1 orthogonal logical unit) |
| Hunter visual height | **46–52 px**, reference **48 px** (~1 tile tall) |
| Hunter canvas | **64×80 px** (shared by all base Hunter frames) |
| Hunter pivot | midpoint between the feet; `pivot.x = 32`, `pivot.y ≈ 68–72` (calibrate before locking) |
| Hunter footprint | circle, radius **0.33 tile** (~32 px visual diameter) |

- The Hunter body target stays ~48 px; hair, helmet, backpack, cape, weapon and
  animation poses may exceed it, which is why the canvas is 64×80.
- The **footprint is not the sprite size** — it is the server/gameplay collision
  shape. A circle suits continuous movement, crowding, pathing and diagonal motion.
- `pivot.y` must not be hardcoded before the first approved base sprite is tested
  (see [Open items](#open-items)).
- Equipment layers use the same 64×80 coordinate space, or metadata that maps them
  reliably to the pivot and anchors.

## Display scaling

Crisp pixel art with **nearest-neighbor** filtering; smooth but controlled camera
zoom. Pure integer pixel-perfect scaling is too restrictive for the planned camera;
linear smoothing destroys the pixel-art look. Implementations must test for
shimmer, subpixel jitter, blur, camera artifacts and sprite misalignment during
zoom, and may fall back to **semi-discrete zoom steps** if continuous zoom produces
unacceptable artifacts.

## Directions by category

| Category | Directions |
| --- | --- |
| Hunter, important humanoid NPC, main mobile creatures, handheld equipment | 8 |
| Small/simple creatures | 4 or 8 (by approval) |
| Static objects | 1 |
| Simple directional interactables | 1–4 |
| Body equipment | follows the body's animation/direction |

Direction keys: `n, ne, e, se, s, sw, w, nw`.

## Animation frame budget

Balanced budget (main states in 8 directions; rare/specific states may use fewer
directions if approved):

| State | Frames |
| --- | --- |
| Idle | 4 |
| Walk / Run / Attack / Cast / Gather-tool | 6 |
| Hit | 3 |
| Incapacitated | 3–4 |

## Equipment: layers and anchors

Initial strategy is **hybrid**, long-term target is **modular layering**. For the
first benchmark, body + hair + simple base clothing may be generated together;
weapons, shields, helmets, backpacks, capes and major equipment must be separate
layers. The renderer and metadata must be designed to evolve toward full modular
layers (`body, skin/details, hair, base-clothing, chest, legs, boots, gloves,
helmet, backpack, cape, main-hand, off-hand, accessory, effect`).

Minimal required anchors: `head`, `main-hand`, `off-hand`, `back`, `feet/pivot`.
(head → helmets/headgear; main-hand → primary weapon/tool; off-hand →
shield/torch/secondary; back → backpack/cape; feet/pivot → global alignment and
logical position.) New anchors are added when real equipment requires them.

## Render layers

Fixed layers combined with `pivot.y` sorting; large objects split into low/high
parts when needed:

```text
1. ground
2. ground-decal
3. low-object
4. item-drop
5. shadow
6. entity-body
7. equipment
8. effect
9. high-object
10. canopy / roof
11. ui-over-world
```

Rules: ground renders below decals; shadows are a separate layer; entities sort by
`pivot.y`; equipment follows its entity's depth; large objects may split low/high;
canopy/roof may overlay characters; UI-over-world is its own layer. Pure Y-sorting
is too weak for trees/buildings/ruins/roofs; full object-splitting is deferred.

## Terrain, world objects and creatures

- **Terrain:** base tiles + modular overlays (edges, dirt, moss, leaves, cracks,
  footprints, ruin fragments, humidity, wear, environmental signals). Overlays help
  communicate abandonment, regeneration, overuse, danger, humidity, ruin,
  vegetation takeover, exploration traces, local depletion and controlled↔wild
  transitions. Tile-only (repetitive) and full autotile (too costly now) were
  rejected as the foundation.
- **World objects:** small objects are a single sprite; large objects split into low
  and high parts (tree = trunk/base + canopy; building = base/wall + roof; ruin =
  low wall + high wall).
- **Creatures:** a **size-class system** — `small`, `medium`, `large`, `huge` — each
  class defining canvas, footprint, shadow, visual height/width, frame expectations,
  detail level and threat readability. Exact per-class canvas dimensions and frame
  budgets are open.

## File naming

Folder context + numeric frame filename (`000.png`, `001.png`, ...):

```text
characters/hunter/human/body/walk/ne/000.png
equipment/weapons/hand-axe/attack/ne/000.png
tiles/temperate/grass/variant-03.png
overlays/temperate/moss/variant-02.png
objects/trees/pine/trunk/variant-01.png
objects/trees/pine/canopy/variant-01.png
creatures/ruin-hound/body/walk/sw/000.png
```

## Metadata

One `metadata.json` per asset family (e.g. `characters/hunter/human/body/metadata.json`).
Minimum fields:

```json
{
  "id": "hunter.human.body",
  "category": "character",
  "status": "draft",
  "canvas": { "width": 64, "height": 80 },
  "pivot": { "x": 32, "y": 70 },
  "directions": ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
  "animations": {
    "idle": { "frames": 4 },
    "walk": { "frames": 6 }
  },
  "source": {
    "tool": "pixellab",
    "promptRef": "prompts/hunter-human-body.md",
    "generatedAt": null,
    "editedWith": "aseprite"
  },
  "approval": {
    "state": "draft",
    "reviewedBy": null,
    "reviewedAt": null
  }
}
```

Metadata keeps asset decisions out of memory, chat and filenames. Provenance is a
simple `source` record; prompts are saved as separate files when important. Full
model/seed/parameter traceability is not required initially unless the generation
tool provides it easily.

## Export: source vs runtime

Authoring uses **loose frames** (better for review, Aseprite cleanup and
versioning); runtime uses an **automatically generated spritesheet/atlas** (better
for browser loading). The build pipeline generates runtime atlases from approved
source frames.

```text
source/  characters/hunter/human/body/walk/ne/000.png
runtime/ atlases/characters/hunter-human-body.png + .json
```

## Asset status

`draft` → `review` → `approved` → `deprecated`.

- **draft** — raw/in-production (brief exists, IA-generated, incomplete frames);
  not final.
- **review** — selected and minimally cleaned (required frames mostly present,
  dimensions correct, pivot checked, no accidental background); may enter dev builds.
- **approved** — final for current scope (visual approved, metadata complete, pivot
  and anchors validated, required directions/frames complete, no artifacts, ready
  for a runtime atlas).
- **deprecated** — replaced/old; kept only for history, fallback or reference.

## Palette technical organization

Global base palette + subpalettes by material, biome and state (default mood dark
naturalist; high saturation reserved). The exact hex registry is open.

```text
global-natural-dark
materials/ stone, moss, rust, aged-wood, leather, iron, cloth, soil, water
biomes/    temperate-forest, ruined-city, wet-cave, grassland, swamp, mountain
states/    overgrown, abandoned, burned, corrupted, controlled, wild, depleted, regenerating
```

## First benchmark package

Required assets: Hunter base; one simple hand item; one grass tile; one dirt tile;
two overlays; one tree split low/high; one stone/resource; one medium creature; one
item drop. Acceptance criteria — the benchmark demonstrates: 48×48 tile base; 64×80
Hunter canvas; ~48 px Hunter height; feet-midpoint pivot; circular footprint;
controlled pixel-art scaling; exploration + combat-zoom placeholder; functional
semi-chibi silhouette; dark naturalist palette; dark coloured outline; diffuse
upper lighting; rendered directional-ellipse shadow; base tiles + overlays; a split
tree/ruin object; a medium creature; an item drop; a contextual interaction prompt;
a `metadata.json` per asset family; and loose source frames + generated runtime
atlas path convention.

## Quality gates

An asset is not final unless applicable checks pass: correct canvas, pivot,
directions and frame count; no accidental background; no baked ground shadow unless
explicitly approved; outline follows the coloured-outline rule; palette matches the
dark naturalist direction; no excessive saturation outside reserved cases; no
excessive microdetail; metadata exists and is current; provenance recorded; status
`approved`; reviewed **in context**, not only on a transparent background. See also
the pipeline quality gates in [`art-pipeline.md`](art-pipeline.md).

## Open items

Not approved; must not be inferred as rules: exact `pivot.y` before the first
approved sprite test; exact hex palette registry; exact Phaser atlas-generation
tool; exact PixelLab API integration; final metadata schema versioning; exact
creature canvas dimensions and frame budgets per size class; exact UI marker art;
exact runtime loading architecture; combat/hitbox rules; and the final biome list
beyond the initial examples. Numeric camera values live in
[`../game-design/visual-direction.md`](../game-design/visual-direction.md).
