# World structure

> Status: Mixed
> Owner: Game Design Lead
> Last reviewed: 2026-07-21

This document defines the **structural** foundation of the Hunter Order world:
how servers, persistence, geography, regions, cities, safety and dungeons are
organized. It complements [`world-dynamics.md`](world-dynamics.md), which owns the
**behavioral/ecological** rules (how regions react, how controlled zones rotate),
and derives from the [`Game Constitution`](../vision/game-constitution.md).

Approved decisions are recorded in
[`GD-0002`](../decisions/GD-0002-persistent-world-structure.md). Approved
decisions, principles and consequences below are authoritative within their
stated boundaries. The [Open questions](#open-questions) are **not** approved and
must not be implemented as rules.

## Approved decisions

### 1. World topology — multiple independent servers

Hunter Order uses **multiple independent servers**. Each server has exactly one
persistent world with a single canonical state: one economy, one creature
population, and one discovery, ecological and community history.

The open world does **not** use parallel channels, layers, shards, or duplicated
copies of the same region.

- **Principle:** each server is a living, irreproducible version of Hunter Order.
  Servers share the same foundational rules and authored macrostructure but
  diverge through procedural behavior, ecology, events and community action.
- **Consequences:** a region may be controlled on one server and hostile on
  another; a species common on one and rare on another; a trade route essential
  on one and collapsed on another. Server identity is part of the experience.

### 2. Hunter–server binding

Each Hunter is **permanently bound** to the server chosen at creation. There is no
server transfer, inventory migration, progression conversion, or reputation,
title and discovery portability — and no exceptional relocation between worlds.

This is compatible with the identity rule in
[`hunter-identity.md`](hunter-identity.md): one verified identity maps to one
Hunter (for the Brazilian launch, one CPF to one Hunter).

- **Principle:** choosing a server means choosing the world in which that Hunter
  builds their history.
- **Consequence:** before creation, the game should present relevant server
  information (e.g. latency, region, predominant language, population, world age,
  population pressure, presence of friends/invitations, status). The exact
  interface and any recommendation algorithm are open.

### 3. Persistence model

Servers are **persistent**: no scheduled wipes, seasonal resets, or planned world
restarts as a renewal mechanism. The world continues indefinitely, but
persistence does not preserve every advantage — the world renews itself
internally.

- **Core rule:** history remains; domination does not.
- **Three persistence layers:**
  - **Permanent historical layer** (preserved as server memory): major
    discoveries, notable feats and the Hunters behind them, recorded world
    events, wars/conflicts, settlement founding/recovery/transformation, species
    cataloguing, identified artifacts, server-defining events.
  - **Mutable persistent layer** (persists but reversible): regional control,
    economic influence, trade routes, clan influence, controlled-zone status,
    resource availability, creature density, settlement relevance, access routes,
    regional safety, local prosperity.
  - **Transitory opportunity layer** (emerges and disappears): specific
    creatures, rare targets, temporary phenomena, contracts, resource
    concentrations, dungeon access, natural/migration events, local opportunities.
- **Consequence:** balance problems should normally be solved by systemic renewal
  (consuming wealth, removing items from circulation, degrading monopolies,
  redistributing opportunities, changing routes, renewing regional relevance),
  not by wipes. Veterans keep history, knowledge, reputation, relationships and
  legacy — not guaranteed permanent dominance.

### 4. Authored macrostructure, procedural interiors

The world uses an **authored, fixed macrostructure with procedural, mutable
internal content**.

- **Authored and shared across servers:** continents, large-scale geography,
  major biomes, central cities, major mountain ranges, seas, historical
  landmarks, foundational lore and large-scale geographical relationships.
- **Procedural and mutable per server:** sub-regions, caves, ruins, local routes
  and passages, resource distribution, ecosystems, phenomena, dungeons, frontier
  areas, minor settlements, access paths, local threats and opportunities.
- **Principle:** servers share the same world in concept, never the same world in
  state.
- **Consequence (external knowledge):** guides may be reliable at the macro level
  (e.g. "a mountain range lies north of a city") but must not guarantee the same
  cave entrance, internal route, resource location, creature population, active
  dungeon or local opportunity. Procedural systems operate inside authored
  constraints to preserve visual, ecological and narrative coherence, minimum
  quality, gameplay purpose and regional identity.

### 5. Regions as living systemic units

Regions are not merely visual or geographical divisions; each is a **living
systemic unit with its own state**. A region may track dimensions such as
geography, biome, climate, creature populations, resources, hostility, hunting
and exploration pressure, city/clan influence, route conditions, active
events/phenomena, known and unknown opportunities, control/abandonment state,
historical records, ecological recovery and migration behavior. Not every
dimension is directly visible to the player.

How regions **react** to hunting, overexploitation, abandonment, migration and
world evolution — and the emergent states they express (wild, explored,
controlled, overexploited, abandoned, regenerating, etc.) — is specified in
[`world-dynamics.md`](world-dynamics.md). Those states are interpretations of
internal variables, not necessarily rigid player-facing enums.

### 6. Regional boundaries and cartography

Regions have **real systemic boundaries that are initially invisible but
discoverable** through exploration and cartography rather than automatically
revealed.

- **Natural perception:** Hunters read transitions via vegetation, terrain,
  climate, lighting, sound, species, creature aggression, infrastructure and
  civilization influence.
- **Principle:** the world has boundaries; the Hunter does not begin knowing all
  of them. Cartography is a form of knowledge with conceptual stages (unknown →
  observed → mapped → studied → updated).
- **Information decay:** maps and records can become outdated as routes change,
  regions shift between controlled and hostile, species migrate, resources
  decline, access points collapse, new passages appear, or phenomena alter
  conditions. Old information stays historically meaningful but not eternally
  precise.
- **Information presentation:** the game communicates **readable signals** (few
  recent predator tracks, deteriorated roads, migration signs, scarcity reports,
  growing instability) rather than exposing raw simulation values (e.g. "hunting
  pressure: 78%"). Skills, equipment, specialists, cartography, research and
  community information may improve accuracy. The exact cartography system is open.

### 7. Central cities

Central cities are **permanent, invulnerable anchors of civilization**. They may
change in economy, population, visual state, commercial relevance, secondary
service availability, local problems and relationship with nearby regions. They
may **not** be permanently destroyed, disappear, become completely abandoned,
lose their structural role, or permanently lose essential services.

- **Function:** stable reference points for onboarding, essential services,
  trade, item identification, storage, social organization, expedition
  preparation, return/recovery and shared geography.
- **Principle:** the world may change deeply around central cities, but central
  cities preserve the continuity of civilization.
- **Scope note:** rules for villages, outposts, minor settlements, clan bases and
  player-founded structures are unresolved and may later be more severe than for
  central cities (see [Open questions](#open-questions)).

### 8. Safety layers

Central cities use **layered safety**, from safe to wild:

1. **Safe urban core** — fully protected: no unauthorized PvP, no hostile
   creatures under normal conditions, no item theft, reliable services, a
   dependable place to organize and recover.
2. **Vulnerable urban periphery** — safety decreases gradually (external
   districts, ports, farms, mines, industrial areas, walls, access roads, nearby
   outposts). May have guards, patrols and legal consequences, but limited,
   non-zero risk — not absolute immunity.
3. **Controlled region** — not an artificial safe zone; a region where sustained
   Hunter activity has reduced large-scale hostility. Still contains weaker,
   territorial or reactive creatures and environmental risk, and is **dynamic**
   (may revert to wild). Its rotation/reversal rules live in
   [`world-dynamics.md`](world-dynamics.md).
4. **Wild region** — full danger.

- **Principle:** civilization offers shelter, but its protection weakens as the
  Hunter moves away from it.

### 9. Instancing and dungeons

Dungeons may use **private group instances** for accessibility and experience
quality, but instancing must not create infinite farming or isolated economic
copies.

- **Core rule:** each group receives its own expedition, but all expeditions
  consume the same opportunity in the world.
- **Shared world entry:** the dungeon opportunity originates in the shared world
  (a discovered ruin, an opened passage, a temporary phenomenon, a revealed
  access, a contract, an authorization, or a world event).
- **Dual limitation model:**
  - **Per-Hunter reward limit:** each Hunter receives few fully rewarded
    participations in the same dungeon manifestation. Later participation may be
    allowed for helping, escorting, support, investigation or incomplete
    objectives, but must not repeatedly grant the primary reward at full value.
  - **Global depletion:** all instances draw from one shared server-level
    opportunity. As groups explore, resources decline, creatures diminish or
    adapt, structures destabilize, rare rewards disappear and routes change; the
    dungeon eventually depletes, collapses, closes or transforms. Lifecycle:
    discovery → availability → expeditions → depletion/transformation →
    closure/state change.
- **Information rule:** state is communicated through environmental cues
  (instability, looted areas, fewer creatures, specialist reports, reduced
  discovery quality, structural collapse, community information), not exact
  counters.
- **Anti-farm rule:** Hunter Order must not reward "enter, defeat, reset, repeat
  indefinitely". A dungeon is an opportunity in the world, not an infinitely
  resettable activity queue. This extends the anti-repetition rules in
  [`progression-risk-and-loot.md`](progression-risk-and-loot.md).

## Rejected models

The following are explicitly **not** approved:

- one global server for every player;
- open-world channels or duplicated layers;
- routine seasonal wipes;
- planned world resets as the primary renewal mechanism;
- fully procedural macrogeography with no stable authored identity;
- permanently destroyable central cities;
- fully safe cities with no vulnerable surrounding layer;
- conventional infinitely repeatable dungeon farming;
- complete server transfers;
- server transfer with partial conversion.

## Open questions

Unresolved — **must not** be inferred as approved rules:

- exact server population targets; server opening/closure policy; server queue
  rules; handling of abandoned or low-population servers;
- server launch cadence; whether server names are fixed or generated; how server
  state is summarized during Hunter creation;
- technical simulation boundaries between regions; exact regional variables;
  region update cadence;
- exact cartography mechanics; exact information-sharing mechanics;
- settlement rules outside central cities; player-founded structures; clan bases;
- exact PvP behavior in urban peripheries; legal or guard systems;
- exact dungeon participation/reward limits; exact depletion formulas; rules for
  helping other groups in dungeons; dungeon failure and re-entry rules.

Some world-behavior questions (world-origin event, permanent vs regional
geographic change, extinction, controlled-zone rotation selection, world-state
information visibility, history archival) are tracked in
[`world-dynamics.md`](world-dynamics.md).

## Related documents

- [`Game Constitution`](../vision/game-constitution.md) — product authority.
- [`world-dynamics.md`](world-dynamics.md) — regional behavior and controlled-zone rotation.
- [`hunter-identity.md`](hunter-identity.md) — identity and one-person-one-Hunter rule.
- [`progression-risk-and-loot.md`](progression-risk-and-loot.md) — anti-repetition and loot.
- [`clans-and-conflict.md`](clans-and-conflict.md) — social conflict and transport risk.
- [`GD-0002`](../decisions/GD-0002-persistent-world-structure.md) — decision record.
