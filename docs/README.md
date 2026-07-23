# Hunter Order documentation

> Status: Approved
> Owner: Game Design Lead and Technical Lead
> Last reviewed: 2026-07-20

This repository is the authoritative memory of Hunter Order. It records what the project promises, what has been approved, why decisions were made and which questions remain open.

## Reading order

1. [`vision/game-constitution.md`](vision/game-constitution.md) - product identity and non-negotiable design philosophy.
2. [`vision/game-pillars.md`](vision/game-pillars.md) - concise implementation filters.
3. The relevant approved specification in [`game-design/`](game-design/).
4. [`technical/architecture.md`](technical/architecture.md) and related technical guidance.
5. Applicable records in [`decisions/`](decisions/).
6. Agent policies in [`agent/`](agent/).

## Document classes

| Location | Purpose | Authority |
| --- | --- | --- |
| `docs/vision/` | Stable player promise and project philosophy | Highest product authority |
| `docs/game-design/` | Approved gameplay behavior and explicit proposals | Authoritative only where marked approved |
| `docs/technical/` | Architecture, implementation and operational guidance | Authoritative for engineering |
| `docs/decisions/` | Context, choice and consequences for `GD-XXXX` and `ADR-XXXX` | Authoritative decision history |
| `docs/agent/` | Operating rules for autonomous development | Mandatory for agents |
| `docs/migrations/` | Source mapping and historical migration notes | Audit trail, not gameplay authority |

## Current game-design documents

- [`game-design/hunter-identity.md`](game-design/hunter-identity.md)
- [`game-design/character-system.md`](game-design/character-system.md)
- [`game-design/world-structure.md`](game-design/world-structure.md)
- [`game-design/world-dynamics.md`](game-design/world-dynamics.md)
- [`game-design/progression-risk-and-loot.md`](game-design/progression-risk-and-loot.md)
- [`game-design/clans-and-conflict.md`](game-design/clans-and-conflict.md)
- [`game-design/visual-direction.md`](game-design/visual-direction.md)

## Technical specifications

- [`technical/asset-specification.md`](technical/asset-specification.md) — sprite/canvas/pivot/naming/metadata/layers (see also [`technical/art-pipeline.md`](technical/art-pipeline.md)).

## Status rules

Each product document must state one of these statuses:

- **Approved** - may be implemented within its stated boundaries.
- **Mixed** - approved principles and unresolved mechanics are separated explicitly.
- **Proposal** - discussion material only; agents must not implement it as a rule.
- **Superseded** - retained only for historical context.

Absence of a status does not imply approval.

## Change workflow

Follow [`governance/documentation-workflow.md`](governance/documentation-workflow.md). Product behavior, economy, progression and lore changes require human approval and an appropriate `GD-XXXX` record when the decision is material.
