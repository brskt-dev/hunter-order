# Character system

> Status: Mixed
> Owner: Game Design Lead
> Last reviewed: 2026-07-22

This document defines Hunter Order's character system: creation, attributes,
skills, progression, succession, lineage, names, incapacitation, rescue and
respawn. It derives from the [`Game Constitution`](../vision/game-constitution.md)
and refines the identity model in [`hunter-identity.md`](hunter-identity.md) and
the defeat/loss model in
[`progression-risk-and-loot.md`](progression-risk-and-loot.md).

Approved decisions, principles and consequences below are authoritative within
their stated boundaries. Numeric balancing values are **not** approved and are
listed under [Open balancing questions](#open-balancing-questions); they must not
be invented.

## Philosophy

> The Hunter is temporary. The lineage is permanent.

Each Hunter is one individual life in the world, with its own name, appearance,
attributes, specializations, reputation and trajectory. The account represents
the historical continuity of that trajectory: when a player takes the lineage
path, each new Hunter succeeds the previous one, preserving only the legacies the
system explicitly defines.

Core distinction:

> Attributes determine potential. Skills determine competence.

A Hunter with high Coordination has excellent potential for Archery, but remains
inferior to an experienced archer until the corresponding skill is developed.

The system balances individual identity, permanent choices, specialization,
accumulated versatility, long-term progression, consequences, historical
preservation and freedom of build.

## Account identity and active Hunter

Each CPF-verified identity may have:

- exactly **one active Hunter at a time**;
- multiple **historical Hunters** over time, if it uses succession.

Not allowed:

- two active Hunters simultaneously;
- freely switching between historical Hunters;
- reactivating a concluded Hunter;
- creating parallel characters on the same identity to bypass permanent choices.

When a succession happens:

1. the previous Hunter permanently ends its playable trajectory;
2. it joins the public history of the lineage;
3. a new Hunter is created;
4. only the new Hunter can be controlled.

This refines the identity rule in [`hunter-identity.md`](hunter-identity.md): one
verified person still maps to one Hunter *account* (one active Hunter). Lineage
adds sequential history, never parallel characters.

## Creation

Initial creation defines **appearance**, **name** and the **initial attribute
distribution**.

Creation does **not** define the Primary Skill. The approved flow is:

```text
Creation
  -> Initiation
  -> Experimentation
  -> Primary Skill choice
  -> Progression
  -> Secondary Skill unlock
```

The intent is to let the player learn the game's systems before committing to a
permanent specialization.

## Names

Names are **unique per server**.

- a name cannot be used by two Hunters at once;
- after a trajectory ends, its name stays permanently reserved;
- names of historical Hunters never return to the available pool;
- a successor must take a different name; succession never reuses the
  predecessor's name.

This preserves the historical value of each identity.

## Attributes

Attributes represent the Hunter's natural capacities, not technical knowledge.
The system uses **five** attributes.

### Power

Capacity to apply physical force. May influence carry capacity, use of heavy
equipment, moving objects, brute-force actions, tools that require strength,
interaction with physical obstacles, and equipment/weapon requirements. Power does
not replace technique.

### Constitution

Bodily resilience. May influence endurance of efforts, physical tolerance,
recovery during activity, resistance to environmental conditions, capacity to
sustain long expeditions, and bodily response to extreme situations. Constitution
does not replace equipment, preparation or survival knowledge.

### Coordination

Motor control and physical precision. May influence movement execution, balance,
mobility, fine control, equipment handling, physical precision, and stability
during technical actions. Coordination must not simultaneously concentrate
excessive benefits of damage, defense, speed and precision.

### Perception

Capacity to observe and interpret the environment. May influence danger
detection, noticing details, identifying signs, environmental observation, initial
reading of tracks, threat anticipation, and discovery of subtle scenario elements.
Perception provides information; skills such as Tracking determine what the Hunter
can do with it.

### Focus

Mental discipline and control. May influence concentration, sustaining complex
actions, stability under pressure, resistance to mental effects, continuous
execution of delicate activities, and control of skills that demand mental
discipline. Focus does not represent intelligence, learning speed or acquired
experience.

## Initial attribute distribution

Every Hunter starts with the same base values and the same amount of free points.
The player distributes the points freely across the five attributes.

There are no negative attributes, no chosen disadvantages for extra points, no
negative-trait system, no later redistribution and no respec. The initial
distribution is permanent for that Hunter's entire life.

## Attribute progression

The Hunter receives additional points only at relevant milestones of its
trajectory — not per level, not through frequent linear progression, and not
infinitely.

Points received are universal (applicable to any attribute), permanent, and
cannot be redistributed.

### Increasing cost

The cost to raise an attribute grows with that attribute's current value:

```text
higher attribute -> higher cost to raise it
```

There is no mandatory hard cap per attribute. However, the total points obtainable
in one life are finite, which creates a practical specialization limit without a
fixed artificial ceiling.

## Skill structure

Three categories: **Primary Skill**, **Secondary Skill**, **Tertiary Skills**.

### Primary Skill

Defines the Hunter's main specialization. Provisional examples: Archery, Sword,
Magic, Tracking, Camouflage, Alchemy.

- has the Hunter's highest mastery ceiling;
- receives the main specialization bonus;
- is a requirement for succession;
- determines the Amulet of the Hunter's Soul that is generated;
- is chosen after initiation and experimentation;
- is permanent for that life.

The definitive list of Primary Skills will be defined in its own block.

### Secondary Skill

Belongs to the **same list as Primary Skills** — it is a second specialization,
not a category of minor activities. Example: Primary Archery + Secondary
Camouflage, or Primary Camouflage + Secondary Archery.

- each Hunter has exactly one Secondary Skill;
- it is unlocked after significant Primary Skill progress;
- it is not chosen at creation;
- any combination is allowed — there are no artificial compatibility lists and no
  forbidden combinations; some combinations have stronger natural synergy, others
  are more situational;
- the choice is permanent; there is no swap or respec.

Only creating a new Hunter through succession allows a different combination.

### Tertiary Skills

Productive, technical and general activities. Provisional examples: Agriculture,
Mining, Construction, Cooking, Carpentry, Fishing, Metallurgy.

- there is no limit on quantity; a Hunter may learn all of them and reach high
  mastery in several;
- Tertiary Skills are **not inherited** by successors; each new Hunter starts
  these from zero.

Economic balance must not depend on artificial profession limits. The economy is
protected by infrastructure, land access, workshops, tools, logistics, materials,
regional availability, time, risk, transport and social organization.

> Knowledge is not the same as self-sufficiency.

## Permanent choices

Permanent for one life: name, initial attributes, invested attribute points,
Primary Skill, Secondary Skill. There is no respec. Permanence sustains identity,
differentiation, historical value, long-term decisions, build diversity and the
importance of succession.

## Progression paths

An account follows one of two progression philosophies.

### Single Hunter

The player keeps one Hunter for the whole trajectory and never uses succession.

- Advantages: highest possible Primary Skill ceiling; highest specialization
  bonus; total continuity of personal story; extreme mastery in one life.
- Limitations: accumulates no Soul Amulets; receives no lineage benefits; builds
  no cross-generation versatility.

### Lineage Hunter

The player voluntarily ends Hunter trajectories and creates successors. After the
first succession, the account permanently follows the lineage path.

- Advantages: accumulates legacies from different Primary Skills; builds
  cross-generation versatility; preserves a public family history; expands the
  account's passive possibilities.
- Central limitation: a Lineage Hunter never reaches the same primary-mastery
  ceiling as a Single Hunter.

> Single Hunter seeks depth. Lineage Hunter seeks breadth.

## Succession

Succession is the voluntary and definitive end of a Hunter's trajectory. It is not
reincarnation — the successor is another person. Succession is voluntary,
irreversible, definitive, dependent on requirements, and cannot be undone.

### Requirements

1. reach the required advancement in the Primary Skill;
2. pay a fixed succession cost;
3. have no outstanding debt.

The cost is fixed; it does not scale automatically with the economy, does not
depend on variable achievements, and cannot be financed with new debt.

### Result

The previous Hunter becomes unplayable, becomes historical, stays publicly
recorded, and generates an Amulet of the Hunter's Soul. The successor receives a
new name and appearance, distributes new attributes, begins new Primary and
Secondary Skills, begins Tertiary Skills from zero, has new personal reputation
and starts a new trajectory.

## Succession inheritance

The successor automatically inherits **only**:

- the lineage;
- the mechanical legacies of active amulets;
- the historical record of the amulets.

It does **not** automatically inherit: money, equipment, inventory, workshops,
buildings, land, contracts, debts, attributes, Primary Skill, Secondary Skill,
Tertiary Skills, or personal reputation.

Social transfers of wealth before succession may happen through other trusted
players. This social risk is accepted as part of the sandbox.

## Amulet of the Hunter's Soul

Each succession generates an Amulet of the Hunter's Soul, which has two
dimensions: a permanent **mechanical legacy** and a **physical representation** in
the world.

### Mechanical legacy

Each Primary Skill always generates the same buff. There are no procedural
versions, random rolls, variable quality, or different effects for the same
Primary Skill:

```text
Hunter with Archery as Primary Skill -> always generates the same Archery legacy
```

Exact numbers and effects are defined per skill during balancing.

#### Duplicates

If multiple Hunters of the same lineage share the same Primary Skill:

- all generate their own historical amulets;
- only the **first** amulet of that Primary Skill activates the mechanical buff;
- duplicate amulets do not stack the same buff;
- duplicates still exist as objects and historical records.

```text
1st Archery amulet   -> unlocks the Archery legacy
2nd Archery amulet   -> adds no further buff
1st Camouflage amulet -> unlocks the Camouflage legacy
```

The lineage accumulates different knowledge, not infinite copies of the same
advantage.

### Physical representation

Each amulet also exists as a physical object. It can be carried, stored, displayed
in a residence, placed in a memorial, presented to other Hunters, used in
ceremonies, included in collections, lost, stolen, or destroyed if the general
item rules allow it.

Losing the physical representation never removes the lineage's mechanical legacy.
The buff does not occupy inventory, does not need to be equipped, is not dropped on
incapacitation, cannot be sold, stolen or erased, and remains available to all
successors.

> The object preserves the person. The legacy preserves the knowledge.

The physical amulet may record suggested historical information: Hunter name,
generation order, Primary Skill, historical period, relevant feats, description,
associated events, and the location or context of the succession.

## Public lineage

Every lineage is publicly identifiable. Other players may consult: lineage name,
current Hunter, previous Hunters, generation order, each generation's Primary
Skills, generated amulets, active mechanical legacies, public historical records,
and feats associated with the lineage.

Succession may not be used to fully hide the account's origin, erase history, pose
as a brand-new account, hide accumulated legacies, erase known rivalries, or
abandon the lineage's notoriety. The successor is a new person, but its origin is
public.

## Personal reputation and lineage reputation

The two reputations are separate.

- **Personal reputation** belongs only to the current Hunter (fulfilled
  contracts, crimes, alliances, relationships, feats, behavior, individual
  recognition, institutional ties). It is not automatically inherited.
- **Lineage reputation** is the account's accumulated history (notoriety,
  ancestors' feats, participation in historical events, built trust, lasting
  rivalries, diversity of legacies, political or social relevance).

The mechanical effects of lineage reputation are not yet defined; until a future
decision, treat it primarily as historical and social information.

## Defeat and incapacitation

The Hunter does **not** permanently die in ordinary combat. Defeat is
**incapacitation**: the Hunter survives and is later rescued by a Merchant. The
real end of a playable trajectory happens only through voluntary succession.

This supersedes the earlier "may occur" merchant-recovery framing in
[`progression-risk-and-loot.md`](progression-risk-and-loot.md): rescue is the
standard outcome of defeat, not a random chance.

### Item recovery

After incapacitation, the Merchant recovers a random number of items between **1
and 5**, selected by:

1. rarity priority;
2. random draw on ties.

The remaining items stay at the incapacitation location. Exact rarity,
eligibility and exception parameters are defined by the item system.

### Item cycle in the world

Items not recovered by the Merchant pass through three phases:

```text
Phase 1 - Reserved recovery : the incapacitated Hunter and the original group
Phase 2 - Public looting     : any player may loot the items
Phase 3 - Despawn            : the items disappear from the world
```

Exact phase durations are a balancing decision.

### Respawn

After rescue, the Hunter wakes at the **nearest functional settlement** — city,
village, outpost or other valid settlement. The return point depends on the
current world state; there is no obligation to return to a central city, and the
settlement must be functional at the moment of rescue.

### State after rescue

The Hunter returns alive, conscious and physically recovered, with no post-death
debuff, no mandatory temporary attribute reduction and no artificial experience
penalty. The consequences of defeat come from item loss, expedition
interruption, displacement, time, the rescue cost, the attempt to recover
remaining items, and public-loot risk.

### Rescue cost and debt

The Merchant charges for the rescue. If the Hunter cannot pay, the rescue still
happens and a **debt** is created.

Debt is repaid automatically: future monetary income is partially directed to
repayment until settled. Debt does **not** automatically cause reputation loss,
pursuit, bounty, imprisonment, social punishment or general gameplay blocking.
However, a Hunter with debt **cannot** perform succession.

## Consolidated flows

### First life

```text
Creation -> Name, appearance, attributes -> Initiation -> Experimentation
  -> Primary Skill choice -> Progression -> Secondary Skill unlock
  -> Tertiary Skill development
```

### Lineage succession

```text
Primary Skill progression -> Requirements met -> Debts cleared
  -> Fixed cost paid -> Irreversible succession
  -> Previous Hunter becomes historical -> Amulet generated
  -> New Hunter created -> Inherits only lineage and legacies
```

### Incapacitation

```text
Hunter incapacitated -> Merchant selects 1-5 items
  -> Remaining items stay on location -> Reserved phase -> Public phase -> Despawn
  -> Hunter returns to nearest functional settlement -> Charge or debt created
```

## Mandatory implementation principles

Future implementation must preserve: one active Hunter per identity; no
reactivating historical Hunters; permanently reserved names; attribute choices
without respec; Primary Skill chosen after experimentation; exactly one Secondary
Skill; permanent Primary and Secondary; unlimited Tertiary Skills; Tertiary Skills
not inherited; voluntary and irreversible succession; permanent separation between
Single Hunter and Lineage Hunter; higher primary ceiling for Single Hunter;
distinct accumulable legacies; non-stacking duplicate buffs; physical
representation separate from mechanical legacy; public lineage; personal reputation
separate from lineage reputation; incapacitation instead of permanent death;
partial item recovery; reserved/public/despawn cycle; respawn at a nearby
functional settlement; full physical recovery; automatic debt; succession blocked
while debt exists.

## Open balancing questions

Unresolved — **must not** be inferred as approved rules:

- definitive list of Primary Skills; definitive list of Tertiary Skills;
- numeric requirements to unlock the Secondary Skill; numeric succession
  requirements; the fixed succession cost;
- exact mastery ceilings for Single Hunter and Lineage Hunter;
- specific buffs of each amulet;
- attribute base values; the increasing-cost formula; total attribute points; the
  exact attribute/skill/equipment interaction;
- item-recovery-phase durations; rescue price; debt retention percentage and
  affected income sources; priority between multiple debts; anti-abuse rules;
- mechanical effects (if any) of lineage reputation;
- detailed rules for displaying, stealing and destroying physical amulets;
- item rarity, eligibility and exceptions for merchant recovery (owned by the item
  system).

## Related documents

- [`Game Constitution`](../vision/game-constitution.md) — product authority.
- [`hunter-identity.md`](hunter-identity.md) — identity, pursuit, specialization model.
- [`progression-risk-and-loot.md`](progression-risk-and-loot.md) — opportunity/skills/loot, defeat cost.
- [`world-structure.md`](world-structure.md) — servers, settlements, safety layers.
- [`world-dynamics.md`](world-dynamics.md) — settlement/region state that respawn depends on.
- [`GD-0003`](../decisions/GD-0003-character-and-lineage-system.md) — decision record.
