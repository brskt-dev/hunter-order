# GD-0004 - Adopt the movement and exploration model

> Status: Accepted
> Date: 2026-07-23
> Decision owner: Game Design Lead

## Context

The constitution and world-structure decisions establish a living, server-
authoritative world but do not define how the Hunter moves, perceives, interacts
or is followed by the camera — the base playable layer. An approved functional and
technical specification for this block was provided to be integrated and
implemented.

## Decision

Adopt [`docs/game-design/movement-and-exploration.md`](../game-design/movement-and-exploration.md)
as authoritative for this block. Decisions that must remain explicit:

- oblique presentation decoupled from an orthogonal spatial model;
- continuous, direct WASD movement, not tile-locked;
- eight-direction visual facing;
- server-authoritative position/speed/collision, with client prediction and
  reconciliation and interpolation of remote entities;
- manual run; final speed composed from an auditable modifier chain;
- collision with solid scenario only — no body blocking between mobile entities;
- contextual interaction with server validation and no automatic approach;
- perception in three individual, regressable levels (Visible/Detected/Identified)
  with server-side information filtering;
- WASD + mouse controls via remappable semantic actions; no click-to-move;
- camera with exploration look-ahead and smooth combat zoom-in driven by an
  external combat state.

The models listed under "Rejected models" in the specification are not approved.

## Consequences

- The first gameplay slice may be implemented against this specification.
- Delivered in phases. Phase 1 (this decision) implements the **server-authoritative
  movement domain** as pure, transport-agnostic, unit-tested code
  (`server/src/Modules/Movement` + `SharedKernel/Spatial`): coordinates,
  eight-direction facing, continuous movement with diagonal normalization, manual
  run, the speed-modifier chain, scenario collision (sliding, anti-tunneling, no
  entity blocking), perception levels, contextual interaction selection, and the
  movement command/snapshot contracts.
- Balancing values and out-of-scope systems remain unresolved and must not be
  invented.

## Pending decision — realtime transport (ADR required)

Wiring the client and server over a realtime transport (e.g. WebSocket) introduces
a new architectural boundary. Per the autonomy policy this is a human/architectural
decision and requires a dedicated **ADR** before implementation. Until then the
movement domain and its contracts are deliberately transport-agnostic and run
in-process; authority is never faked as distributed.

## Relationship to existing decisions

Consistent with ADR-0002 (server-authoritative) and the constitution (skills/
exploration core, meaningful risk). Uses the settlements and safety layers from
`world-structure.md`. No material conflict was found.

## Source material

- Approved movement-and-exploration decision package, consolidated 2026-07-23.
- Repository is the only source of truth.
