# GD-0002 - Adopt the persistent world structure

> Status: Accepted
> Date: 2026-07-21
> Decision owner: Game Design Lead

## Context

The [game constitution](../vision/game-constitution.md) (GD-0001) established that
players exist inside an independent, living world that accumulates a distinct
history per server. It did not yet fix the structural decisions for how that world
is organized: server topology, persistence, geography, regions, cities, safety and
dungeons.

A consolidated, approved world-structure decision package was provided to be
integrated as canonical documentation. The repository is the sole source of truth.

## Decision

Adopt [`docs/game-design/world-structure.md`](../game-design/world-structure.md)
as the authoritative specification for world structure. The approved decisions
are:

- **Multiple independent servers**, each with one persistent world and a single
  canonical state; no channels, layers, shards or duplicated regions in the open
  world.
- **Permanent Hunter–server binding**: no transfers, migration, conversion or
  portability; consistent with one verified identity per Hunter (one CPF per
  Hunter at the Brazilian launch).
- **Persistent worlds with internal renewal**: no scheduled wipes or seasonal
  resets as a renewal mechanism. History remains; domination does not. Persistence
  is layered into a permanent historical layer, a mutable persistent layer and a
  transitory opportunity layer.
- **Authored fixed macrostructure with procedural, mutable interiors and
  sub-regions**; external guides stay useful at the macro level only.
- **Regions as living systemic units** with their own state (behavioral rules in
  `world-dynamics.md`).
- **Systemic regional boundaries discovered through exploration and cartography**,
  communicated as readable signals rather than raw simulation values; information
  can decay.
- **Central cities are permanent and invulnerable** anchors of civilization.
- **Layered city safety**: safe urban core, vulnerable urban periphery, dynamic
  controlled regions, and wild regions.
- **Group-instanced dungeons** governed by a dual limitation model: a per-Hunter
  reward limit and a shared server-level global depletion; no infinite dungeon
  farming.

The models listed under "Rejected models" in the specification are explicitly not
approved.

## Consequences

- New world, region, city and dungeon mechanics must be evaluated against this
  structure and the constitution.
- Balance is expected to be maintained through systemic renewal, not wipes.
- Server identity becomes a first-class, non-portable part of player history.
- Detailed balance, formulas and interfaces remain separate, unresolved work
  (see the specification's open questions).
- Agents may not promote any open question into an approved rule without a new
  human decision.

## Relationship to existing decisions

- Consistent with GD-0001 and the constitution (independent living world,
  persistent per-server history, one-person-one-Hunter).
- Consistent with [`world-dynamics.md`](../game-design/world-dynamics.md)
  (controlled zones are dynamic and reversible; regions react to pressure) and
  [`progression-risk-and-loot.md`](../game-design/progression-risk-and-loot.md)
  (dungeons are not infinitely repeatable).
- **No material conflict** was found with existing canonical documents during
  integration.

## Source material

- Approved world-structure decision package, consolidated 2026-07-21.
- Repository is the only source of truth; no external source is authoritative.
