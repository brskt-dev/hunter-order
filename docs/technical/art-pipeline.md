# Pixel-art asset pipeline

> Status: Approved direction
> Owner: Art Direction and Technical Lead
> Last reviewed: 2026-07-23

## Objective

Create a reproducible and scalable sprite-production workflow that preserves visual consistency while reducing manual repetition.

This pipeline produces assets to the standards defined in
[`../game-design/visual-direction.md`](../game-design/visual-direction.md)
(art direction) and [`asset-specification.md`](asset-specification.md) (sizes,
pivots, anchors, directions, naming, metadata, layers, statuses).

The official direction is:

> ChatGPT -> Claude Code and PixelLab -> Aseprite

## Stage 1 - asset definition with ChatGPT

ChatGPT supports the Game Design Lead and art direction by producing a structured asset brief.

The brief should describe, when applicable:

- narrative purpose and world context;
- asset category and identity;
- visual silhouette;
- palette constraints;
- scale and camera perspective;
- facing directions;
- animation states;
- equipment or variation requirements;
- rarity and gameplay metadata;
- prohibited visual traits;
- references to approved lore and game-design documents.

This stage defines intent. It does not approve new lore or gameplay by itself.

## Stage 2 - orchestration with Claude Code and PixelLab

Claude Code orchestrates the repeatable technical flow and integrates with PixelLab.

Expected responsibilities include:

- validating that an asset brief is complete;
- submitting generation requests;
- producing variations and sprite sheets;
- preserving prompts and generation metadata;
- organizing names and versions;
- detecting missing frames or inconsistent dimensions;
- preparing generated output for human review;
- integrating automation under `tools/asset-pipeline/` when implementation begins.

PixelLab is the generation engine for sprites, variations and sprite sheets. It does not own game-design decisions.

## Stage 3 - manual finish in Aseprite

Aseprite is the final human editing and validation surface.

Typical work includes:

- pixel-level cleanup;
- silhouette corrections;
- animation timing;
- frame alignment;
- pivot and anchor correction;
- palette correction;
- removal of generation artifacts;
- final export.

Manual intervention is expected when it materially improves quality or consistency.

## Quality gates

An asset is not final until it passes applicable checks:

- matches the approved brief;
- respects the project perspective and scale;
- uses an approved or compatible palette;
- has complete required directions and states;
- has stable frame dimensions and alignment;
- contains no accidental background pixels or edge artifacts;
- has reviewed pivots and hitbox-relevant bounds;
- includes source, generated and final metadata sufficient for reproduction;
- has an explicit human approval.

## Principles

- Visual consistency is more important than maximizing generated volume.
- Automation should remove repetition, not human judgment.
- Manual editing is used where it increases final quality.
- The process must scale across creatures, characters, items, equipment, structures and environment assets.
- Generated assets are drafts until reviewed.
- Lore and gameplay metadata must reference repository documentation.

## Open implementation decisions

Asset directory layout, file naming, metadata schema, sprite dimensions, direction
counts, animation frame budgets, asset statuses and provenance are now specified in
[`asset-specification.md`](asset-specification.md) (adopted by
[`GD-0005`](../decisions/GD-0005-visual-direction-and-asset-foundation.md)). The
following remain not yet standardized:

- palette hex registry;
- PixelLab API integration;
- atlas-generation tool and runtime loading;
- review and approval tooling;
- licensing records.
