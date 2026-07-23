# Visual direction

> Status: Approved
> Owner: Game Design Lead
> Last reviewed: 2026-07-23

The minimum stable visual foundation for Hunter Order: enough to start visual
development and produce the first playable style benchmark without early pipeline
chaos. It does **not** define every future artistic rule. Decisions here are
binding for the first visual benchmark unless changed by a future approved
decision.

This document covers the **art-direction / product-facing** side; the pixel,
canvas, pivot, naming, metadata and layer specifications live in
[`../technical/asset-specification.md`](../technical/asset-specification.md), and
the production workflow in [`../technical/art-pipeline.md`](../technical/art-pipeline.md).
Adopted by [`GD-0005`](../decisions/GD-0005-visual-direction-and-asset-foundation.md).

## Inherited constraints

The visual direction serves the already-approved product identity (see the
[`Game Constitution`](../vision/game-constitution.md) and [`game pillars`](../vision/game-pillars.md)):

- the world is the protagonist; the Hunter matters but is not a chosen-hero centrepiece;
- the world must visually communicate opportunity, danger, ecological change,
  decay, recovery, scarcity, routes, environmental pressure and historical traces;
- persistent browser MMORPG; the client must stay lightweight;
- the world is server-authoritative and simulation-driven — **visual presentation
  must never become a hidden gameplay rule**;
- procedural generation and systemic world state require modular, reusable,
  composable assets;
- AI-generated assets are drafts until reviewed and approved by a human.

## Perspective

Hunter Order uses a **2D oblique perspective**, visually close to games such as
Tibia — not classic diamond isometry. Tiles read as roughly square with a slight
presented angle and depth. The simulation stays fully **orthogonal** (coordinates,
movement, collision, distance, navigation, procedural generation, spatial queries,
server validation, combat range, perception, line of sight, persistent rules); the
perspective affects **only** presentation. Movement is continuous — the Hunter is
not locked to tile centres. Characters and major mobile entities use **8
directions** (`n, ne, e, se, s, sw, w, nw`). This aligns with the
`movement-and-exploration` block (a companion document integrated separately).

## Camera as presentation

The camera is presentation only and never changes attack range, real distance,
perception, line of sight, server rules or the information available to the player.
Exploration follows the Hunter smoothly with look-ahead in the movement direction
and returns to centre on stop; combat applies a smooth zoom-in, reduces look-ahead
and centres the Hunter more, with hysteresis before leaving combat to avoid
zoom oscillation. World-first framing: the world stays readable, the Hunter
readable second. (Camera behaviour is shared with the `movement-and-exploration`
block; exact numeric values are open — see [Open items](#open-items).)

## Body proportion and silhouette

- **Proportion:** functional semi-chibi — head slightly larger than realistic, torso
  readable for clothing/armor/equipment, short but functional legs; classic and
  adventurous, not childish. (Full chibi and realistic proportion were rejected.)
- **Silhouette:** a functional adventurer — alert, practical, grounded, readable in
  all 8 directions, compatible with tools/equipment; a prepared explorer, not a
  heroic protagonist and not class-coded. The base must support explorer, combatant,
  gatherer, crafter, trader, researcher and clan-member identities.

## Palette direction

**Dark naturalist.** Living nature over ruins, degraded cities and wild regions;
grounded, mysterious, slightly hostile, not cartoonish. Default saturation is
medium-low with controlled contrast. A useful external reference is the
environmental colour logic of The Last of Us (nature reclaiming ruins, moss, wet
soil, aged wood, worn metal, rust) — without collapsing into black/purple dark
fantasy.

High saturation is **reserved** for rarity, magic, supernatural phenomena, danger,
combat-critical readability and UI-critical feedback. Initial material families:
stone, moss, rust, aged wood, leather, iron, cloth, soil, water, vegetation,
concrete/old masonry. The technical palette organization (global base + material /
biome / state subpalettes) is specified in
[`../technical/asset-specification.md`](../technical/asset-specification.md); the
exact hex registry is open.

## Outline

Dark **coloured** outline (1 px) derived from the material/colour, not pure black by
default; applied to Hunter, creatures, equipment and interactive objects, with a
lighter, more integrated outline for the environment. Examples: green leaf → dark
green; leather → dark warm brown; iron → dark graphite; skin → warm dark skin tone;
stone → dark grey/greenish. Heavy pure-black outline (too cartoonish) and
minimal/no outline (risky for readability) were rejected as the default.

## Lighting

- **Default:** diffuse upper light with a slight directional bias (mostly upper,
  slight top-left tendency) — the global standard, atmospheric and readable.
- **Dramatic (exception only):** high contrast, deep shadows, light shafts, for
  dungeons, bosses, rare events, caves, rituals, phenomena, cutscenes and important
  narrative/systemic moments. It is an impact tool and must **not** become the
  common-world lighting.

## Shadow philosophy

Shadows are **rendered by the game**, not baked into sprites; base sprites must not
include baked ground shadows unless explicitly approved. The default rendered shadow
is a flattened ellipse with slight directional distortion for Hunters, creatures,
NPCs, important objects and mobile entities. AI-baked shadows tend to be
inconsistent; runtime shadows are consistent, tunable and flexible across the
default and dramatic lighting modes.

## World UI behaviour

**Contextual.** The default exploration view stays clean; combat, interaction range,
danger and discovery surface relevant, controlled signals (via hover, selection,
proximity, combat, interaction availability, danger, discovery, contextual focus)
without generic always-on MMO marker spam or losing the atmosphere. Fully-visible
MMO UI and a total absence of UI were both rejected.

## Detail level and visual tone

Controlled **medium** detail, guided by: readability > detail, silhouette > texture,
atmosphere > saturation, consistency > asset volume. Per category: characters
medium-high (silhouette first); creatures medium (threat by shape before texture);
tiles medium-low (avoid noise); overlays organic with controlled density; important
objects medium; rare items slightly higher with a reserved accent; UI prompts clean
and discreet. Avoid excessive microdetail, noisy textures, heavy black outlines,
generic MMO glow, mobile-style rarity effects, and scenery so detailed the Hunter
disappears.

## Benchmark artistic target

The first benchmark is a small, playable **overgrown-ruin** style test (living
nature, old stone, moss, wet soil, abandonment, mild danger) — a pure forest is too
generic and a city too complex for a first pass. Its artistic intent:

- an **initial explorer Hunter** — practical, prepared, not heroic (boots,
  belt/pouch, small backpack, functional clothing);
- a **small hand axe** — worn, functional, not barbarian-sized or ornate (light
  combat + gathering + exploration);
- a provisional **medium "ruin hound"** — a thin, aggressive wolf/dog-like
  quadruped adapted to ruins; earthy dark tones, not demonic or overly fantastical
  (a benchmark label, not final lore);
- an **unidentified ancient fragment** item drop — small stone/metal fragment,
  partly moss/dirt-covered, subtle rarity accent, unknown identity, no excessive
  glow.

The concrete asset list, sizes and acceptance/quality gates are in
[`../technical/asset-specification.md`](../technical/asset-specification.md).

## Open items

Not approved; must not be inferred as rules: exact camera zoom values, smoothing
constants, look-ahead distance and combat-camera timeout; the exact hex palette
registry; the final biome list beyond the initial palette-organization examples;
final UI marker art. Additional open technical values are listed in the asset
specification. Everything here is the first visual foundation, not the complete
future art bible.

## Related documents

- [`../technical/asset-specification.md`](../technical/asset-specification.md) — pixel/canvas/pivot/naming/metadata/layers.
- [`../technical/art-pipeline.md`](../technical/art-pipeline.md) — production workflow (ChatGPT → Claude Code + PixelLab → Aseprite).
- `movement-and-exploration.md` (companion block, integrated separately) — perspective, movement, camera behaviour.
- [`GD-0005`](../decisions/GD-0005-visual-direction-and-asset-foundation.md) — decision record.
