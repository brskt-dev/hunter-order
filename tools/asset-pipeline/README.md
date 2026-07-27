# Asset pipeline

Repeatable sprite-production flow for Hunter Order. Implements the approved
direction in [`../../docs/technical/art-pipeline.md`](../../docs/technical/art-pipeline.md)
and produces to the standards in
[`../../docs/technical/asset-specification.md`](../../docs/technical/asset-specification.md)
and the concrete briefs/palette in
[`../../docs/art-direction/`](../../docs/art-direction/).

> Official direction: **ChatGPT (brief) → Claude Code + PixelLab (generate) → Aseprite (finish)**.

## Status

Manual, agent-driven flow (documented below). No automation scripts yet — they are
a deferred open item (see [Deferred](#deferred)); do not add them until the manual
flow has been proven across a few asset families (YAGNI).

## The flow (as implemented)

1. **Brief.** Author/confirm a brief in `docs/art-direction/briefs/<asset>.md` (identity,
   silhouette, palette constraints, size/canvas, directions, animation, prohibited
   traits, the exact PixelLab call). No definitive assets without this — the gate.
2. **Budget check.** Call `mcp__pixellab__get_balance`. The account is a **trial**
   (limited generations, $0 credits) — stay frugal; if a step needs more than the
   remaining budget, stop and report.
3. **Generate.** Submit the PixelLab job from the brief:
   - static object → `mcp__pixellab__create_map_object`
   - directional character/creature → `mcp__pixellab__create_character`
     (quadrupeds need a `template`: bear/cat/dog/horse/lion)
   - animation → `mcp__pixellab__animate_character`
   Generations are async (~15s–5min) and return an ID immediately.
4. **Poll.** `mcp__pixellab__get_character` / `get_map_object` until `completed`
   (or `failed` → retry once, else report).
5. **Download immediately.** **Map objects auto-delete after 8h** — save the image
   the moment it completes.
6. **Save loose frames** under `apps/game-client/src/assets/source/<family>/…`
   using the approved naming (e.g. `creatures/ruin-hound/body/idle/sw/000.png`,
   `items/fragments/ancient-fragment/000.png`). Map PixelLab cardinal direction
   names (`south`, `south-west`, …) to our `Direction8` keys (`s`, `sw`, …).
7. **Metadata + provenance.** Write one `metadata.json` per asset family (template
   below) with `source` provenance and `approval.state: "review"`.
8. **Review.** Present the sprite to the human **in context** against the quality
   gates. Note what PixelLab honored vs. what needs Aseprite. Never mark
   `approved` without human sign-off.

## `metadata.json` template

```json
{
  "id": "creatures.ruin-hound.body",
  "category": "creature",
  "status": "review",
  "canvas": { "width": 64, "height": 80 },
  "pivot": { "x": 32, "y": 70 },
  "directions": ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
  "animations": { "idle": { "frames": 6 } },
  "source": {
    "tool": "pixellab",
    "promptRef": "docs/art-direction/briefs/ruin-hound.md",
    "generatedAt": null,
    "editedWith": null
  },
  "approval": { "state": "review", "reviewedBy": null, "reviewedAt": null }
}
```

## Notes / gotchas

- PixelLab `standard` mode treats `outline`/`shading`/`detail`/`proportions` as
  **soft guidance** — palette/outline drift is corrected in Aseprite (Stage 3).
- `create_character` `standard` = 1 generation for a full 4/8-direction rotation.
- Rendered shadows only — assets carry **no baked ground shadow** unless approved.

## Deferred (open items)

Aseprite finish step (Stage 3); runtime spritesheet/atlas generation and its build
tool; review/approval tooling; licensing records; and any automation scripts under
this directory. Tracked in `asset-specification.md` / `art-pipeline.md` open items.
