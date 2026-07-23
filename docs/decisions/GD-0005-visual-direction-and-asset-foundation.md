# GD-0005 - Adopt the visual direction and asset foundation

> Status: Accepted
> Date: 2026-07-23
> Decision owner: Game Design Lead

> **ID note:** the source package proposed this decision as GD-0004. That ID was
> already taken by the Movement & Exploration decision (in an open pull request),
> so this decision was assigned **GD-0005** to keep decision IDs unique. Flagged
> rather than resolved silently.

## Context

Hunter Order needs a minimum stable visual foundation to start visual development
and produce a first playable style benchmark without early pipeline chaos, and
without committing to a full future art bible. The visual direction must serve the
already-approved product identity (world as protagonist; discovery, exploration,
opportunity, risk and persistent consequences), stay lightweight for browsers, and
never let presentation become a hidden gameplay rule (the simulation is orthogonal
and server-authoritative).

## Decision

Adopt the visual and asset foundation, recorded across two specifications:

- [`docs/game-design/visual-direction.md`](../game-design/visual-direction.md) —
  perspective, palette, proportion, silhouette, outline, lighting, shadow
  philosophy, world-UI behaviour, detail level, visual tone, benchmark artistic
  target.
- [`docs/technical/asset-specification.md`](../technical/asset-specification.md) —
  tile 48×48, Hunter 64×80, pivot, footprint, anchors, directions, frame budgets,
  render layers, naming, metadata, export (source/runtime), asset statuses, palette
  technical organization, quality gates.

### Approved decisions (summary)

| # | Topic | Decision |
| ---: | --- | --- |
| 1 | Tile size | 48×48 px visual base (1×1 orthogonal unit) |
| 2 | Hunter height | 46–52 px, reference 48 px |
| 3 | Hunter canvas | 64×80 px |
| 4 | Hunter pivot | midpoint between the feet (`pivot.y` calibrated before locking) |
| 5 | Hunter footprint | circle, radius 0.33 tile |
| 6 | Display scaling | crisp pixel art, nearest-neighbor, controlled smooth zoom |
| 7 | Base zoom | medium exploration, moderately closer combat |
| 8 | Body proportion | functional semi-chibi |
| 9 | Base silhouette | functional adventurer |
| 10 | Base palette | dark naturalist |
| 11 | Outline | dark coloured 1 px outline |
| 12 | Lighting | diffuse upper light; dramatic lighting only for special scenes |
| 13 | Shadows | rendered by the game; flattened directional ellipse |
| 14 | Animation budget | balanced (idle 4, walk/run/attack/cast/gather 6, hit 3, incap 3–4) |
| 15 | Equipment | hybrid initially, modular layering long-term |
| 16 | Anchors | minimal: head, main-hand, off-hand, back, feet/pivot |
| 17 | Render order | fixed layers + pivot.y sorting |
| 18 | Terrain | base tiles + modular overlays |
| 19 | World objects | single sprite when small; split low/high when needed |
| 20 | Creatures | size-class system (small/medium/large/huge) |
| 21 | World UI | contextual |
| 22 | File naming | folder context + numeric frame filename |
| 23 | Metadata | `metadata.json` per asset family |
| 24 | Palette system | global base + material/biome/state subpalettes |
| 25 | Direction policy | 8 for main entities; reduced for secondary |
| 26 | Sprite export | loose frames as source; generated atlas at runtime |
| 27 | Asset status | draft / review / approved / deprecated |
| 28 | Provenance | simple source record in metadata |
| 29–35 | First benchmark | small overgrown-ruin package (explorer Hunter, hand axe, ruin hound, ancient fragment), controlled medium detail |
| 36 | Documentation | visual guide + technical asset spec + this decision record |

## Alternatives considered / tradeoffs

- **Tile size** 32×32 (cheaper, more classic, but too limited for environmental
  storytelling) and 64×64 (richer, but too expensive/zoomed-in) — rejected in favour
  of 48×48.
- **Hunter canvas** 48×64 (too tight) and 64×64 (vertically cramped for equipment) —
  rejected in favour of 64×80.
- **Body proportion** full chibi (infantilizing, compresses equipment) and realistic
  (loses readability at 48 px) — rejected in favour of functional semi-chibi.
- **Outline** heavy pure-black default (too cartoonish) and minimal/no outline
  (risky for readability) — rejected in favour of a dark coloured outline.
- **Equipment** fully baked outfits (do not scale for an MMO) and full modularity
  from day one (too complex pre-benchmark) — rejected in favour of a hybrid start.
- **Terrain** tile-only (repetitive) and full autotile now (too costly) — rejected
  in favour of base tiles + overlays.
- **World UI** always-on MMO UI (kills atmosphere) and no UI (hurts usability) —
  rejected in favour of contextual UI.
- **Render order** pure Y-sorting (too weak for tall objects) and advanced
  object-splitting now (too heavy) — rejected in favour of fixed layers + pivot.y.

## Rejected approaches

Classic diamond isometry; presentation defining gameplay rules; tile-locked
movement; baked ground shadows by default; heavy black outline as default; always-on
MMO UI; and treating this foundation as the complete future art bible.

## Open details (not approved)

Exact camera zoom values, smoothing constants, look-ahead distance and combat-camera
timeout; exact `pivot.y` before the first approved sprite test; the exact hex palette
registry; the Phaser atlas-generation tool; PixelLab API integration; final metadata
schema versioning; exact creature canvas dimensions and frame budgets per size
class; UI marker art; runtime loading architecture; combat/hitbox rules; and the
final biome list beyond the initial examples. These must not be inferred as approved.

## Future evolution areas

Full modular equipment layering; an expanded anchor map; an autotile/overlay system;
per-size-class creature specifications; a formal palette hex registry; the atlas
build tool and runtime loading; and PixelLab pipeline automation under
`tools/asset-pipeline/`.

## Relationship to existing decisions

Serves the constitution and pillars; aligns with the perspective, movement and
camera in `movement-and-exploration.md`; and gives the pixel/canvas/naming/metadata
standards that the `art-pipeline.md` "open implementation decisions" were waiting on.
No material conflict with a newer canonical document, except the GD-ID collision
noted above.

## Source material

- Approved visual-direction and asset-foundation decision package, consolidated 2026-07-23.
- Repository is the only source of truth.
