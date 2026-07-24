# Design — Stage 2 art-pipeline pilot (visual benchmark, first pass)

> Status: Draft for review
> Date: 2026-07-24
> Owner (implementation): coding agent · Approver: Game Design Lead
> Related: `docs/game-design/visual-direction.md` (Approved),
> `docs/technical/asset-specification.md` (Approved),
> `docs/technical/art-pipeline.md` (Approved direction),
> `docs/decisions/GD-0005-...` (Accepted),
> `docs/game-design/first-playable-loop-benchmark.md` (Draft, Stage 2).

## Goal

Stand up and **validate the art-creation pipeline** (ChatGPT brief → Claude Code +
PixelLab → Aseprite) by taking real art for a small slice of the current greybox
through the whole chain and into the running client. Success is a **repeatable,
documented pipeline proven end-to-end**, not a complete art set. The visual
identity is already approved; this pass *translates* it and *exercises* the tooling.

Secondary outcome: capture concrete pipeline findings (what PixelLab honors vs.
what needs Aseprite, best `view`, size→canvas behavior, cost per asset) to inform
the next, larger pass and the paid-plan decision.

## Constraints (discovered)

- **PixelLab is on a trial: ~20 generations remaining, $0.00 credits**, no linked
  project. Every generation counts → the pilot must be frugal.
- PixelLab generation model (from the MCP tool schemas):
  - `create_character` **standard = 1 generation** for a full 4/8-direction
    rotation (~2–5 min, async). Quadrupeds require a `template`
    (`bear|cat|dog|horse|lion`); **`dog`** fits the "thin wolf/dog-like" ruin hound.
  - Style params (`outline`, `shading`, `detail`, `proportions`) are **soft
    guidance** in standard mode — the dark-naturalist palette/outline are *hints*,
    not guarantees. Enforcing them is Aseprite's job (Stage 3).
  - `view`: `low top-down` (~20°, classic 3/4 RPG) is the safe default; `oblique`
    is BETA (4-dir, ≤128px, standard-only) and worth *evaluating* against our 2D
    oblique look, not committing to.
  - `size` default 48px → canvas ~40% larger (~68px).
  - `animate_character` template idle = 1 gen/direction; v3 custom ≈ 1 gen/direction
    for sprites ≤96px (south-only = 1 gen).
  - `create_map_object` builds a transparent-background static object (~15–30s);
    **map objects auto-delete after 8h → download immediately.**
- **Gate (CLAUDE.md):** no *definitive* assets without a style spec registered in
  `docs/art-direction/`. Pilot assets are generated as `draft`/`review` only.
- **Dependency:** the client integration touches `scenes/benchmark-scene.ts`, which
  PR #15 (Phase 7 combat) also modifies. #15 must be merged into `dev` and synced
  into this branch **before** the integration step. The design doc and the
  `docs/art-direction/` spec are code-independent and can land first.

## Scope

**In scope (this pass):**
- The `docs/art-direction/` style spec (the gate) — derived from the approved docs.
- Minimal, documented pipeline mechanics (asset source layout, `metadata.json` +
  provenance, prompt briefs, a `tools/asset-pipeline/README.md`).
- Generate **two** pilot assets covering both pipeline branches:
  1. **Ancient fragment** — static single sprite (`create_map_object`), item-drop layer.
  2. **Ruin hound** — directional entity (`create_character` quadruped, `dog`,
     8-dir) used as a static idle, plus **one** cheap idle animation (v3, south) to
     exercise the animation branch.
- Integrate both into the client at `review` status, with **fallback to the
  existing greybox primitives** so the loop stays fully playable.
- Verification + a short pipeline retro.

**Explicitly out of scope (deferred):**
- Hunter, hand axe, grass/dirt tiles, overlays, split tree/ruin object as real art
  (next pass; Hunter likely wants a paid plan for full 8-dir idle+walk).
- Aseprite manual polish (documented as Stage 3; not performed this pass).
- Runtime atlas generation tool and `tools/asset-pipeline/` automation scripts
  (open items — deferred until the manual flow is proven; YAGNI).
- Any change to gameplay logic, palette *rules*, or the combat/damage model.

## Approaches considered

- **A. Docs-first, thin vertical pilot (chosen).** Spec + minimal scaffolding, then
  validate the whole chain on 2 assets integrated with greybox fallback. Respects
  the gate, yields a repeatable+documented pipeline, defers automation/atlas.
- **B. Automation-first.** Build `tools/asset-pipeline/` scripts before generating.
  Rejected now: heavy and premature against a trial budget and many unknowns (YAGNI).
- **C. Art-first, skip the spec.** Fast, but violates the CLAUDE.md gate and the
  "no art decisions on behalf of the GD Lead" rule; unrepeatable. Rejected.

## Design

### 1. Art-direction spec — `docs/art-direction/`

The gate artifact. Derives from the approved docs; invents no new identity.

- `README.md` — index; the "definitive assets require this spec" gate; status.
- `style-guide.md` — the concrete, PixelLab-facing translation:
  - **Palette hex registry** (proposed for GD approval at spec-review): a compact
    dark-naturalist core (grounds, stone, moss, aged wood, rust/iron, leather,
    soil) + the reserved subtle rarity accent (fragment) + danger — seeded from the
    approved palette direction and the current `benchmark.ts` greybox placeholders.
    Organized per the approved `global + materials/biomes/states` scheme; exact
    registry stays "first benchmark" scope, not a final bible.
  - **PixelLab mapping:** approved direction → tool params (outline → `single color
    outline`; detail → `medium`; view → `low top-down` default with an `oblique`
    evaluation note; size/canvas per size-class) and the "standard mode = soft
    guidance, palette/outline enforced in Aseprite" caveat.
- `briefs/ancient-fragment.md`, `briefs/ruin-hound.md` — per-asset generation
  briefs (Stage-1 content: identity/world context, silhouette, palette constraints,
  size/canvas, directions, animation states, prohibited traits, the exact PixelLab
  tool + params, references to the approved docs). Named stubs listed for
  Hunter/axe/tiles/overlays/object for later passes.

### 2. Pipeline mechanics

- **Source layout:** loose frames under `apps/game-client/src/assets/source/<family>/…`
  following the approved naming (`creatures/ruin-hound/body/…`,
  `items/fragments/ancient-fragment/…`), each with a `metadata.json` (canvas, pivot,
  directions, animations, `source` provenance: `tool: pixellab`, `promptRef`,
  `generatedAt`, `editedWith`) and `approval.state`.
- **Status flow:** generate → **review** (integrated at `review`); Aseprite Stage-3
  polish documented as the finish step, not performed this pass; `approved` requires
  human in-context review (deferred).
- **`tools/asset-pipeline/README.md`:** documents the implemented flow (author brief
  → submit PixelLab job → poll `get_*` → download promptly → save loose frames +
  metadata + prompt → mark `review`), the trial-budget note, and the
  deferred-automation stance. No scripts yet.

### 3. PixelLab generation plan (frugal, concrete)

- **Fragment:** `create_map_object`, ~32px, transparent, "small ancient
  stone/metal fragment, moss/dirt-covered, subtle accent, no glow". ~1 generation.
  Download the sprite within 8h; save + metadata.
- **Ruin hound:** `create_character` `body_type=quadruped`, `template=dog`,
  `n_directions=8`, standard, `view=low top-down`, size tuned to the medium
  size-class; description from the brief. **1 generation** for the 8-dir rotation
  (used as static idle). Then `animate_character` v3, `directions=['south']`, a
  gentle idle `action_description` — **~1 generation** — to prove the animation
  branch. Budget: **~3 generations** (headroom for one or two re-rolls, still ≪ 20).
- Capture findings: adherence to palette/outline (→ Aseprite backlog), `view`
  suitability for the oblique look, size→canvas numbers, wall-clock per job.

### 4. Client integration (benchmark-only, non-breaking)

- A small **asset registry / loader** the scene consults: for an entity/item that
  has a `review` sprite, render the real art; otherwise render the current greybox
  primitive. Fragment → real sprite on the **item-drop** layer; ruin hound → real
  8-dir sprite selected by `facing`, with the existing **runtime ellipse shadow**
  and `pivot.y` depth (no baked shadow). Hunter, tiles, overgrowth stay greybox.
- Load loose frames directly via Phaser (image/spritesheet); the runtime atlas tool
  remains an open item (deferred). Keep every added value benchmark-only.
- Rebase/merge `dev` (with #15 merged) into this branch before this step so it
  builds on the Phase-7 scene.

### 5. Verification

- Apply the asset-spec / pipeline **quality-gate checklist** to both assets; record
  which gates PixelLab-standard passes vs. what needs Aseprite (honest TODOs).
- `pnpm validate` green (lint + typecheck + tests + build). Any new Phaser-free
  loader logic is unit-tested (TDD); the scene stays a thin adapter.
- Offer an **isolated-port headless screenshot** so the GD Lead can review the real
  art *in context* (per the quality gates), without touching the user's dev server.
- Short pipeline retro appended to the nightly report → informs the next pass
  (Hunter/tiles, automation, the paid-plan decision).

## Testing strategy

- Pure/loader logic (e.g. selecting a sprite frame by facing, registry lookup with
  fallback) lives Phaser-free in `@gameplay` or a small pure helper and is
  unit-tested. Rendering remains in the thin scene adapter, verified by build +
  the in-context screenshot.
- No gameplay logic changes → existing 151 tests must stay green.

## Risks & mitigations

- **Trial budget exhaustion** → frugal plan (~3 gens), poll before re-rolling,
  `get_balance` checked before generating; stop and report if a gate needs a paid
  plan.
- **PixelLab output off-style** (soft guidance) → integrate at `review`, log the
  gaps for Aseprite; do not mark `approved`.
- **8h object expiry** → download the fragment immediately after completion.
- **#15 not merged** → land docs first; sync `dev` before integration.
- **Scope creep into a full art set** → hard-stop at the two pilot assets; the rest
  is the next pass.

## Deliverables

1. `docs/art-direction/{README.md, style-guide.md, briefs/ancient-fragment.md,
   briefs/ruin-hound.md}`.
2. `tools/asset-pipeline/README.md`.
3. Source frames + `metadata.json` for the fragment and ruin hound (status `review`).
4. Client asset-registry/loader + fallback integration (fragment + hound render real
   art; everything else greybox).
5. Verification: green `pnpm validate`, quality-gate notes, an in-context screenshot,
   and a nightly report with the pipeline retro.

## Open decisions surfaced (not resolved here)

- Final palette hex registry (proposed for approval in `style-guide.md`).
- Whether to adopt PixelLab `oblique` view (evaluate during the pilot).
- Paid PixelLab plan for the next (Hunter-scale) pass.
- Combat/damage model (D01) and inventory/identification — unrelated, still open.
