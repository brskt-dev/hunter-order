# Stage 2 Art-Pipeline Pilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the ChatGPT → Claude Code + PixelLab → Aseprite art pipeline end-to-end by generating two real greybox assets (ancient fragment + ruin hound) and integrating them into the client with fallback to the existing greybox primitives.

**Architecture:** Docs-first (the `docs/art-direction/` gate + pipeline README), then a small Phaser-free direction→frame helper (TDD), then frugal PixelLab generation saved as loose frames + metadata at status `review`, then a scene-level asset registry that renders real art where present and falls back to greybox primitives otherwise. Nothing changes gameplay logic; everything added is benchmark-only.

**Tech Stack:** TypeScript (strict), Phaser 3.90, Vite 6, Vitest (node env), ESLint 9 + simple-import-sort, Prettier 3; PixelLab MCP tools; pnpm workspace.

## Global Constraints

- **Branch:** `agent/art-pipeline-pilot` (already created from `dev`). Draft PR targets `dev`. Never commit to `dev`/`main`; never force-push.
- **Benchmark-only / non-authoritative:** all added rendering/config is temporary and marked so; the server is untouched; no gameplay rules, economy, progression, combat/damage model, or approved art *rules* change.
- **Art gate (CLAUDE.md):** no *definitive* assets without the `docs/art-direction/` style spec; generated pilot assets are `draft`/`review` only, never `approved` (human in-context review required, deferred).
- **PixelLab budget:** trial, ~20 generations, $0 credits. Stay frugal (~3 generations). Call `mcp__pixellab__get_balance` before generating; if a step would need a paid plan, stop and report.
- **PixelLab facts:** `create_character` standard = 1 generation, quadruped needs `template`; style params are *soft guidance* (enforce palette/outline later in Aseprite); map objects auto-delete after 8h (download immediately); poll `get_character`/`get_map_object` for completion.
- **Approved specs to honor:** `docs/game-design/visual-direction.md`, `docs/technical/asset-specification.md`, `docs/technical/art-pipeline.md`, `docs/decisions/GD-0005-...`. Tile 48×48; Direction8 keys `n,ne,e,se,s,sw,w,nw`; rendered ellipse shadows (no baked); render layers incl. `item-drop` and `shadow`.
- **Validation:** `pnpm validate` (lint + typecheck + test + build) must be green before each PR-affecting commit. Run prettier/eslint --fix only on touched files (avoid whole-tree EOL churn).
- **Dependency:** PR #15 (Phase 7 combat) is not yet in `dev`. Tasks 1–5 are code-independent and land first. **Before Task 6**, merge #15 into `dev` and merge `dev` into this branch so integration builds on the Phase-7 scene.

---

### Task 1: Art-direction style spec (the gate)

**Files:**
- Create: `docs/art-direction/README.md`
- Create: `docs/art-direction/style-guide.md`
- Create: `docs/art-direction/briefs/ancient-fragment.md`
- Create: `docs/art-direction/briefs/ruin-hound.md`

**Interfaces:**
- Produces: the approved-style reference the generation tasks (4, 5) cite in `promptRef`, and the palette registry the integration/config may later adopt. No code symbols.

- [ ] **Step 1: Write `docs/art-direction/README.md`**

Content: purpose (concrete, PixelLab-facing translation of the approved visual direction); the **gate** statement verbatim — "No definitive assets are generated without a brief in this folder; generated assets stay `draft`/`review` until a human approves them in context"; an index linking `style-guide.md`, the two briefs, and up to the approved docs (`../game-design/visual-direction.md`, `../technical/asset-specification.md`, `../technical/art-pipeline.md`, `../decisions/GD-0005-visual-direction-and-asset-foundation.md`); a status line `> Status: Draft — palette proposed for GD approval`.

- [ ] **Step 2: Write `docs/art-direction/style-guide.md`** including this **proposed dark-naturalist palette registry** (mark it "Proposed — awaiting GD approval; benchmark scope, not a final bible"), organized per the approved `global + materials + accents/states` scheme:

```md
## Proposed palette (hex) — benchmark scope, awaiting GD approval

Grounds/soil:   soil-dark #2a2620 · soil #3b342a · dirt #4a3f30
Vegetation:     moss-dark #2f3a2c · moss #4a7a3f · leaf #6fae5f
Stone/masonry:  stone-dark #4a4750 · stone #74707a · stone-light #9a96a0
Aged wood:      wood-dark #3a2e22 · wood #6b5a48
Metal/rust:     iron-dark #2e2a28 · iron #5c5650 · rust #7a4a2f
Leather/skin:   leather #6b4a32 · skin #d8c9a0
Water:          water-dark #223038 · water #35545e
Reserved accent (rarity, sparse): brass #c9b88a · brass-soft #d8c48a
Danger (combat-critical only):    danger #7a2222 · danger-bright #b23b3b
UI text:        ui-fg #f4f4ec
```

Also document: outline → PixelLab `single color outline` (dark coloured, not pure black — enforced in Aseprite); detail → `medium detail`; shading → `basic shading`; `view` → default `low top-down` with a note to **evaluate `oblique` (beta, 4-dir, ≤128px)** against the 2D-oblique look during the pilot; the "standard mode honors style as *soft guidance* only → palette/outline finalized in Aseprite (Stage 3)" caveat; sizes/canvas per size-class (Hunter 64×80; medium creature TBD-from-pilot; small item ~32px). Cross-reference the approved docs for anything not restated.

- [ ] **Step 3: Write `docs/art-direction/briefs/ancient-fragment.md`**

Brief content (Stage-1 fields from `art-pipeline.md`): narrative purpose (an unidentified ancient fragment, opportunity without explanation); category `item / item-drop`; silhouette (small, ancient stone/metal shard, partly moss/dirt-covered); palette constraints (stone/metal + reserved brass accent, no glow, no mobile-loot styling); scale/canvas (~32px, transparent bg); directions (1); animation (none); prohibited (excessive glow, rarity beams, cartoonish); PixelLab tool+params (`create_map_object`, width/height ~32, `detail: medium`, `outline: single color outline`, `view: high top-down`); references (visual-direction "Item drop", benchmark doc "Item drop — unidentified ancient fragment").

- [ ] **Step 4: Write `docs/art-direction/briefs/ruin-hound.md`**

Brief content: narrative purpose (medium ruin-adapted predator; provisional benchmark label, not final lore); category `creature / medium`; silhouette (thin, aggressive wolf/dog-like quadruped; wild, ruin-adapted); palette (dark earthy fur, subtle moss/rust accents, dark coloured outline; not demonic/fantastical); scale (medium size-class; PixelLab size ~48–64 → canvas ~40% larger; record actual); directions (8); animation states (idle first; walk later); prohibited (demonic, boss-scale, neon); PixelLab tool+params (`create_character`, `body_type: quadruped`, `template: dog`, `n_directions: 8`, `mode: standard`, `view: low top-down`, `detail: medium detail`, `outline: single color outline`; then `animate_character` `mode: v3`, `directions: ['south']`, `action_description: 'idle breathing, subtle weight shift'`, `frame_count: 6`); references (visual-direction "Creature — ruin hound", benchmark doc "Creature — ruin hound", asset-spec size-class + frame budget).

- [ ] **Step 5: Commit**

```bash
git add docs/art-direction
git commit -m "docs(art): add art-direction style spec + fragment/ruin-hound briefs (Stage 2 gate)"
```

---

### Task 2: Pipeline README

**Files:**
- Create: `tools/asset-pipeline/README.md` (replaces the empty `.gitkeep` role; leave `.gitkeep`).

**Interfaces:**
- Produces: the documented, repeatable flow the generation tasks follow. No code symbols.

- [ ] **Step 1: Write `tools/asset-pipeline/README.md`**

Document: the official flow `ChatGPT (brief) → Claude Code + PixelLab (generate) → Aseprite (finish)`; the **implemented** steps for this repo — (1) author/confirm a brief in `docs/art-direction/briefs/`, (2) `get_balance` check, (3) submit the PixelLab job (`create_map_object` / `create_character` / `animate_character`), (4) poll `get_*` until `completed`, (5) **download immediately** (map objects expire in 8h), (6) save loose frames under `apps/game-client/src/assets/source/<family>/…` per the approved naming, (7) write `metadata.json` (canvas, pivot, directions, animations, `source` provenance, `approval.state: "review"`), (8) mark `review`; the trial-budget note; and the **deferred** items (Aseprite polish, runtime-atlas generation, automation scripts — YAGNI until the manual flow is proven). Add a `metadata.json` template block copied from `asset-specification.md`.

- [ ] **Step 2: Commit**

```bash
git add tools/asset-pipeline/README.md
git commit -m "docs(pipeline): document the PixelLab asset-pipeline flow (manual, benchmark)"
```

---

### Task 3: Phaser-free sprite-direction helper (TDD)

**Files:**
- Create: `apps/game-client/src/gameplay/sprite-directions.ts`
- Test: `apps/game-client/src/gameplay/sprite-directions.test.ts`
- Modify: `apps/game-client/src/gameplay/index.ts` (export the new API)

**Interfaces:**
- Consumes: `type Direction8` from `./direction`.
- Produces:
  - `pixelLabCardinal(facing: Direction8): string` — maps our facing to PixelLab's cardinal name (`s→'south'`, `sw→'south-west'`, `w→'west'`, `nw→'north-west'`, `n→'north'`, `ne→'north-east'`, `e→'east'`, `se→'south-east'`).
  - `directionalFrameKey(base: string, facing: Direction8): string` — builds a Phaser texture key, e.g. `directionalFrameKey('hound-idle','sw') === 'hound-idle-sw'`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { type Direction8 } from './direction';
import { directionalFrameKey, pixelLabCardinal } from './sprite-directions';

const ALL: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

describe('pixelLabCardinal', () => {
  it('maps each Direction8 to PixelLab cardinal names', () => {
    expect(ALL.map(pixelLabCardinal)).toEqual([
      'north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west',
    ]);
  });
});

describe('directionalFrameKey', () => {
  it('joins a base and facing into a texture key', () => {
    expect(directionalFrameKey('hound-idle', 'sw')).toBe('hound-idle-sw');
    expect(directionalFrameKey('hound-idle', 's')).toBe('hound-idle-s');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/game-client && npx vitest run src/gameplay/sprite-directions.test.ts`
Expected: FAIL — cannot resolve `./sprite-directions`.

- [ ] **Step 3: Write minimal implementation** in `apps/game-client/src/gameplay/sprite-directions.ts`

```ts
// Maps the gameplay Direction8 to PixelLab's cardinal direction names and builds
// per-direction Phaser texture keys. Pure and Phaser-free (unit-tested).

import type { Direction8 } from './direction';

const CARDINAL: Record<Direction8, string> = {
  n: 'north',
  ne: 'north-east',
  e: 'east',
  se: 'south-east',
  s: 'south',
  sw: 'south-west',
  w: 'west',
  nw: 'north-west',
};

/** PixelLab cardinal name for a facing (e.g. 'sw' -> 'south-west'). */
export function pixelLabCardinal(facing: Direction8): string {
  return CARDINAL[facing];
}

/** Phaser texture key for a directional sprite (e.g. ('hound-idle','sw') -> 'hound-idle-sw'). */
export function directionalFrameKey(base: string, facing: Direction8): string {
  return `${base}-${facing}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/game-client && npx vitest run src/gameplay/sprite-directions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Export from the barrel** — add to `apps/game-client/src/gameplay/index.ts` (let eslint --fix sort):

```ts
export { directionalFrameKey, pixelLabCardinal } from './sprite-directions';
```

- [ ] **Step 6: Lint touched files + full gameplay tests**

Run: `cd apps/game-client && npx eslint --fix src/gameplay/sprite-directions.ts src/gameplay/sprite-directions.test.ts src/gameplay/index.ts && npx vitest run src/gameplay`
Expected: eslint exit 0; all gameplay tests PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/gameplay/sprite-directions.ts apps/game-client/src/gameplay/sprite-directions.test.ts apps/game-client/src/gameplay/index.ts
git commit -m "feat(client): add pure Direction8->sprite-frame helpers for real art"
```

---

### Task 4: Generate the ancient fragment (PixelLab)

**Files:**
- Create: `apps/game-client/src/assets/source/items/fragments/ancient-fragment/000.png`
- Create: `apps/game-client/src/assets/source/items/fragments/ancient-fragment/metadata.json`

**Interfaces:**
- Consumes: the brief in `docs/art-direction/briefs/ancient-fragment.md`.
- Produces: a `review`-status static item sprite + metadata that Task 6 loads by the texture key `fragment` (base).

- [ ] **Step 1: Check budget**

Call `mcp__pixellab__get_balance`. Expected: `generations_remaining > 0`. If 0, STOP and report (needs a paid plan).

- [ ] **Step 2: Submit generation**

Call `mcp__pixellab__create_map_object` with: `description: "small ancient stone-and-metal fragment, partly moss and dirt covered, worn, subtle brass accent, no glow"`, `width: 32`, `height: 32`, `detail: "medium detail"`, `outline: "single color outline"`, `view: "high top-down"`. Record the returned object ID.

- [ ] **Step 3: Poll until completed**

Call `mcp__pixellab__get_map_object` with the object ID every ~30s until status `completed` (or `failed` → retry once, else report). **Immediately** on completion, save the returned image to `apps/game-client/src/assets/source/items/fragments/ancient-fragment/000.png` (map objects expire in 8h).

- [ ] **Step 4: Write metadata**

Create `.../ancient-fragment/metadata.json`:

```json
{
  "id": "items.fragments.ancient-fragment",
  "category": "item",
  "status": "review",
  "canvas": { "width": 32, "height": 32 },
  "pivot": { "x": 16, "y": 28 },
  "directions": ["s"],
  "animations": {},
  "source": { "tool": "pixellab", "promptRef": "docs/art-direction/briefs/ancient-fragment.md", "generatedAt": "<ISO from generation>", "editedWith": null },
  "approval": { "state": "review", "reviewedBy": null, "reviewedAt": null }
}
```

- [ ] **Step 5: Human review checkpoint**

Present the sprite to the GD Lead (inline image). Note against the quality gates which pass (canvas, transparent bg, palette-ish, no glow) and which need Aseprite. Do NOT mark `approved`.

- [ ] **Step 6: Commit**

```bash
git add apps/game-client/src/assets/source/items/fragments/ancient-fragment
git commit -m "feat(art): add ancient-fragment pilot sprite (PixelLab, review status)"
```

---

### Task 5: Generate the ruin hound (PixelLab)

**Files:**
- Create: `apps/game-client/src/assets/source/creatures/ruin-hound/body/idle/<dir>/000.png` for each of the 8 directions (`n,ne,e,se,s,sw,w,nw`).
- Create: `apps/game-client/src/assets/source/creatures/ruin-hound/body/metadata.json`

**Interfaces:**
- Consumes: the brief in `docs/art-direction/briefs/ruin-hound.md`; `pixelLabCardinal` (to map downloaded cardinal frames to our `<dir>` folders).
- Produces: a `review`-status 8-direction idle the scene loads under base key `hound-idle` via `directionalFrameKey('hound-idle', facing)`.

- [ ] **Step 1: Check budget** — `mcp__pixellab__get_balance`; ensure ≥ ~3 remaining. Else STOP/report.

- [ ] **Step 2: Create the character (8-dir rotation, 1 generation)**

Call `mcp__pixellab__create_character` with: `description: "thin aggressive ruin-adapted wolf-dog, dark earthy fur, subtle moss and rust accents"`, `body_type: "quadruped"`, `template: "dog"`, `n_directions: 8`, `mode: "standard"`, `view: "low top-down"`, `detail: "medium detail"`, `outline: "single color outline"`, `name: "Ruin Hound"`. Record the character ID and the actual output size/canvas.

- [ ] **Step 3: Poll + download rotation**

`mcp__pixellab__get_character` every ~30s until `completed`. Save each direction's rotation frame to `.../ruin-hound/body/idle/<dir>/000.png`, mapping PixelLab cardinal → our `<dir>` via `pixelLabCardinal` (inverse). This 8-dir rotation is the static idle baseline.

- [ ] **Step 4: Add a cheap south idle animation (v3, 1 generation) — optional but planned**

Call `mcp__pixellab__animate_character` with `character_id`, `mode: "v3"`, `directions: ["south"]`, `action_description: "idle breathing, subtle weight shift"`, `frame_count: 6`. Poll `get_character`. If it lands, save frames to `.../body/idle/s/000.png..005.png` (replacing the single south frame); if budget/quality is poor, keep the static south frame and note it. Record generation cost.

- [ ] **Step 5: Write metadata**

Create `.../ruin-hound/body/metadata.json`:

```json
{
  "id": "creatures.ruin-hound.body",
  "category": "creature",
  "status": "review",
  "canvas": { "width": "<actual>", "height": "<actual>" },
  "pivot": { "x": "<actual cx>", "y": "<actual feet y>" },
  "directions": ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
  "animations": { "idle": { "frames": "<1 static, or 6 for south>" } },
  "source": { "tool": "pixellab", "promptRef": "docs/art-direction/briefs/ruin-hound.md", "generatedAt": "<ISO>", "editedWith": null },
  "approval": { "state": "review", "reviewedBy": null, "reviewedAt": null }
}
```

- [ ] **Step 6: Human review checkpoint** — present the 8 directions + south idle; record quality-gate pass/needs-Aseprite (palette adherence, outline, silhouette-reads-as-threat, no baked shadow). Do NOT mark `approved`.

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/assets/source/creatures/ruin-hound
git commit -m "feat(art): add ruin-hound pilot idle (8-dir, PixelLab, review status)"
```

---

### Task 6: Client integration with greybox fallback

**Precondition:** Merge PR #15 into `dev`, then `git fetch origin && git merge origin/dev` into this branch (resolve `benchmark-scene.ts` if needed). Confirm `pnpm validate` green before starting.

**Files:**
- Create: `apps/game-client/src/scenes/benchmark-assets.ts` (asset manifest: base key → source frame paths + canvas/pivot, imported via Vite `?url` or `import.meta.glob`).
- Modify: `apps/game-client/src/scenes/benchmark-scene.ts` (preload real frames if present; render fragment on the item-drop layer and the hound by facing with the runtime ellipse shadow + `pivot.y` depth; fall back to the greybox primitive when a texture is absent).
- Modify (if needed): `apps/game-client/src/assets/README.md` (note the new `source/` tree).

**Interfaces:**
- Consumes: `directionalFrameKey`, `pixelLabCardinal` (Task 3); the saved frames + metadata (Tasks 4, 5).
- Produces: no new exported gameplay symbols; scene-internal rendering only.

- [ ] **Step 1: Manifest** — in `benchmark-assets.ts`, declare the two pilot assets with their frame URLs (Vite-imported) and canvas/pivot from metadata, plus a `has(key)` helper the scene uses to decide real-vs-fallback. Keep it data-only and benchmark-only.

- [ ] **Step 2: Preload** — in `BenchmarkScene.preload()` (add if absent), load the fragment texture (`fragment`) and the 8 hound idle textures (`directionalFrameKey('hound-idle', dir)`) from the manifest. Guard each load so a missing file simply leaves the texture absent (fallback path).

- [ ] **Step 3: Render fragment** — in `drawFragment`, if the `fragment` texture exists, add a `this.add.image(...)` on `DEPTH.itemDrop` (origin at pivot) instead of the diamond primitive; else keep the diamond. Preserve the fade-on-pickup behavior (tween the image).

- [ ] **Step 4: Render hound** — in `createHound`/`renderHound`, if the hound idle textures exist, use a `Phaser.GameObjects.Image`/`Sprite` swapped by `directionalFrameKey('hound-idle', facing)` each frame, keep the separate runtime ellipse shadow and `DEPTH.entity + position.y` sorting; else keep the wide-rectangle primitive. Keep the hit-flash/fade-on-repel working against whichever node exists.

- [ ] **Step 5: Build + validate**

Run: `cd apps/game-client && npx tsc --noEmit && npx eslint --fix <touched files> && cd ../.. && pnpm validate`
Expected: typecheck clean, lint clean, 152+ tests pass (151 existing + Task 3's 2, minus none), build succeeds.

- [ ] **Step 6: In-context screenshot (isolated ports)**

Serve the production build on an isolated port and drive headless Chrome on an isolated CDP port (never 5173/9222); screenshot the fragment on the ground and the hound in the pocket. Look at the screenshot — confirm real art renders (not blank, correct layer/depth, shadow separate). Do NOT start a server on the user's default ports.

- [ ] **Step 7: Commit**

```bash
git add apps/game-client/src/scenes/benchmark-assets.ts apps/game-client/src/scenes/benchmark-scene.ts apps/game-client/src/assets/README.md
git commit -m "feat(client): render real fragment + ruin-hound art with greybox fallback"
```

---

### Task 7: Verification, docs & PR

**Files:**
- Create: `docs/agent/reports/2026-07-24-art-pipeline-pilot.md`
- Modify: `apps/game-client/README.md` (note real art for fragment + hound; pipeline)
- Modify: `docs/technical/client-architecture.md` (note the `assets/source` tree + manifest)

- [ ] **Step 1: Nightly report + pipeline retro** — use `docs/agent/report-template.md`; include the **pipeline retro**: generations spent, what PixelLab honored vs. needed Aseprite, `view` finding (low top-down vs oblique), size→canvas numbers, and the recommended next pass (Hunter/tiles + paid-plan decision). List `D01`/inventory as still-open.

- [ ] **Step 2: Update client docs** — README "Implemented"/pipeline note; architecture module table (`assets/source`, manifest). Keep concise.

- [ ] **Step 3: Final validate** — `pnpm validate` green.

- [ ] **Step 4: Commit + push + draft PR**

```bash
git add docs/agent/reports/2026-07-24-art-pipeline-pilot.md apps/game-client/README.md docs/technical/client-architecture.md
git commit -m "docs: record Stage 2 art-pipeline pilot + retro"
git push -u origin agent/art-pipeline-pilot
gh pr create --draft --base dev --head agent/art-pipeline-pilot --title "feat(client): Stage 2 art-pipeline pilot (fragment + ruin hound)" --body-file <(...)
```

- [ ] **Step 5: Hand off** — present the PR, the in-context screenshot, the palette-approval ask (style-guide.md), and the pipeline retro/next-pass recommendation to the GD Lead.

## Self-Review

- **Spec coverage:** docs/art-direction spec (Task 1) ✓; pipeline README (Task 2) ✓; pure helper TDD (Task 3) ✓; fragment generation (Task 4) ✓; ruin hound generation + idle (Task 5) ✓; client integration + fallback (Task 6) ✓; verification + screenshot + report + retro (Task 7) ✓; frugal budget checks (Tasks 4/5 Step 1) ✓; #15 dependency (Global Constraints + Task 6 precondition) ✓; palette proposed-for-approval (Task 1 Step 2) ✓; `oblique` evaluation (Task 1 + Task 7 retro) ✓; Aseprite deferred (Task 2 + review checkpoints) ✓.
- **Placeholder scan:** generation outputs use `<actual>`/`<ISO>` because they are runtime facts from an external service — intentional, filled at execution, not vague instructions. No "TODO/handle edge cases".
- **Type consistency:** `pixelLabCardinal` / `directionalFrameKey` names and signatures are identical across Tasks 3 and 5/6; base key `hound-idle` and `fragment` are consistent across Tasks 4–6.
