# Movement and exploration

> Status: Mixed
> Owner: Game Design Lead
> Last reviewed: 2026-07-23

Defines how the Hunter moves, perceives the world, interacts with entities and is
followed by the camera. Approved behaviour is authoritative within its stated
boundaries; balancing numbers and out-of-scope systems are listed under
[Open items](#open-items) and must not be invented. Derives from the
[`Game Constitution`](../vision/game-constitution.md) and ADR-0002
(server-authoritative). Adopted by [`GD-0004`](../decisions/GD-0004-movement-and-exploration.md).

## Core principles

- **Direct control.** The player controls the Hunter directly; input is immediate
  movement intent. There is no click-to-move as the primary system.
- **Continuous movement, orthogonal logic.** The Hunter moves continuously and is
  not locked to tiles. Internally the world uses orthogonal coordinates; the
  oblique presentation never feeds back into the simulation.
- **Server-authoritative.** The server is the final authority on position, valid
  speed, direction, collision, run state, modifiers, interaction, and which
  information may be considered detected/identified. The client predicts and
  smooths but never decides the definitive state.
- **Readability over physical realism.** No body blocking between mobile entities;
  tactical positioning comes from terrain, range, line of sight, areas and
  distance — not from using bodies as walls.
- **Exploration without automatic understanding.** Visible, Detected and
  Identified are distinct states.
- **Contextual camera.** The camera follows automatically: it anticipates the path
  while exploring and zooms in during combat.

## Perspective and spatial logic

Oblique 2D presentation (Tibia-like) over an orthogonal coordinate model. The
projection must not affect logical distance, collision, spatial queries,
interaction range, networking or persisted position. Simulation must not depend on
sprite size, and collision is never inferred from visible pixels. Logical position
and rendered position are explicitly separated; the client never uses rendered
position as truth.

## Movement

- WASD produces a direction intent; combinations give the eight directions.
  Diagonal input is normalized so it grants no speed advantage.
- Immediate response: fast start, instant stop on release, instant direction
  change, no mandatory inertia (forced displacements are external states/effects).
- Eight-direction visual facing derived from the latest movement vector; when idle
  the Hunter keeps its last valid facing.
- The client sends intent + a monotonic sequence, never authoritative position.
  The server validates, computes allowed speed, resolves collision, updates the
  official position and publishes it; the client predicts locally and reconciles
  pending commands. Remote entities are interpolated, not predicted.

## Speed

Two voluntary modes: walk and manual run (run is server-validated). Final speed is
an explicit, auditable, deterministic chain:

```text
final = base × mode × terrain × weight × equipment × condition × temporary
```

guarded against invalid/infinite values and clamped to a safety ceiling. Terrain,
weight, equipment, conditions and temporary effects expose consumable modifiers;
the movement system does not hard-code their catalogues. Balancing numbers are not
defined here.

## Collision

Only solid scenario blocks movement. There is **no** movement collision between
mobile entities (Hunter/NPC/creature) — no body blocking, by construction. Solid
scenario stops penetration; tangential sliding along walls is allowed; resolution
is deterministic and client/server rules are compatible. Collision shapes are
simple logical forms (circle/box), never derived from sprite pixels. The server
authorizes scenario changes and corrects overlap (nearest navigable point / last
valid position) observably.

## Interaction

Hybrid contextual interaction: click selection, a universal interaction key, and a
right-click context menu. An unambiguous single target may be actioned directly;
multiple valid targets require an explicit choice (never a random irreversible
action). Every interaction has a valid range and is validated by the server
(existence, state, distance, permission, context); out-of-range interaction does
not auto-start movement. Common interaction is conceptually separate from
abilities, attacks, tools and item-on-target, though they may share selection.

## Perception

Three distinct, individual layers that may regress:

```text
Unaware → Visible → Detected → Identified
```

Visibility is influenced by distance, walls, terrain, vegetation, lighting and
weather; detection additionally by the Perception attribute, skills, equipment and
camouflage. The server controls which entities/fields are replicated (it may send
an anonymous representation or omit identity), so hidden data is not merely visually
concealed. Perception is not shared automatically across a group. The system must
scale (spatial partitioning / interest sets), not test every entity each frame.

## Controls

WASD moves, Shift runs, the mouse selects/aims/attacks/interacts and opens the
context menu; there is a universal interaction key and a consistent cancel. Actions
are modelled semantically (MoveNorth, Run, Interact, PrimaryAction, ...) so they are
remappable. Interface focus consumes input safely (typing never moves the Hunter).
Clicking the ground never starts click-to-move by default.

## Camera

Follows the Hunter automatically as a presentation director. Exploration applies
look-ahead in the movement direction and returns smoothly on stop. Entering combat
zooms in, reduces look-ahead and centres the Hunter more; leaving combat restores
exploration framing gradually, with hysteresis to avoid oscillation. The camera
consumes a combat state from the combat system — it never infers combat rules — and
never alters range, perception or any server rule. The Hunter never leaves the safe
framing area.

## Rejected models

Click-to-move as the primary system; tile-locked movement; faster diagonals;
client authority over position; body blocking between mobile entities; automatically
shared group perception; a fully fixed camera with no anticipation; free manual
camera control as default; combat without framing change; instant/abrupt zoom.

## Implementation status

This block is delivered in phases (see `GD-0004`).

- **Implemented (server-authoritative domain, transport-agnostic, unit-tested):**
  logical coordinates and eight-direction resolution (`SharedKernel/Spatial`);
  continuous movement with diagonal normalization, manual run and the auditable
  speed-modifier chain; scenario-only collision with sliding and anti-tunneling and
  no entity blocking; perception levels with regression; deterministic contextual
  interaction selection with range validation; the `MovementCommand`/`EntitySnapshot`
  reconciliation contracts (`server/src/Modules/Movement`).
- **Pending — client (Phase 2):** Phaser input→actions, local prediction and
  reconciliation, remote interpolation, oblique projection, eight-direction sprites,
  and the camera state machine (look-ahead + combat zoom) against an in-process
  simulation. Rendering needs art assets, which do not exist yet.
- **Pending — realtime transport (Phase 3):** the client↔server WebSocket transport
  is a new architectural boundary and requires an **ADR** before wiring; the domain
  and contracts above are deliberately transport-agnostic so authority is never
  faked as distributed.

## Open items

Not approved; must not become rules: definitive speed/zoom/look-ahead numbers,
run remap, terrain/weight/equipment/condition catalogues and curves, collision and
interaction ranges, detection/identification thresholds, snapshot/tick rates,
reconciliation tolerances, partial-identification representation, occlusion art
direction, and everything under "this block does not cover" in the source spec
(full combat, damage formulas, creature pathfinding, swimming, climbing, mounts,
vehicles, minimap/world map, cartographic fog of war, procedural generation,
altitude/multi-floor, full stealth). Camera/perception profiles must remain
extensible without rewriting the base.

## Related documents

- [`Game Constitution`](../vision/game-constitution.md) and [`world-structure.md`](world-structure.md) (settlements, safety layers).
- [`hunter-identity.md`](hunter-identity.md) (Perception attribute) and [`character-system.md`](character-system.md).
- ADR-0002 (server-authoritative); a future ADR will cover the realtime transport.
