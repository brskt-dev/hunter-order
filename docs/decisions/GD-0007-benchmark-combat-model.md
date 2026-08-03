# GD-0007 - Benchmark combat & PvP-state model (HP / damage / defeat)

> Status: Accepted
> Date: 2026-07-31
> Decision owner: Game Design Lead

## Context

`D01` — the final combat / damage / defeat model — has been the largest open Level-C
question. Until now the benchmark only had a **repel stub** (the ruin hound flees after
`hitsToRepel` axe hits; no HP, no damage, no defeat) and a **PvP timer stub**
([GD-0006](GD-0006-circumstantial-entity-collision.md) left the Hunter↔Hunter combat-state
model open). To let combat actually be *played and felt* in the greybox, the Game Design
Lead decided to implement a **concrete combat model at the benchmark level** — real
HP/damage/defeat and a real PvP combat-state — **client-only and non-authoritative**.

This resolves D01's questions **for the benchmark**. The server-authoritative combat
resolution, balancing, the real death/consequence model, and the realtime-transport ADR
remain **future work** (the server is untouched; ADR-0002 still holds).

## Decision

Adopt a benchmark-only, non-authoritative combat model:

- **HP** on every combat entity — the player Hunter, each ruin hound, and the stand-in
  Hunter. Provisional benchmark values (tunable, not approved balance): player `5`,
  hound `2`, stand-in `3`.
- **Damage** is fixed per hit (benchmark): the player's attack (axe/punch) deals `1`.
  Creatures and Hunters deal damage through **their own attacks on a cooldown** — a hound
  in contact bites for `1` about every `1.2s`; the stand-in punches for `1` about every
  `0.8s` (its existing attack cadence). (Previously contact only raised a "danger" state;
  now it costs HP.)
- **Defeat of a target:** HP ≤ 0 → a brief **"downed"** state (the entity cannot act),
  then the creature **vanishes** (extending the existing flee) and the stand-in
  **recedes / resets**.
- **Defeat of the player:** HP ≤ 0 → **respawn at the safe pocket + reset the encounter**
  (HP restored; hounds/stand-in return to their initial state). **No permadeath** — a real
  death / consequence / penalty model is out of the benchmark's scope and a future
  GD/ADR concern. This is the loop's "Recover" beat.
- **PvP combat-state (resolves the GD-0006 open item, benchmark scope):** attacking
  another Hunter flags **mutual combat** (a timer), refreshed by **any combat action
  between the two**; it ends on **timeout when out of range with no actions**, or when
  **one is defeated**. PvP uses the same damage/defeat model. Out of combat there is no
  damage and no body collision (GD-0006 — collision stays combat-gated).
- The hound's `hitsToRepel` stub is **replaced** by HP + damage.

**Feedback is restrained (presentation, benchmark contextual-UI rule):** a small over-head
HP bar shown **only during combat** (appears on engage/damage, fades out of combat) plus a
discreet player-HP indicator. **No** always-on MMO health bars.

## Consequences

- The benchmark client simulation gains HP, damage application, "downed"/defeat states,
  hound contact attacks, and player respawn — all still **benchmark-only / non-authoritative**.
- The numbers (HP, damage, cooldowns, downed durations) are **benchmark tuning**, not
  approved balance; expect to calibrate them in playtest.
- The benchmark doc's "combat model" open item now points here for the benchmark-level
  answer; the canonical model is still deferred.

## Open items (must not be invented as rules)

- All balance numbers (HP/damage/cooldowns/durations).
- The real **death / consequence / penalty** model (permadeath vs respawn cost vs lineage
  — see the character/lineage docs; a future GD).
- **Server-authoritative** hit validation and combat resolution (needs the transport ADR).
- PvP **safe zones, flagging, and penalties** (only the combat-state gate exists here).
- Varied per-creature HP/damage, loot/rewards on defeat, status effects.

## Relationship to existing decisions

- **Resolves D01 at benchmark scope** (the final canonical model remains future).
- Builds on **GD-0006** (circumstantial combat collision — PvP body separation) and
  **GD-0004** (movement/exploration; combat-state driving the camera).
- Consistent with **ADR-0002** (server-authoritative): this is the temporary client-only
  simulation that exists until the realtime-transport ADR; it never claims final authority
  over persistent/competitive outcomes.

## Source material

- In-conversation design decision by the Game Design Lead, 2026-07-31.
- Repository is the only source of truth.
