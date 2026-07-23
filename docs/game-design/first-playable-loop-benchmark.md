# First playable loop benchmark

> Status: Draft
> Owner: Game Design Lead
> Last reviewed: 2026-07-23

The previously approved visual benchmark is treated here as Hunter Order's **first
playable loop** — a small vertical-slice seed, not a production-complete gameplay
system. It is not only an art test: it is the first small playable loop used to
validate whether visual direction, camera, controls, world readability,
interaction, threat readability, contextual UI and the asset pipeline work together
inside the real game client.

> The benchmark answers one question: **can Hunter Order's core fantasy be felt in
> a small playable browser scene?**

Related documents: [`visual-direction.md`](visual-direction.md),
[`movement-and-exploration.md`](movement-and-exploration.md),
[`../technical/asset-specification.md`](../technical/asset-specification.md),
[`../technical/art-pipeline.md`](../technical/art-pipeline.md),
[`../technical/architecture.md`](../technical/architecture.md),
[`../vision/game-pillars.md`](../vision/game-pillars.md), and
[GD-0005](../decisions/GD-0005-visual-direction-and-asset-foundation.md).

## Core statement

The player controls an initial explorer Hunter in an overgrown ruin, explores a
small area, reads environmental signals, finds an unidentified ancient fragment,
uses a small hand axe for basic interaction/combat, encounters a medium predator
(provisionally the "ruin hound"), and completes a short loop of exploration,
interaction, threat, response, reward and recovery.

## Relationship to the game pillars

Per [`../vision/game-pillars.md`](../vision/game-pillars.md):

- **The world is the protagonist** — the scene must feel like a small visible part
  of a larger, changing world (age, ecological pressure, hidden opportunity,
  danger, partial human absence, environmental memory), not a hero arena.
- **Everyone is a Hunter** — the benchmark Hunter feels prepared, practical,
  exploratory, capable and vulnerable; not heroic by default and not class-locked.
- **Hunting means pursuing** — the player hunts a route, a trace, an object, safety,
  information and opportunity; the ruin-hound encounter validates threat/response
  but is not the whole fantasy.
- **Persistent community consequences** — no full persistence in the benchmark, but
  it must be structured so future versions can make local actions visible and
  persistent (cleared roots stay cleared, an item is gone after pickup, creature/
  danger/overlay state changes). Temporary local state is acceptable but must not
  contradict server-authoritative persistence goals.
- **Long-lived discovery** — the unidentified ancient fragment should read as an
  opportunity without being fully explained.
- **Browser first** — stay lightweight; avoid huge assets, expensive effects,
  uncontrolled particles, excessive individual image loads, heavy UI re-rendering
  and premature simulation complexity.

## Architecture alignment (server-authoritative)

Per [ADR-0002](../decisions/ADR-0002-server-authoritative.md) and
[`../technical/architecture.md`](../technical/architecture.md), the server is
authoritative for world state, movement validation, combat, rewards, inventory and
persistence. The benchmark may run a **temporary client-only simulation** to make
the loop playable before the realtime transport exists, on the condition that:

- any client-only logic is explicitly marked **benchmark-only and non-authoritative**;
- it does not claim authority over final persistent or competitive outcomes;
- movement/interaction/combat are structured so authority can later move to the
  server without discarding the slice (a future ADR covers the realtime transport,
  as flagged in [`movement-and-exploration.md`](movement-and-exploration.md)).

The presentation layer (perspective, camera, zoom) must never become a hidden
gameplay rule.

## What the loop must prove

1. The 2D oblique visual direction works in motion.
2. 48×48 tiles are readable and performant enough.
3. A 64×80 Hunter canvas works with movement, pivot, shadow, camera and equipment.
4. Continuous movement feels better than tile-locked movement.
5. The camera supports exploration and combat without exposing hidden rules.
6. The overgrown-ruin palette communicates the intended tone.
7. Base tiles + overlays can communicate environmental state.
8. Render layers and `pivot.y` sorting work in real gameplay.
9. The Hunter stays readable without becoming the visual protagonist over the world.
10. A medium creature reads as a threat.
11. Contextual UI can guide the player without MMO-style visual pollution.
12. The asset pipeline supports loose source frames, metadata, review states and
    runtime atlases.
13. The loop can be expanded later without discarding the foundation.

## Non-goals

This loop must **not** implement final versions of: multiplayer; server-authoritative
combat; persistence; procedural generation; economy; factions; settlements; lineage;
character creation; inventory; crafting; item identification; AI ecosystem
simulation; world streaming; quests; combat balancing; production UI; the production
asset set; or skill/progression systems. Simplified or local versions are allowed
**only** when clearly marked temporary.

## Benchmark scene — "Overgrown Ruin Benchmark"

Recommended starting size **32×32 logical tiles** (implementation convenience, not a
permanent world rule; the operational world unit remains a zone/region per the
architecture). Large enough for short exploration, camera follow + look-ahead, a few
terrain transitions, at least one partial-occlusion case, one item pickup, one
creature encounter, one environmental interaction, and one short return path / safe
pocket.

Composition: grass; dirt; broken stone; moss; roots; old wall fragments; vegetation
invading structure; one split tree or split ruin object; one stone/resource object;
one item drop; one medium creature spawn; one relatively safe starting pocket; one
mildly dangerous pocket.

Tone: grounded, old, damp, slightly hostile, explorable, quiet before danger,
beautiful but unsafe, reclaimed by nature — not cartoonish, not pure horror, not
heroic fantasy.

## The playable loop

```text
Spawn -> Observe -> Explore -> Interact -> Discover -> Threat -> Respond -> Reward -> Recover
```

1. **Spawn** — the Hunter starts in a small safe pocket at the ruin's edge; the
   first screen shows the Hunter, readable terrain, at least one ruin element,
   overgrowth and free space, with no UI clutter.
2. **Observe** — light environmental cues (broken path, moss/roots leading inward, a
   partially hidden object, a darker/more dangerous area); no quest marker required.
3. **Explore** — continuous movement; validates pivot, circular footprint, camera
   follow + look-ahead, tile readability, collision, depth sorting, shadows and the
   Hunter/tile/object/creature scale relationship.
4. **Interact** — recommended first interaction: use the small hand axe on overgrown
   roots, brittle vegetation or damaged wooden debris. Not a full gathering system;
   validates the contextual prompt, main-hand anchor, gather/tool animation, simple
   timing, visual feedback and an optional debris/overlay change.
5. **Discover** — find the unidentified ancient fragment (visible but not loud);
   contextual UI such as `Inspect` / `Pick up` / `Unknown fragment`. Validates the
   item-drop layer, item readability, contextual UI, pickup feedback and an inventory
   placeholder / pickup log. No heavy lore.
6. **Threat** — the ruin hound becomes visible or enters aggro range; threat read
   through silhouette, movement, shadow, approach and small anticipation. It is a
   local danger, not a boss.
7. **Respond** — attack with the hand axe, move away, reposition around terrain, use
   spacing, or retreat to the safe pocket. Validates attack animation, hit feedback,
   simple creature/Hunter damage or danger state, combat camera zoom-in, reduced
   look-ahead, combat-exit smoothing and basic pursuit/return behaviour.
8. **Reward** — minimal feedback (fragment collected, a small material drop, a blocked
   path opens, the hound retreats/is incapacitated, or a short discovery log). The
   goal is discovery and consequence, not loot dopamine.
9. **Recover** — the player exits immediate danger, the camera returns to exploration
   and the scene quiets. Intended feeling: *"I explored, found something, faced
   danger, and came back with a trace of opportunity."*

## Controls (recommended, not final)

```text
WASD / Arrow keys : movement
Mouse move        : optional pointer context
Left click        : interact / attack target if in range
E                 : interact with focused object
Space             : basic attack / tool action
```

Model input as remappable semantic actions (see
[`movement-and-exploration.md`](movement-and-exploration.md)); do not overbuild input.

## Camera

Exploration: smooth follow, direction-based look-ahead, Hunter always visible, no
hard snapping, readable world ahead. Combat: moderate zoom-in, reduced look-ahead,
more-centred Hunter, better local readability. Combat exit: gradual zoom/look-ahead
return, no hard snap, no rapid toggling (hysteresis). The camera must **not** change
range, real distance, perception, line of sight, server/gameplay rules or the
information available to the player. Exact camera constants remain open.

## Hunter

Initial explorer Hunter: practical, prepared, not heroic; functional semi-chibi
proportion; functional adventurer silhouette; boots, belt/pouch, small backpack,
functional clothing; no heavy armor, no strong class identity, no heroic pose.

Technical (from [`../technical/asset-specification.md`](../technical/asset-specification.md)):
visual height 46–52 px (ref 48 px); canvas 64×80 px; pivot at feet midpoint
(initial estimate x=32, y=68–72, calibrated before locking); circular footprint
radius 0.33 tile; 8 directions.

Minimum benchmark animations: idle (4 frames, 8 dir); walk (6 frames, 8 dir);
attack/tool (6 frames); hit (3 frames); incapacitated placeholder (3–4 frames or a
static placeholder). Preferred if feasible: run (6 frames, 8 dir). Any temporary
reduced-direction set for attack/tool/hit must be documented as temporary.

## Hand item — small hand axe

Short/medium handle, worn blade, aged wood, darkened metal; functional and
practical; not barbarian-sized, heroic or ornate. Benchmark role: light combat,
simple tool action, cutting roots/vegetation/debris, main-hand anchor validation,
attack-animation validation. Technical: main-hand anchor; 8-direction alignment if a
separate layer; attack/tool frames aligned with the Hunter; no baked shadow;
metadata + provenance.

## Creature — ruin hound (provisional)

Medium quadruped predator/scavenger; provisional benchmark name, not final lore
unless later approved. Visual: medium size class; thin, aggressive dog/wolf-like
quadruped; wild, ruin-adapted; dark fur, earthy tones, subtle moss/rust/wound
accents; not demonic, not overly fantastical, not a boss.

Minimum behaviour (a stub, not final AI): idle/patrol; detect the Hunter within a
simple range; approach/chase; basic attack or contact damage; take a hit;
incapacitate/flee/disappear placeholder; return or stop after combat ends. Validates
medium scale, rendered shadow, pivot/depth sorting, collision/footprint, 8-direction
movement if feasible, contrast against the ruin, hit feedback and the combat-camera
trigger.

## Item drop — unidentified ancient fragment

Small, ancient, stone or metal, partly moss/dirt-covered, readable on the ground,
subtly accented; no excessive glow, no mobile-loot style, not fully explained by UI.
Contextual UI: `Inspect` / `Pick up` / `Unknown fragment`; optional temporary message
"You found an unidentified ancient fragment." Validates the item-drop layer,
contextual UI, pickup, an inventory placeholder / pickup log, metadata, and no baked
shadow unless approved.

## Terrain and objects

Required tiles: grass, dirt. Required overlays: at least two of moss/vegetation
takeover, cracks, ruin wear, roots, debris. Required objects: a split tree or split
ruin object; a stone/resource object; an interactable obstruction or
vegetation/debris. Minimum collision: ruin walls, large tree/ruin base, blocking
debris (if used) and the scene boundary — using logical shapes, never sprite pixels.

## Contextual UI

Default: clean, no permanent MMO clutter (no always-on names, health bars, loot
labels, quest arrows, minimap, damage meters or full inventory panel). Interaction
prompts appear only when relevant (`Inspect`, `Pick up`, `Cut`, `Attack`). Combat:
restrained feedback (creature hit/health indication, Hunter danger, damage feedback
if implemented, optional target highlight). Discovery feedback should feel like a
trace, not a reward burst.

## Rendering and layering

Use the approved layer model from
[`../technical/asset-specification.md`](../technical/asset-specification.md):

```text
ground / ground-decal / low-object / item-drop / shadow / entity-body /
equipment / effect / high-object / canopy-roof / ui-over-world
```

Validation cases: Hunter near an object sorts by `pivot.y`; Hunter passes partially
behind a high object (if implemented); shadow stays separate from the sprite; item
drop stays readable; contextual UI renders above the world; equipment follows the
entity's depth.

## Asset pipeline

Follow the approved foundation
([`../technical/asset-specification.md`](../technical/asset-specification.md),
[`../technical/art-pipeline.md`](../technical/art-pipeline.md)): loose frames as
authoring source, a generated runtime spritesheet/atlas, and a `metadata.json` per
asset family. Benchmark asset families: `characters/hunter/human/body`,
`equipment/weapons/hand-axe`, `creatures/ruin-hound`, `tiles/overgrown-ruin/grass`,
`tiles/overgrown-ruin/dirt`, `overlays/overgrown-ruin/*`, `objects/overgrown-ruin/*`,
`items/fragments/ancient-fragment`. Statuses `draft → review → approved →
deprecated`; benchmark assets start as `draft`/`review` and are not `approved` until
reviewed in context. Provenance recorded in metadata (`source.tool`, `promptRef`,
`generatedAt`, `editedWith`).

## Implementation stages (suggested)

1. **Greybox loop** — validate gameplay structure without final art: simple scene,
   placeholder Hunter, movement, camera, collision, interactable, item pickup,
   creature placeholder, basic combat/avoidance, loop-completion message.
2. **Visual benchmark integration** — bring in the Hunter asset, hand axe, grass/dirt
   tiles, overlays, split object, ruin hound, ancient fragment, rendered shadows and
   contextual UI.
3. **Feel pass** — camera smoothing, combat transition, interaction/hit/pickup
   feedback, depth-sorting verification, scaling/shimmer check.
4. **Benchmark review** — screenshots, a short recording, and notes on readability,
   assets, camera feel and performance, plus a backlog of required changes.

## Completion criteria

The benchmark is complete when the player can: load the scene in a browser; move the
Hunter continuously; see camera follow + look-ahead; navigate terrain and objects;
interact with an obstruction/environmental object; find and pick up the unidentified
ancient fragment; encounter the ruin hound; attack, avoid or survive the encounter;
see combat-camera behaviour; exit danger and return to the exploration camera;
receive minimal loop-completion feedback; and see the scene using the approved visual
direction and layering model.

## Acceptance criteria

- **Visual** — Hunter readable at target zoom; world stays visually dominant; dark
  naturalist palette works in motion; tiles not noisy; overlays add state without
  clutter; ruin hound reads as a threat; fragment reads as interactable but not loud;
  consistent shadows; outlines aid readability without cartoon heaviness.
- **Gameplay** — movement feels continuous; collision not tile-locked; prompts appear
  only when useful; combat/avoidance is understandable; hit feedback readable; the
  loop has a clear beginning/middle/end; the basic fantasy is understood without
  tutorial text.
- **Technical** — runs in a browser; nearest-neighbor pixel rendering; no obvious
  shimmer/flicker at benchmark zoom; `pivot.y` sorting where applicable; approved
  layers; loose source-frame conventions; a runtime-atlas path convention (even if
  generation is initially manual); metadata for benchmark families; open details kept
  documented as open; and any temporary client-only simulation explicitly marked
  benchmark-only and non-authoritative.

## Performance expectations

Stay lightweight: stable frame pacing; no excessive draw calls from unnecessary
individual PNG loads; atlas-strategy readiness; camera smoothness; controlled
animation cost; no unnecessary UI re-rendering; no oversized assets; no uncontrolled
particles/effects. Do not over-optimize before the loop exists, but do not build it
in a way that clearly contradicts browser-MMORPG goals.

## Open details

Not finalized here (must not be inferred as approved): the final combat model, AI,
hitbox model, inventory, item identification, persistence rules and multiplayer
architecture; exact camera constants; final UI art; final biome palette hex values;
final atlas-generation tooling; and final procedural-generation rules.

## Notes for future implementation

Create the greybox first; keep systems small and replaceable; avoid premature final
architecture; do not hardcode art decisions outside documented constants/config; keep
camera values configurable; prefer metadata-driven entity dimensions/pivots; mark
placeholders clearly; do not mark generated assets `approved` without review; preserve
the distinction between benchmark behaviour and final game behaviour; prefer honest
TODOs over fake completeness; and if a Level C decision appears (per
[`../agent/autonomy-policy.md`](../agent/autonomy-policy.md)), record a decision
request and continue independent work.

## Canonical summary

> The first playable loop benchmark places an initial explorer Hunter in an overgrown
> ruin. The player moves continuously through a small oblique 2D scene, reads
> environmental cues, uses a small hand axe to interact with overgrowth or debris,
> finds an unidentified ancient fragment, encounters a medium ruin hound threat,
> responds through movement and basic combat, receives minimal discovery feedback,
> and returns to the exploration state. The benchmark validates the visual direction,
> camera, controls, layering, asset pipeline, contextual UI, threat readability, and
> the first trace of Hunter Order's core fantasy.
