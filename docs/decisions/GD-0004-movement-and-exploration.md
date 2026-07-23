# GD-0004 - Adopt the movement and exploration model

> Status: Accepted
> Date: 2026-07-23
> Decision owner: Game Design Lead

## Context

The constitution and the world-structure decisions establish a living,
server-authoritative world but do not define how the Hunter moves, perceives,
interacts or is followed by the camera — the base playable layer. An approved
functional and technical specification for this block was provided to be integrated
as canonical documentation.

## Decision

Adopt [`docs/game-design/movement-and-exploration.md`](../game-design/movement-and-exploration.md)
as authoritative for this block. Decisions that remain explicit:

- oblique presentation decoupled from an orthogonal spatial model;
- continuous, direct WASD movement, not tile-locked;
- eight-direction visual facing;
- server-authoritative position/speed/collision, with client prediction and
  reconciliation and interpolation of remote entities;
- manual run; final speed composed from an auditable modifier chain;
- collision with solid scenario only — no body blocking between mobile entities;
- contextual interaction validated by the server, with no automatic approach;
- perception in three individual, regressable levels (Visible/Detected/Identified)
  with server-side information filtering;
- WASD + mouse controls via remappable semantic actions; no click-to-move;
- camera with exploration look-ahead and smooth combat zoom-in driven by an external
  combat state.

The models listed under "Rejected models" in the specification are not approved.

## Consequences

- New movement, perception, interaction and camera work must be evaluated against
  this specification and the constitution.
- Balancing values and out-of-scope systems remain unresolved and must not be
  invented (see the specification's open items).
- Implementation is future work and is not part of this decision.

## Pending decision — realtime transport (ADR required)

The block is server-authoritative by design, but choosing a realtime client↔server
transport (e.g. WebSocket) introduces a new architectural boundary. Per the autonomy
policy this is a human/architectural decision requiring a dedicated **ADR** before
implementation. Any future implementation should keep movement logic and its
command/snapshot contracts transport-agnostic until that ADR exists.

## Relationship to existing decisions

Consistent with ADR-0002 (server-authoritative) and the constitution (skills and
exploration core, meaningful risk). Uses the settlements and safety layers from
`world-structure.md` and the Perception attribute from `hunter-identity.md`. No
material conflict was found.

## Source material

- Approved movement-and-exploration decision package, consolidated 2026-07-23.
- Repository is the only source of truth.
