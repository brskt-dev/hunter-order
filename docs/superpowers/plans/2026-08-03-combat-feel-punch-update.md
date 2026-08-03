# Combat feel (i-frames, take-hit, telegraph) + punch art update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (1) Finish the Hunter punch art now that all 8 directions exist in PixelLab (drop the fallback); and add three combat-feel improvements the GD Lead chose: (2) brief **i-frames** (invulnerability after taking a hit and after respawn); (3) a weighty **take-hit reaction** (flash + visual recoil + micro hit-stop on both sides, and the player's attack impact fires on the punch's connect frame); (4) an enemy **attack telegraph** (a brief wind-up before a hound bite / stand-in punch, so the player can read and react).

**Architecture:** The punch art is a manifest/asset update. The combat behaviour (i-frames, attack telegraph) lives in the benchmark simulation as timers gating the existing damage; the take-hit weight and the telegraph *tell* are presentation in the scene. All still **benchmark-only / non-authoritative** (GD-0007 — provisional tuning, server model future).

**Tech Stack:** TypeScript, Vitest (node env), Phaser 3.90. Continues PR #19.

## Global Constraints

- **Benchmark-only / non-authoritative (GD-0007).** New values are provisional tuning. Player logical position changed only by its own movement + the defeat-respawn (recoils are presentation-only — never the logical position).
- **TDD** for sim/config changes. Gate: `pnpm validate` green from repo root (lint — imports/exports sorted). Do NOT start a dev server / bind 5173.
- Work stays on branch `agent/combat-push-apart-collision` (PR #19).

---

### Task 1: punch art — download the completed 8-direction cross-punch + drop the fallback

**Files:**
- Create/overwrite: `apps/game-client/src/assets/source/characters/hunter/{bruno-dentes,eduardo-careca}/body/punch/<dir>/000..005.png` (the directions that were missing) + update each `metadata.json` (`punch.directions` → all 8).
- Modify: `apps/game-client/src/scenes/benchmark-assets.ts` (`PLAYER_PUNCH_DIRS` / `TEST_PUNCH_DIRS` → all 8 directions).

- [ ] **Step 1: Fetch fresh URLs.** Load `mcp__pixellab__get_character` and call it for `21054bb1-a532-4704-b014-8bd12e56141e` (Bruno) and `6f25ce18-ae44-44ab-b227-caf274032d8c` (Eduardo). Both now have `cross-punch` in all 8 directions (6 frames each), generated 2026-08-03.
- [ ] **Step 2: Download the punch frames** for ALL 8 directions of both characters into `body/punch/<shortdir>/000.png..005.png` (overwrite existing; download the previously-missing dirs — Bruno was missing n/ne/e/w/nw; Eduardo was missing n/ne/e/w/nw/sw). Map PixelLab dir names → short codes (south→s, south-east→se, east→e, north-east→ne, north→n, north-west→nw, west→w, south-west→sw). `curl -fsSL`. Verify each character now has punch for all 8 dirs × 6 frames = 48 files.
- [ ] **Step 3: Update `metadata.json`** for both: `animations.punch.directions` → the full 8 short codes; drop the "other directions failed / complete later" note.
- [ ] **Step 4: Manifest.** In `benchmark-assets.ts`, set `PLAYER_PUNCH_DIRS` and `TEST_PUNCH_DIRS` to all 8 directions (`['n','ne','e','se','s','sw','w','nw']`). Keep `nearestCoveredDirection` in use (with full coverage it now returns the target facing itself — an inert, harmless safety net).
- [ ] **Step 5: Validate + commit.** `pnpm validate` green (the new frames load via the existing glob; punch anims register for all 8 dirs). Commit: `feat(art): complete the 8-direction Hunter punch; drop the punch-direction fallback (review)`.

---

### Task 2: sim + config — i-frames + enemy attack telegraph

**Files:**
- Modify: `apps/game-client/src/core/config/benchmark.ts` (+ test)
- Modify: `apps/game-client/src/gameplay/benchmark-simulation.ts` (+ test)

**Interfaces produced:**
- Config: `combatModel.playerInvulnSeconds`; `combatModel.hound.windupSeconds`; `combatModel.standIn.windupSeconds`.
- Sim getters: `playerInvulnerable: boolean` (i-frame window active); `houndWindingUp: readonly boolean[]`; `standInWindingUp: boolean`.

- [ ] **Step 1: Config (with a failing test).** Add to `benchmark.ts` `combatModel`: `playerInvulnSeconds: 0.7`, `hound.windupSeconds: 0.35`, `standIn.windupSeconds: 0.3`. Extend the `benchmark.test.ts` combat-model sanity test to assert these are `> 0` (write the assertion first → fail → add config → pass).

- [ ] **Step 2: i-frames (failing test first).** In `benchmark-simulation.ts` add `private playerInvulnTimer = 0` and `get playerInvulnerable(): boolean { return this.playerInvulnTimer > 0; }`. Decrement it each `update`. Gate ALL player damage on it: a hound bite / stand-in punch only reduces `playerHp` (and sets `playerStruckThisFrame`) when `playerInvulnTimer <= 0`; when damage IS applied, set `playerInvulnTimer = combatModel.playerInvulnSeconds`. Also set `playerInvulnTimer = combatModel.playerInvulnSeconds` in `respawnAfterDefeat()`. Reinit in `reset()`.
  - Test: with a hound biting every frame in contact, the player takes exactly one hit, then is invulnerable for the window (no further HP loss until it elapses); after respawn the player is briefly invulnerable.

- [ ] **Step 3: enemy attack telegraph (failing test first).** Replace the instant bite/punch with a wind-up:
  - Hounds: add `private houndWindupTimer: number[]` (init 0). In `update`, for a non-downed, non-`flee` hound in contact: if `houndWindupTimer[i] > 0` decrement it, and when it reaches 0 THIS frame resolve the bite (apply the i-frame-gated damage + reset the contact cooldown); else if the contact cooldown is ready and no wind-up is running, START the wind-up (`houndWindupTimer[i] = combatModel.hound.windupSeconds`). A hound that leaves contact mid-wind-up cancels it (reset to 0). `get houndWindingUp(): readonly boolean[]` = `map(t => t > 0)`.
  - Stand-in: add `private standInWindupTimer = 0`; the existing punch (currently fires on `standInCooldown<=0` in range) now first winds up for `standIn.windupSeconds`, then on completion fires the `standInStruck` pulse + i-frame-gated damage + pvp refresh + cooldown reset. Leaving range cancels the wind-up. `get standInWindingUp(): boolean`.
  - Reinit both in `reset()`/`resetCombatEntities()`.
  - Test: a hound in contact does NOT damage the player during the wind-up window; damage lands only after `windupSeconds`. A hound that leaves contact mid-wind-up deals no bite.

- [ ] **Step 4: Validate + commit.** `pnpm validate` green. Commit: `feat(client): combat i-frames + enemy attack telegraph (GD-0007 benchmark tuning)`.

---

### Task 3: scene — take-hit weight, telegraph tell, punch connect-sync, i-frame blink

**Files:** Modify `apps/game-client/src/scenes/benchmark-scene.ts` (+ `core/config/benchmark.ts` colours if needed).

Presentation only — no sim change; gate `pnpm validate` + visual. Reuse existing idioms (`showPlayerHitFlash`, the `impact` envelope / `houndFlash` recoil, the per-entity views). Any new transient scene field MUST be reset in `create()` (restart-safe).

- [ ] **Step 1: Player take-hit weight.** On `sim.playerStruck`, in addition to `showPlayerHitFlash()`: a brief visual recoil of the Hunter sprite (push the sprite a few px away from the nearest threat or just a small screen-shake via the existing `impact` envelope) + a micro hit-stop (reuse the impact hit-stop). Keep restrained.
- [ ] **Step 2: i-frame blink.** While `sim.playerInvulnerable`, flicker the Hunter sprite alpha (a low-cost blink) so the invulnerability window reads; restore full alpha when it ends.
- [ ] **Step 3: Stand-in take-hit.** When the player's swing hits the stand-in (`result.hitOtherHunter`), flash + a brief recoil on the stand-in sprite (mirror the hound hit-flash idiom), so PvP hits read like PvE hits.
- [ ] **Step 4: Enemy telegraph tell.** While `sim.houndWindingUp[i]` / `sim.standInWindingUp`, show a brief restrained wind-up tell on that entity (e.g. a quick tint/scale pulse or a small backward lean) so the player can react. Hidden when not winding up. Add `colors.telegraph` if a colour is needed.
- [ ] **Step 5: Punch connect-sync.** The player's attack impact (the target flash + camera shake from `registerHit`) currently fires immediately on Space. Instead, fire it when the punch animation reaches its connect frame (~frame 3 of 6) — track the playing punch and trigger the impact then. The sim's damage timing is unchanged (a few frames is imperceptible); only the *visual* impact syncs to the punch landing.
- [ ] **Step 6: Validate + commit.** `pnpm validate` green. Commit: `feat(client): take-hit weight, i-frame blink, enemy telegraph tell, punch connect-sync`.

---

### Task 4: verify, report, update PR #19

- [ ] **Step 1:** `pnpm validate` green.
- [ ] **Step 2:** Nightly report `docs/agent/reports/2026-08-03-combat-feel-punch-update.md` (outcome: 8-dir punch complete; i-frames; take-hit weight; enemy telegraph; how to verify; deferred/tuning notes; risks).
- [ ] **Step 3:** Commit the report; `git push` (PR #19); update the PR #19 body to note this slice. Do NOT merge.

---

## Self-Review

**Coverage:** punch 8-dir + drop fallback → T1; i-frames (post-hit + respawn) → T2; enemy telegraph (hound bite + stand-in punch wind-up) → T2; take-hit weight (player + stand-in flash/recoil/hit-stop) + i-frame blink + punch connect-sync → T3; report/PR → T4. (The "encounter cleared" beat was NOT selected — omitted.) ✓

**Placeholder note:** T3 is structural guidance generalising existing feel/flash idioms; the correctness-critical config/sim timers (T2) are fully specified. Test snippets say "match the file's construction" for fixtures — intentional.

**Type/name consistency:** `combatModel.playerInvulnSeconds` / `hound.windupSeconds` / `standIn.windupSeconds` (T2 config) → consumed by the sim timers (T2) → `playerInvulnerable` / `houndWindingUp` / `standInWindingUp` getters consumed by the scene (T3). `PLAYER_PUNCH_DIRS`/`TEST_PUNCH_DIRS` → all 8 (T1). Damage stays i-frame-gated; player never displaced by recoil (presentation-only). ✓
