# Nightly report — fragment discovery (first playable loop, Phase 5 "Discover")

## Outcome

The greybox loop now advances from **Interact** to **Discover**. A discreet
"unidentified ancient fragment" rests on the item-drop layer inside the ruin's
broken interior — visible but not loud. When the Hunter is within range a
contextual `[E] Pick up · Unknown fragment` prompt appears; pressing `E` removes
the item from the world, shows a brief, restrained discovery line ("You found an
unidentified ancient fragment."), and records it in a minimal **satchel /
pickup-log placeholder** that stays hidden until the first pickup (no full
inventory panel). Unlike an obstruction, the fragment never blocks movement. All
of this is **benchmark-only and non-authoritative**; the server remains the
authority over real inventory and persistence (still pending its transport ADR).

## Status

- Build: `passed`
- Unit tests: `passed` (116 client tests; +8 new for the pickup path)
- Integration tests: `not run` (none exist for the client yet)
- Client validation: `passed` (`pnpm validate` — lint + typecheck + test + build)
- Demonstration: `available` (run the dev server; see "How to verify"). No live
  in-browser screenshot was captured this round — see "Not completed".

## Changes

- `gameplay/interaction.ts`: added an optional `collectible` flag to
  `Interactable` (absent ⇒ not a collectible), so obstructions and pickups share
  the same range/target model.
- `gameplay/benchmark-simulation.ts`: added a `CollectedItem` record and a
  benchmark-only **possession log** (`sim.collected`); `tryInteract` now also
  records a pickup when the resolved target is collectible; `reset` clears it.
- `gameplay/index.ts`: exported `CollectedItem`.
- `core/config/benchmark.ts`: added the `ancient-fragment` interactable
  (`kind: 'fragment'`, `collectible: true`, `blocksWhileActive: false`) at tile
  `(17, 12)` inside the ruin interior; added `fragment` / `fragmentAccent`
  colours; marked `overgrowth` as `collectible: false`.
- `scenes/benchmark-scene.ts`: item-drop depth layer; a discreet shard marker
  (no baked shadow); a range-gated `[E] Pick up · Unknown fragment` prompt; a
  self-fading discovery line; and the satchel/pickup-log line driven from
  `sim.collected`.
- Tests: possession-log behaviour (empty at spawn, records a pickup, ignores
  obstruction clears, single-fire, reset clears, does not block movement) and
  config guardrails (interactables in-grid / out of solids; the fragment is a
  non-blocking collectible).
- Docs: updated `apps/game-client/README.md` and `client-architecture.md`.

## Decisions applied automatically

- **Reused the Phase-4 `Interactable`/range model** with one optional
  `collectible` flag instead of a parallel item system. Rationale: smallest
  change that satisfies the acceptance criteria; keeps one contextual prompt at a
  time; the pickup vs. clear distinction is a single data flag plus a possession
  log, all Phaser-free and unit-tested.
- **Possession as a local pickup log, not an inventory.** Rationale: the
  benchmark explicitly calls for an "inventory placeholder / pickup log" and lists
  full inventory / item identification as non-goals. `sim.collected` records only
  `{ id, kind }` — no counts model, stacking, identification or persistence — and
  is marked non-authoritative.
- **Placement in the ruin interior (tile 17,12), non-gated.** Rationale: rewards
  exploring inward ("visible but not loud") without coupling Phase 5 to the
  Phase-4 cut. Placement/look/wording are placeholder benchmark composition, which
  the scope doc leaves to implementation.
- **Item-drop layer + discreet shard + no baked shadow.** Rationale: follows the
  approved layer stack and the item-drop spec (subtle, no glow, no loot styling).

## Human decisions required

- `D01 — Inventory / possession & item-identification model` (Level C): the real
  inventory, item identification and persistence model is a product/architecture
  decision and a benchmark non-goal. Only a clearly-marked local placeholder was
  built. No code beyond the placeholder should be added until this is decided
  (and it will ultimately be server-authoritative — depends on the pending
  realtime-transport ADR).
- `D02 — Should discovery be gated behind the axe cut?` The loop reads
  Interact → Discover. I did **not** require cutting the overgrowth to reach the
  fragment (the open greybox lets the player walk around it). If you want the cut
  to actually gate the fragment's route, that's a small follow-up + a layout
  change — tell me and I'll wire it.

## Not completed

- **Threat → Respond → Reward → Recover** (ruin hound, combat, combat camera,
  loop-completion feedback): out of scope for this increment; next phases.
- **Live in-browser screenshot/recording:** not captured this round. The pickup
  path is covered by unit tests and the production build; I deliberately did not
  start a local server to avoid disturbing your running dev server (5173). I can
  produce an isolated-port headless screenshot/artifact on request.

## Known risks

- The possession log and pickup are **non-authoritative and local** — they will
  be replaced by server-authoritative inventory once the realtime transport ADR
  lands; do not build persistent/competitive features on them.
- Fragment position, marker look, prompt wording and the satchel line are
  **placeholders** (benchmark-only), not approved final UI or lore.

## How to verify

1. `pnpm install` (if needed), then `pnpm --filter @hunter-order/game-client dev`.
2. Open `http://localhost:5173` and wait for the greybox.
3. Walk the Hunter (WASD / arrows) into the ruin's broken interior (down-right of
   spawn); a small weathered shard sits on the ground.
4. Approach it: a `[E] Pick up · Unknown fragment` prompt appears only in range.
5. Press `E`. Expected: the shard fades out, a brief "You found an unidentified
   ancient fragment." line shows near the top, and a `Satchel: Unknown fragment
   ×1` line appears bottom-left. Pressing `E` again does nothing (single pickup).
6. Press `R` to restart: the fragment is back and the satchel line is gone.
7. Automated: `pnpm validate` (lint + typecheck + 116 tests + build) is green.

## Files and evidence

- Branch: `agent/environmental-interaction` (reused per request; PR targets `dev`).
- Relevant paths: `apps/game-client/src/gameplay/interaction.ts`,
  `apps/game-client/src/gameplay/benchmark-simulation.ts`,
  `apps/game-client/src/core/config/benchmark.ts`,
  `apps/game-client/src/scenes/benchmark-scene.ts`, plus their tests.
- Screenshots, logs or artifacts: none this round (see "Not completed").
