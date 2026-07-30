# GD-0006 - Circumstantial entity collision gated by combat state (push-apart)

> Status: Accepted
> Date: 2026-07-30
> Decision owner: Game Design Lead

## Context

[GD-0004](GD-0004-movement-and-exploration.md) adopted, as an approved rule, that
there is **no body blocking between mobile entities** — any pair among Hunter / NPC /
creature may overlap freely in the simulation. The rationale was readability over
physical realism and, critically, avoiding classic MMO problems: players trapping each
other or blocking doorways with their bodies, movement depending on update order, and
the server cost of resolving overlaps between many entities every tick.

In the first-playable-loop benchmark this rule produces a concrete combat problem: the
ruin hound steers toward the Hunter's exact centre and stacks on top of it, so the
hand-axe swing frequently whiffs (the attack cone points away from a target sitting on
or behind the Hunter's centre). Playtesting made it clear that *some* separation is
needed for combat to feel right.

The Game Design Lead decided to introduce collision between entities, but deliberately
scoped so it does **not** reintroduce the problems GD-0004 guarded against.

## Decision

Entity-vs-entity collision is **circumstantial** and **soft**:

- **Gated by combat state, not by region.** Collision is OFF by default and ON only
  while the entities are *in combat*. This keeps the entire non-combat world
  (exploration, cities, passages, peaceful PvE) exactly as GD-0004 intended — bodies
  overlap freely, nobody can trap anyone or block a doorway.
- **Soft push-apart, never a rigid wall.** When active, overlapping bodies separate
  gradually (a symmetric push apart) rather than acting as hard obstacles. No entity can
  hard-trap another; passage is never fully blocked; the resolution is symmetric so it
  does not depend on update order. This preserves GD-0004's anti-griefing and
  determinism goals even while collision is active.
- **Which pairs, and when "in combat" applies:**
  - **Hunter ↔ creature:** collision is active for the duration of the encounter
    (engaging a creature is combat).
  - **Hunter ↔ Hunter:** collision is active **only** when the two are in mutual combat
    (e.g. one has attacked the other); outside that, they pass through each other.
  - Any pair not in combat: no collision (GD-0004's original behaviour).
- **Server-authoritative (ADR-0002).** The server owns combat state and resolves the
  push-apart; the client predicts and smooths but never decides the definitive position.

This **amends** GD-0004's bullet "collision with solid scenario only — no body blocking
between mobile entities": body separation now exists, but only as soft push-apart
between entities that are in combat.

## Benchmark application (this slice)

The benchmark contains only the ruin hound and the Hunter, so "in combat" maps to the
existing engaged encounter (the hound chasing / in contact). The benchmark will:

- apply a **soft push-apart between the hound and the Hunter while the encounter is
  engaged**, so the hound holds at biting distance instead of stacking on the Hunter's
  centre (out of combat — patrol/return/flee — no separation is applied);
- make the point-blank **attack more tolerant**, so a hound right on top of / adjacent to
  the Hunter still registers a hit regardless of facing.

This is benchmark-only and non-authoritative. It does **not** define the final combat /
damage / defeat model (decision **D01**, still open) — it only adds spacing + hit
tolerance to the existing repel stub.

## Consequences

- [`docs/game-design/movement-and-exploration.md`](../game-design/movement-and-exploration.md)
  is updated: the "no body blocking" principle and the Collision section are qualified by
  this combat-state exception, referencing GD-0006.
- Creature AI and attack resolution in the benchmark may now change **logical** position
  via separation (the client-only benchmark simulation) — this is intended gameplay under
  this decision, no longer a GD-0004 violation.
- The broader multiplayer combat-state machine for players (exact enter/exit conditions,
  combat timeout, whether NPCs participate, knockback interaction, server reconciliation
  of separation) is **future work** and must not be invented here beyond the principle.

## Open items (must not be invented as rules)

- Push-apart strength / curve and the minimum separation distance.
- The precise definition of "in combat" for Hunter↔Hunter (what starts it, what ends it,
  timeout) — the benchmark only needs the Hunter↔creature engaged case.
- Whether non-creature NPCs participate in combat collision.
- Interaction between push-apart and any future knockback / combat-model (D01).

## Relationship to existing decisions

- **Amends GD-0004** (movement and exploration) — specifically the no-body-blocking rule.
- Consistent with **ADR-0002** (server-authoritative): the server owns combat state and
  the separation resolution.
- Consistent with the constitution's readability / anti-griefing intent, because
  collision remains OFF across the entire non-combat world and is soft where active.

## Source material

- In-conversation decision by the Game Design Lead, 2026-07-30.
- Repository is the only source of truth.
