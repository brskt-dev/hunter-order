# GD-0003 - Adopt the character and lineage system

> Status: Accepted
> Date: 2026-07-22
> Decision owner: Game Design Lead

## Context

The constitution (GD-0001) and [`hunter-identity.md`](../game-design/hunter-identity.md)
established that every player is a Hunter defined by pursuit, capability, knowledge
and legacy, with one verified person per Hunter account, and left the character
mechanics (attributes, skill flow, defeat model, alternate characters) as future
decisions.

An approved character-system decision package was provided to define those
mechanics. It also resolves the previously open defeat/recovery framing.

## Decision

Adopt [`docs/game-design/character-system.md`](../game-design/character-system.md)
as the authoritative specification for the character system. Key approved
decisions:

- **Temporary Hunter, permanent lineage.** Attributes are potential; skills are
  competence.
- **One active Hunter per identity**, with sequential historical Hunters through
  succession; no parallel characters, no reactivation.
- **Creation** defines appearance, name and initial attributes; the Primary Skill
  is chosen only after an initiation/experimentation period.
- **Names** are unique per server and permanently reserved after a trajectory ends.
- **Five attributes** (Power, Constitution, Coordination, Perception, Focus), with
  a free initial distribution, no respec, milestone-based universal points,
  increasing cost, and a finite total (no fixed hard cap).
- **Skills** in three categories: one permanent Primary, one permanent Secondary
  (same list, unlocked later, any combination), and unlimited Tertiary Skills that
  are not inherited.
- **Two progression paths**: Single Hunter (higher primary ceiling, no lineage) and
  Lineage Hunter (breadth via accumulated amulet legacies, lower primary ceiling).
- **Succession** is voluntary, definitive and irreversible, gated by Primary Skill
  advancement, a fixed cost and no outstanding debt.
- **Amulet of the Hunter's Soul** per succession: a fixed mechanical buff per
  Primary Skill (only the first amulet of a given Primary Skill activates its
  buff; duplicates remain historical) plus a losable physical object; losing the
  object never removes the legacy.
- **Public lineage**; personal reputation separate from lineage reputation.
- **Defeat is incapacitation, not death.** A Merchant always rescues the Hunter,
  recovers 1-5 items by rarity, and charges a fee that becomes an auto-repaid debt
  if unpaid; remaining items follow a reserved -> public -> despawn cycle; the
  Hunter respawns fully recovered at the nearest functional settlement; succession
  is blocked while debt exists.

## Consequences

- Superseded framing is updated in existing documents (see below).
- Numeric balancing (skill lists, costs, ceilings, formulas, phase durations,
  rescue price, debt percentages, amulet buffs) remains unresolved and must not be
  invented.
- Character, defeat, economy and reputation mechanics must be evaluated against
  this specification and the constitution.

## Superseded and reconciled statements

- `hunter-identity.md` — "one person, one Hunter" is refined: one *active* Hunter
  per identity, with succession providing sequential (not parallel) characters.
  "Alternate characters ... require future decisions" is resolved by the succession
  system (respec and international verification remain open).
- `progression-risk-and-loot.md` — the "random merchant recovery event that may
  occur" is replaced by the standard incapacitation-and-rescue model.
- `vision/game-constitution.md` — the "Meaningful defeat" paragraph is reframed to
  the incapacitation model and delegates the detail to this specification, keeping
  the constitution free of implementation specifics.

## Relationship to existing decisions

Consistent with GD-0001 (identity, persistent history), GD-0002 (settlements and
safety used by respawn) and the constitution's meaningful-defeat and
skills-over-loot principles. No unresolved conflict remained after reconciliation.

## Source material

- Approved character-system decision package, consolidated 2026-07-22.
- Repository is the only source of truth; no external source is authoritative.
