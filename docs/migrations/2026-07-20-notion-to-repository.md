# Notion-to-repository migration - 2026-07-20

> Status: Completed source analysis; repository migration prepared
> Owner: Game Design Lead
> Migration date: 2026-07-20

## Source database

`Ideias e Conceitos | Hunter Order`

https://app.notion.com/p/3a0c70d2fdbd80aeaf48d3501ddc03f1

## Migration approach

The source was not copied page-for-page. Content was normalized, deduplicated, separated by authority and filtered against the latest explicit product decisions.

## Source mapping

| Notion source | Source status | Repository destination | Treatment |
| --- | --- | --- | --- |
| `Identidade do Mundo e dos Hunters` | Committed | `vision/game-constitution.md`, `game-design/hunter-identity.md`, `game-design/clans-and-conflict.md` | Split by subject; approved principles retained; formal conflict sequence retained as proposal |
| `Visao inicial da Lore` | Under discussion | `vision/game-constitution.md`, `game-design/world-dynamics.md` | Stable ideas merged; contradictions and placeholders moved to open questions |
| `Estrutura central de documentacao do projeto` | Committed | `governance/documentation-workflow.md`, `docs/README.md` | Goal retained; Notion source-of-truth rule superseded by Git repository authority |
| `Pipeline de criacao de sprites` | Committed | `technical/art-pipeline.md` | Promoted to an approved technical direction and expanded with responsibilities and quality gates |
| Product-design discussion on 2026-07-20 | Explicitly approved | `vision/game-constitution.md`, `game-design/progression-risk-and-loot.md`, `decisions/GD-0001-game-constitution.md` | Added decisions not yet recorded in Notion |

## Filtered conflicts

### Multiple characters versus one Hunter per person

The Notion identity page allowed a new character for a different permanent specialization. The latest decision states one CPF equals one Hunter for the Brazil launch.

Result: the latest one-person-one-Hunter rule is authoritative. Alternate characters and respec require future decisions.

### Extinction versus accelerated regeneration

The initial lore draft allowed species extinction while the committed identity page stated that world evolution prevents Hunters from permanently exhausting prey.

Result: local depletion, migration and replacement are approved. Permanent global extinction remains open.

### Approved principles versus proposed mechanics

The Notion identity page included a detailed duel, delay and invasion sequence.

Result: social competition, transport risk and clan dependency are retained as approved principles. The exact formal-conflict sequence remains a proposal.

### Notion as source of truth

The old documentation-structure page designated Notion as the central authority.

Result: the objective of one operational memory is preserved, but the repository now owns that role.

## New repository structure

```text
docs/
  README.md
  vision/
    game-constitution.md
    game-pillars.md
  game-design/
    hunter-identity.md
    world-dynamics.md
    progression-risk-and-loot.md
    clans-and-conflict.md
  governance/
    documentation-workflow.md
  decisions/
    GD-0001-game-constitution.md
  technical/
    art-pipeline.md
  migrations/
    2026-07-20-notion-to-repository.md
```

## Remaining open work

- define the specialization catalogue and progression model;
- define world simulation and controlled-zone algorithms;
- define defeat probabilities and complete item-loss rules;
- decide formal clan conflict and PvP boundaries;
- define the world-origin event;
- standardize asset paths, metadata and PixelLab integration.
