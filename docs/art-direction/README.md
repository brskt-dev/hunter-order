# Art direction

> Status: Draft — palette proposed for Game Design Lead approval
> Owner: Game Design Lead
> Last reviewed: 2026-07-24

Concrete, production-facing translation of Hunter Order's **approved** visual
direction into the specifications and briefs the art pipeline actually consumes
(PixelLab parameters, palette hexes, per-asset briefs). It does not create new
visual identity — it operationalizes what is already approved in:

- [`../game-design/visual-direction.md`](../game-design/visual-direction.md) — Approved art direction.
- [`../technical/asset-specification.md`](../technical/asset-specification.md) — Approved sizes/pivots/layers/naming/metadata.
- [`../technical/art-pipeline.md`](../technical/art-pipeline.md) — Approved production workflow.
- [`../decisions/GD-0005-visual-direction-and-asset-foundation.md`](../decisions/GD-0005-visual-direction-and-asset-foundation.md) — Decision record.

## The gate

**No definitive assets are generated without a brief in this folder.** Every
generated asset stays `draft` / `review` until a human approves it **in context**
(per the asset-spec and pipeline quality gates). Generation tools (PixelLab) never
own art-direction or gameplay decisions.

## Contents

- [`style-guide.md`](style-guide.md) — palette registry (proposed), PixelLab
  parameter mapping, view/perspective, and the "soft-guidance → Aseprite" rule.
- [`briefs/ancient-fragment.md`](briefs/ancient-fragment.md) — item-drop pilot brief.
- [`briefs/ruin-hound.md`](briefs/ruin-hound.md) — medium-creature pilot brief.
- [`briefs/hunter.md`](briefs/hunter.md) — player-character brief (exploratory
  8-direction rotation pass, two builds from human concept references: lean and
  stocky). **Which build becomes the benchmark Hunter is an open GD call.**
- [`explorations/`](explorations/) — `draft` generations kept **outside** `apps/`:
  not wired to the client, for art-direction review only.

Briefs for the hand axe, grass/dirt tiles, overlays and the split tree/ruin object
are added in later passes (not yet written).
