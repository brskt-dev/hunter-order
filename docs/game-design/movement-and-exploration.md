# Movement and exploration

> Status: Mixed
> Owner: Game Design Lead
> Last reviewed: 2026-07-23

Defines how the Hunter moves, perceives the environment, interacts with world
entities and is followed by the camera. It establishes the decisions needed to
begin the playable base without leaving core behaviour implicit; it does not
specify every future exploration system.

Approved decisions, principles and consequences below are authoritative within
their stated boundaries. Balancing numbers and out-of-scope systems are listed
under [Open items](#open-items) and must not be treated as approved rules. Derives
from the [`Game Constitution`](../vision/game-constitution.md) and
[ADR-0002](../decisions/ADR-0002-server-authoritative.md); adopted by
[`GD-0004`](../decisions/GD-0004-movement-and-exploration.md).

## Scope

Covered: visual perspective; spatial logic; continuous movement; eight-direction
orientation; server authority; walk and run; speed modifiers; scenario collision;
absence of collision between mobile entities; contextual interaction; perception
states; keyboard and mouse controls; camera follow; look-ahead; combat zoom.

Not covered (future blocks): full combat and damage formulas; creature
pathfinding; swimming, climbing, mounts and vehicles; minimap and world map;
cartographic fog of war; procedural generation; altitude, bridges and multiple
floors; full stealth; specific equipment, abilities and final animations;
definitive speed/zoom values; controls for other platforms.

## Core principles

- **Direct control.** The player controls the Hunter directly; input is immediate
  movement intent, not a click-to-destination route.
- **Fluid movement, predictable logic.** Movement is continuous while the world
  uses an orthogonal spatial structure internally. Visual depth must not change
  coordinates, collision or navigation.
- **Server-authoritative.** The server is the final authority over position, valid
  speed, direction, collision, run state, movement modifiers, start/end of
  interactions, combat state that affects the camera, and what may be considered
  detected or identified. The client predicts and smooths but never decides the
  definitive state.
- **Readability over physical realism.** No body blocking between Hunters, NPCs and
  creatures. Tactical positioning comes from terrain, range, line of sight, areas
  of effect and distance — not from using bodies as walls.
- **Exploration without automatic understanding.** An entity may be visually
  present without being detected or identified.
- **Contextual camera.** The camera adapts to context without constant manual
  control: it anticipates the path while exploring and zooms in during combat.

## Glossary

- **Hunter** — the player-controlled character.
- **Mobile entity** — a Hunter, NPC, creature or other entity that can change
  position.
- **Scenario** — a physical world element that can block movement (wall, rock,
  tree, building).
- **Logical position** — the coordinate the server uses for the real location.
- **Rendered position** — the visual position shown by the client, possibly
  interpolated or predicted.
- **Visual direction** — the orientation chosen to select the sprite/animation.
- **Contextual interaction** — an interaction whose result depends on the selected
  target, distance and current context.
- **Visible / Detected / Identified** — the three perception layers (see below).
- **Look-ahead** — a smooth camera offset in the Hunter's movement direction.
- **Combat state** — a systemic flag indicating the Hunter is in a relevant combat
  situation.

## Perspective and spatial logic

Oblique 2D presentation (inspired by 2D MMORPGs such as Tibia) over an
**orthogonal** coordinate model (independent X and Y axes, plus a future layer/level
axis). The oblique projection is a function of the logical position and must not
alter logical distance, collision, spatial queries, interaction range, networking,
world partitioning, AI movement or persisted position.

The code must explicitly separate logical position from rendered position, and
movement direction from visual direction. Normative rules: simulation does not
depend on sprite size; collision is not inferred from visible pixels; the projection
is derived from the logical position; the server need not know screen pixels; the
client must never use rendered position as truth for validating actions.

## Movement

Movement is continuous — the Hunter may occupy any valid position within the
navigable space and need not align to tile centres, complete a cell before turning,
wait for an animation, or follow a click-generated route.

- **Input:** WASD produces a direction intent; the four combinations give the eight
  directions. No directional key means zero movement intent.
- **Diagonal normalization:** diagonal movement must not be faster than orthogonal;
  the input vector is normalized before speed is applied.
- **Response:** fast start, immediate stop on release, immediate direction change,
  no mandatory inertia in base movement. Forced displacements (knockback, stun,
  slow, root) act as external modifiers/states, not as base-movement inertia.
- **Eight-direction visual facing:** derived from the latest movement vector; when
  idle the Hunter keeps its last valid facing (aiming/attacking may change it later).
- **Minimum logical state:** position, intent direction, visual direction, current
  speed, movement mode, active modifiers, blocking state, tick/timestamp, processed
  input sequence.
- **Authority:** the client sends intent (direction, run start/stop, sequence,
  optional timestamp), never authoritative position. The server validates, computes
  allowed speed, resolves collision, updates the official position and publishes it,
  and rejects/corrects illegal speed, unauthorized teleport, scenario traversal,
  movement during blocking states, invalid positions and (when needed) out-of-order
  commands.
- **Prediction and reconciliation:** the client may predict locally, must reconcile
  against the official state using a sequence identifier, correcting small
  differences smoothly and severe ones deterministically; smoothing may not hide
  divergences indefinitely.
- **Remote entities** are interpolated from received states, never predicted like the
  local Hunter, without altering the logical position used for validation.

## Speed

Two voluntary modes: **walk** (default) and **manual run** (triggered by the player,
default `Shift`, remappable). Running stays active only while its input is valid,
is server-validated, respects states that forbid it, respects terrain/weight/
condition modifiers, and never ignores collision. Energy/stamina/fatigue are not
defined here.

Final speed is an explicit, deterministic, auditable chain of modifiers:

```text
final = base × mode × terrain × weight × equipment × condition × temporary
```

Terrain, weight, equipment, conditions and temporary effects expose consumable
modifiers rather than duplicating logic inside the Hunter. Temporary effects carry
source, magnitude, duration, stacking rule, priority/category and a stable id;
stacking is decided by the effect system, not the input. The server applies safety
limits (no invalid negative speed, no infinite multipliers, no non-numeric values,
no acceleration by command spam, no undue effect accumulation) and the chain must be
traceable. Balancing numbers are not defined here.

## Collision

Collision represents the physical limits of the scenario; it must not turn
characters into permanent obstacles to one another.

- **Blocks movement:** walls, rocks, trees, buildings, fixed obstacles, physical
  limits and elements explicitly configured as solid (controlled by world data).
- **Does not block movement:** any pair among Hunter / NPC / creature. Mobile
  entities may overlap in the simulation. **There is no body blocking** — no player
  can trap others or block a doorway with their body; passage never depends on
  update order.
- **Tactical positioning** still exists through range, cover, line of sight,
  obstacles, dangerous areas, control zones, terrain, travel time and area effects
  (defined by the combat block).
- **Shapes:** simple, stable logical forms (circles, capsules, aligned boxes,
  polygons only when necessary). Sprite shape does not define collision.
- **Resolution:** the Hunter cannot penetrate solids; tangential sliding along walls
  is allowed; resolution is deterministic and client/server rules are compatible; no
  lateral teleport, jitter, trapping by small overlaps, or persistent divergence.
- **Spawn/overlap correction** and **scenario updates** (doors, built/removed walls)
  are authorized and applied by the server, replicated, and must never leave
  entities permanently stuck.

## Interaction

Hybrid contextual interaction, so the player acts on the world without per-object
key combinations.

- **Sources:** click on an entity, a universal interaction key, a client-shown
  contextual command, a context menu, and (later) tool/ability actions kept
  explicitly separate from common interaction.
- **Selection vs execution:** clicking selects (NPC, creature, Hunter, object,
  resource, building, interactive point) and keeps a stable reference to the logical
  entity; selecting does not necessarily execute.
- **Single obvious target** may be actioned directly; **multiple valid targets**
  require an explicit choice (a context menu ordered by relevance) — the system never
  randomly performs an irreversible action.
- **Right click** opens contextual actions (talk, inspect, gather, open, use, trade,
  attack, follow, examine…) generated from entity type, state, permissions, distance,
  Hunter knowledge and server-available actions.
- **Universal key** prioritizes a relevant nearby target deterministically (selected
  → focused → nearest in cone/area → highest relevance → stable tie-break), avoiding
  chaotic switching between similar targets.
- **Range:** every interaction has a valid range; the client may anticipate but the
  server validates the official distance. Out-of-range interaction does not execute
  and does not auto-start movement (automatic approach is out of scope).
- **Separation:** common interaction is not the same as abilities, attacks, aiming or
  item-on-target; they may share selection/raycast but keep their own commands and
  validations.
- **Authoritative flow:** client picks action → identifies logical target → sends
  command → server validates existence/state/distance/permission/context → executes
  or rejects → result replicated → client updates feedback. The server resolves
  concurrency (exclusivity, consumption, locking, queueing).

## Perception

Presence does not grant understanding. Three distinct, individual layers that may
regress:

```text
Unaware → Visible → Detected → Identified
```

- **Visible** — within the raw visual field and not fully occluded (influenced by
  distance, walls, terrain, vegetation, interior/exterior, lighting, weather).
- **Detected** — perceived as a relevant presence (additionally influenced by the
  Perception attribute, skills, equipment, camouflage, movement, lighting, weather,
  vegetation, temporary effects). Identity may still be unknown.
- **Identified** — enough information revealed (category, species, name, affiliation,
  approximate level, state, hostility, rarity…). Which fields are revealed is not
  defined here.

Progression may pass through a partially-identified stage (representable as an
information level, not necessarily a rigid enum) and can regress when the target
leaves range, enters vegetation, loses light, activates camouflage or a perception
effect ends. **The server controls which entities and fields are valid to send** —
it may not replicate an undetectable entity, may send an anonymous representation,
or may withhold identity — so hidden data is not merely visually concealed. Client
occlusion effects (roof transparency, wall fade, outlines) must not reveal
information the server considers unavailable. **Perception is individual** and is not
shared automatically within a group. The system must scale to many entities
(spatial partitioning, interest sets, tick updates, caching) rather than testing all
pairs each frame.

## Controls

WASD moves, Shift runs (manual); the mouse selects, aims, attacks, interacts and
opens context menus; there is a universal interaction key and a consistent cancel
(`Esc` by default). Primary click may select/confirm/interact with an obvious
target; secondary click opens the context menu and never starts movement. Actions
are modelled **semantically** (MoveNorth, MoveSouth, MoveEast, MoveWest, Run,
Interact, PrimaryAction, SecondaryAction, ContextMenu, Cancel) so they are
remappable without changing gameplay logic. Interface focus consumes input safely
(typing never moves the Hunter; losing focus releases held keys). Clicking the
ground never starts click-to-move by default (it may later mark a position, aim an
area or place a construction target).

## Camera

The camera follows the Hunter automatically as a presentation director; the player
need not control it in normal flow.

- **Exploration:** follows the Hunter (always visible), applies look-ahead offset in
  the movement direction (moderate walking, larger running within a limit), returns
  smoothly on stop, transitions smoothly on direction change, and does not keep
  advancing into a wall. The Hunter never leaves the safe framing area.
- **Combat:** smooth zoom-in, reduced look-ahead, more centred Hunter, greater focus
  on the immediate area, no hard cut — to improve immersion and reading of
  animations/attacks.
- **Leaving combat:** the zoom and look-ahead return gradually to exploration, with
  hysteresis (exit delay / tolerance window / confirmed state) to avoid oscillation.
- **Combat state comes from the combat system** — the camera never infers combat
  rules. Zoom has at least exploration/combat values, transition duration,
  interpolation curve and min/max limits, and must not change range rules, server
  authority, replicated information or logical position. The architecture must allow
  new camera profiles (construction, interior, event, boss, mount, cinematic) without
  rewriting the base.

## Rejected models

Not part of the approved design: click-to-move as the primary system; tile-locked
movement; faster diagonals; client authority over position; body blocking between
mobile entities; automatically shared group perception; a fully fixed camera with no
anticipation; free manual camera control as default; combat with no framing change;
instant/abrupt zoom changes.

## Open items

Unresolved — must not become rules: definitive base/run speed, speed limits,
collision radius, interaction range, interest distance, detection thresholds,
exploration/combat zoom values, look-ahead intensity, interpolation speed, combat
exit delay, reconciliation tolerance, snapshot frequency; the terrain/weight/
equipment/condition catalogues and penalty curves; partial-identification
representation; occlusion art direction; and everything under [Scope](#scope) as not
covered. Camera and perception profiles must remain extensible without rewriting the
base.

## Architecture note (not yet decided)

This block is server-authoritative by design, but the repository has no realtime
client↔server transport yet. Choosing that transport (e.g. WebSocket) introduces a
new architectural boundary and requires a dedicated **ADR** before implementation.
Any implementation should keep movement logic and its command/snapshot contracts
transport-agnostic so authority is never assumed to be distributed before that
decision exists.

## Related documents

- [`Game Constitution`](../vision/game-constitution.md) and [`world-structure.md`](world-structure.md) (settlements, safety layers, regions).
- [`hunter-identity.md`](hunter-identity.md) (Perception attribute) and [`character-system.md`](character-system.md).
- [`world-dynamics.md`](world-dynamics.md) (regional/controlled-zone state that exploration reads).
- [ADR-0002](../decisions/ADR-0002-server-authoritative.md); a future ADR will cover the realtime transport.
