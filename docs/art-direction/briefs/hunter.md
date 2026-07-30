# Brief — Hunter (player character, exploratory rotation pass)

> Status: Draft (exploration). Scope of this pass: the **8-direction static
> rotation** (idle baseline), to evaluate the look against a concept reference.
> No animation, no game integration. Generated asset stays `draft` until approved
> in context.

## Identity & world context

The initial explorer Hunter of the first playable benchmark: practical, prepared,
**not heroic** — the world is the protagonist, the Hunter reads second
([`visual-direction.md`](../../game-design/visual-direction.md#benchmark-artistic-target)).

## Category

`character` / humanoid. **8 directions** (`n,ne,e,se,s,sw,w,nw`), per the
[asset-spec](../../technical/asset-specification.md#directions) — same rule as the
[ruin-hound](ruin-hound.md). Animation states (walk/attack/hit) deferred to a later
pass.

## Concept references

Two human-provided realistic concept arts (2026-07-30, front + back orthographic
studies). Both share the same wardrobe language; they differ in build.

### Build A — lean (`hunter-lean`)

- tattered olive/moss-green hooded cowl-scarf over the shoulders, ragged hem,
  falling to a point at the back;
- dark brown leather chest piece over a black long-sleeve;
- brown leather bracers, fingerless leather gloves;
- olive-green cloth sash wrapped at the waist, hanging tails;
- black trousers, leather thigh strap;
- tall worn brown leather boots with wraps below the knee;
- short dark hair, light stubble; no helmet, no cape, no visible weapon;
- **no belt pouch, no backpack strap.**

### Build B — stocky (`hunter-stocky`)

Same cowl and emblem, heavier body: broad shoulders, wide hips, a pronounced
round belly, shorter apparent legs.

- cream/linen tunic with rolled sleeves under a dark quilted leather vest;
- brown leather belt with a **small pouch**, dark **red** cloth sash with hanging
  tails (replaces build A's olive sash);
- fingerless gloves, tattooed forearms;
- dark trousers with cloth leg wraps below the knee, worn brown leather boots;
- **shoulder strap across the chest** (backpack strap, visible on the back view);
- thick beard, short dark hair.

**Divergences from approved direction:**

1. Build A shows **no belt pouch and no backpack**, which `visual-direction.md`
   names for the benchmark Hunter. **Build B resolves this** — it has both the belt
   pouch and a shoulder strap, so it is the closer match to the approved
   description. Which build becomes the benchmark Hunter is a Game Design Lead
   call, not made here.
2. Both references carry an **antler/bone skull emblem** on the cowl (front clasp
   and back print). A faction insignia is **not approved lore**. Treated here as
   provisional benchmark decoration only — it must not be read as an order/faction
   symbol without an approved `GD-XXXX`.
3. Build B's tattooed forearms and red sash are new colour/detail elements. Kept as
   reference fidelity; the red must stay desaturated (`rust` / dark wine), **not**
   the reserved `danger` red, which is combat-critical only.

## Silhouette

Functional semi-chibi, silhouette before texture.

- **Build A:** lean, mobile, equipped traveller — cowl breaking the shoulder line,
  tapered legs, heavy boot mass at the base.
- **Build B:** wide, grounded, heavy — the belly and hip mass carry the read; cowl
  point and boot mass frame it top and bottom. Must still read as *practical and
  capable*, never comic-relief fat or slow-oaf.

## Palette constraints

`moss-dark` / `moss` for the cowl (and build A's sash), `leather` and `wood-dark`
for the chest piece, bracers, belt, pouch and boots, `iron-dark` for the trousers
and sleeves, `skin` for the face. Build B adds `skin`-adjacent linen for the tunic
and a desaturated `rust` / dark wine for the red sash — **never** the reserved
`danger` red. Dark **coloured** 1px outline, not pure black. No high saturation,
no metallic hero armour, no glow.

## Scale / canvas

Hunter visual height ~48 px, approved canvas 64×80, feet-midpoint pivot, circular
footprint 0.33 tile
([asset-spec](../../technical/asset-specification.md#dimensions-and-geometry)).
PixelLab `size: 48` → its own canvas is ~40% larger; **record the actual output
size** — reconciling PixelLab's square canvas with our 64×80 is Aseprite (Stage 3)
work. Rendered ellipse shadow only; **no baked ground shadow**.

## Prohibited

Chosen-hero framing, ornate/plate armour, dramatic full cape, glow or rarity FX,
neon or high saturation, heavy pure-black outline, excessive microdetail, baked
ground shadow.

## PixelLab calls (this pass)

Shared for both builds — `create_character`, `body_type: "humanoid"`,
`mode: "standard"`, `view: "low top-down"`, `n_directions: 8`, `size: 48`,
`detail: "medium detail"`, `outline: "single color outline"`,
`shading: "basic shading"`.

Standard mode chosen for cost (1 generation each) and consistency with the
[ruin-hound pilot](ruin-hound.md); `pro`/`v3` exceed the remaining trial budget.

**Build A — lean** (`name: "Hunter"`)

- `description`: "practical explorer hunter, tattered olive green hooded cowl scarf over dark brown leather chest piece, black long sleeves, brown leather bracers, fingerless gloves, olive cloth sash at waist, black trousers with thigh strap, tall worn brown leather boots, short dark hair, no cape, no weapon"
- `proportions`: custom mid semi-chibi — `head_size 1.25`, `legs_length 0.95`, rest 1.0

**Build B — stocky** (`name: "Hunter (stocky)"`)

- `description`: "stocky heavyset explorer hunter, big round belly, thick beard, tattered olive green hooded cowl with ragged pointed hem, cream linen tunic with rolled sleeves, dark quilted leather vest, brown leather belt with small pouch, dark red cloth sash, fingerless gloves, dark trousers with cloth leg wraps, worn brown leather boots, shoulder strap across chest, no cape, no weapon"
- `proportions`: custom heavy — `head_size 1.2`, `arms_length 1.0`,
  `legs_length 0.85`, `shoulder_width 1.3`, `hip_width 1.5`

Output kept **outside** `apps/`:
`docs/art-direction/explorations/hunter-<build>/idle/<dir>/000.png`
(+ `metadata.json`, status `draft`, and a `contact-sheet.png` for review).

### Recorded results (2026-07-30)

**Build A** — character `21054bb1-a532-4704-b014-8bd12e56141e`, output canvas
**68×68**, sprite height 52–54 px (target 46–52). Soft-guidance drift to correct in
Stage 3 or a regeneration: the **hood came out up** in all 8 directions (reference
has it down, face visible), and the green reads brighter than the proposed `moss`
family.

**Build B** — character `6f25ce18-ae44-44ab-b227-caf274032d8c`, output canvas
**68×68**, sprite height 48–50 px (**inside** the approved range). The heavy build
reads on the front/back/diagonal views (24 px wide against build A's 20 px) but the
pure side views are 17 px and lose most of the belly silhouette. Same hood-up and
brighter-green drift as build A.

Per-build drift lists live in
`explorations/hunter-<build>/metadata.json` → `driftFromBrief`.

## References

- [`../../game-design/visual-direction.md`](../../game-design/visual-direction.md) — proportion, outline, lighting, detail, benchmark Hunter.
- [`../style-guide.md`](../style-guide.md) — palette proposal, PixelLab parameter mapping, view.
- [`../../technical/asset-specification.md`](../../technical/asset-specification.md) — Hunter sizes, pivot, canvas, naming, metadata.
- [`../../technical/art-pipeline.md`](../../technical/art-pipeline.md) — stage gates.
