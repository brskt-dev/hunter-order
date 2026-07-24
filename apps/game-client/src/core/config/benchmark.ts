// ============================================================================
// BENCHMARK-ONLY configuration for the "Overgrown Ruin" first-playable-loop
// greybox. Every value here is TEMPORARY and NON-AUTHORITATIVE:
//
//   * These are provisional feel/geometry values chosen only to make the loop
//     playable. They are NOT approved game rules. The movement/visual docs list
//     speed, radius, zoom, look-ahead, smoothing, etc. as OPEN items
//     (GD-0004 / GD-0005 open items) — do not treat them as final or copy them
//     into a shared/public contract.
//   * Fixed asset-geometry values that ARE approved (tile 48, Hunter canvas
//     64x80, footprint ratio 0.33 tile) are noted inline.
//   * The greybox layout below is a hand-authored placeholder scene, not a
//     world-generation rule (the operational world unit remains a zone/region).
//
// Keeping it all in one clearly-labelled place means values can be tuned or
// deleted without touching systems. Colours are numeric (0xRRGGBB) for Phaser
// primitives; text colours live in the shared COLORS constant.
// ============================================================================

export const BENCHMARK = {
  /** Approved: 48x48 px visual tile == 1x1 logical unit (asset-specification). */
  tileSize: 48,

  /**
   * Recommended benchmark scene size (implementation convenience, not a world
   * rule). 32x32 tiles == 1536x1536 world px.
   */
  world: { cols: 32, rows: 32 },

  /** Safe starting pocket at the ruin's edge (top-left, open ground). */
  spawnTile: { col: 4, row: 4 },

  /**
   * Static solid obstacles (ruin walls, tree/ruin base, debris) in tile coords.
   * The outer scene boundary is enforced by world bounds, not by solids.
   * Placeholder greybox composition — replaced by real objects in the art pass.
   */
  solidTiles: [
    { col: 14, row: 8, cols: 9, rows: 1 }, // ruin wall — horizontal span
    { col: 14, row: 8, cols: 1, rows: 12 }, // ruin wall — vertical span (forms an L)
    { col: 7, row: 22, cols: 3, rows: 3 }, // split tree / large ruin base
    { col: 22, row: 18, cols: 2, rows: 2 }, // stone / resource block
    { col: 20, row: 25, cols: 3, rows: 1 }, // blocking debris
    { col: 26, row: 24, cols: 1, rows: 6 }, // wall by the mildly dangerous pocket
  ],

  hunter: {
    /** Approved asset geometry (asset-specification). */
    canvasWidth: 64,
    canvasHeight: 80,
    pivotX: 32,
    /** Provisional (approved range 68-72); calibrated once a real sprite exists. */
    pivotY: 70,
    /** Approved ratio: circular footprint radius = 0.33 tile (~16 px). */
    footprintRadius: Math.round(0.33 * 48),
  },

  movement: {
    /** Provisional walk speed, world px per second. */
    walkSpeed: 140,
    /** Provisional safety cap on a single frame's dt (anti tab-refocus jump). */
    maxDeltaSeconds: 0.05,
  },

  camera: {
    /** Provisional Phaser follow lerp (0..1); smaller = smoother/laggier. */
    followLerp: 0.12,
    /** Provisional look-ahead distance in the movement direction (world px). */
    lookAheadDistance: 96,
    /** Provisional look-ahead smoothing rate (per second). */
    lookAheadSmoothing: 4,
  },

  /** Provisional interaction reach (world px, footprint edge to obstruction). */
  interaction: { range: 44 },

  /**
   * Things the Hunter can act on at range. Placeholder greybox content:
   *   - `overgrowth` obstructions block movement while active and open the
   *     passage once cut (collectible: false);
   *   - the `fragment` is a discreet pickup item (the unidentified ancient
   *     fragment) that never blocks movement and is collected on interact.
   * Placement is a hand-authored greybox composition, not a world rule.
   */
  interactables: [
    {
      id: 'overgrowth-1',
      kind: 'overgrowth',
      tile: { col: 9, row: 3, cols: 1, rows: 4 },
      blocksWhileActive: true,
      collectible: false,
    },
    {
      // Rests in the ruin's broken interior (inside the L-shaped wall), so it is
      // found by exploring inward — visible but not loud, per the benchmark doc.
      id: 'ancient-fragment',
      kind: 'fragment',
      tile: { col: 17, row: 12, cols: 1, rows: 1 },
      blocksWhileActive: false,
      collectible: true,
    },
  ],

  /**
   * The medium "ruin hound" threat (stub behaviour, NOT the final AI or combat
   * model — both are Level C / non-goals). It paces the patrol path (index 0 is
   * home), chases the Hunter within `aggroRadius`, and gives up past the larger
   * `deAggroRadius` (hysteresis). It lives in the lower "mildly dangerous pocket".
   * All values provisional/benchmark-only.
   */
  hound: {
    patrolTiles: [
      { col: 23, row: 27 }, // home
      { col: 23, row: 22 },
    ],
    /** Slower than the Hunter (walkSpeed 140) so retreat/spacing works. */
    speed: 118,
    /** Provisional; medium creature, slightly larger footprint than the Hunter. */
    footprintRadius: 20,
    aggroRadius: 190,
    deAggroRadius: 340,
    contactRadius: 40,
    arriveEpsilon: 6,
    /** Axe hits to drive it off (benchmark stub — no health/damage model). */
    hitsToRepel: 2,
    /** Runs away faster than it chased. */
    fleeSpeedMultiplier: 1.4,
  },

  /**
   * Hand-axe attack (benchmark stub — NOT the final combat/hitbox/damage model,
   * which is Level C). A swing connects with the hound within `attackRange` and
   * inside a cone in front of the Hunter's facing; the cooldown paces swings.
   */
  combat: {
    attackRange: 52,
    /** Cosine of the attack half-arc: 0.5 ≈ a 120° cone. */
    attackArcCos: 0.5,
    attackCooldownSeconds: 0.35,
  },

  /**
   * Combat camera (presentation only — never changes range, perception or logical
   * distance, per GD-0004). While the hound is engaged, the view eases toward a
   * moderate zoom-in with reduced look-ahead; it eases back on disengage. Exact
   * constants remain open. Benchmark-only.
   */
  combatCamera: {
    exploreZoom: 1,
    combatZoom: 1.32,
    /** Reduce exploration look-ahead to this fraction at full combat intensity. */
    lookAheadCombatScale: 0.4,
    /** Engagement smoothing rate (per second); drives zoom + look-ahead + danger. */
    intensitySmoothing: 4,
  },

  /** Greybox placeholder palette (numeric for Phaser primitives). */
  colors: {
    ground: 0x2f3a2c,
    gridLine: 0x3a4636,
    solid: 0x74707a,
    solidStroke: 0x9a96a0,
    spawn: 0x4f6f4a,
    hunter: 0xd8c9a0,
    hunterFacing: 0x24241f,
    footprint: 0x171717,
    overgrowth: 0x4a7a3f,
    overgrowthStroke: 0x6fae5f,
    // Ancient fragment: weathered stone/metal, moss/dirt-toned, subtly accented
    // (no glow). Reads as interactable on the ground without shouting "loot".
    fragment: 0x8a8672,
    fragmentAccent: 0xc9b88a,
    // Ruin hound: dark, earthy fur with a subtle warmer accent — contrasts the
    // green ground and reads as a predator without being cartoonish.
    hound: 0x2e2a28,
    houndStroke: 0x6b5a48,
    // Danger vignette shown while the hound is in contact (muted red, low alpha).
    danger: 0x7a2222,
    // Axe swing arc + the flash when a hit lands on the hound.
    attack: 0xf0ead6,
    hitFlash: 0xffe8a3,
    prompt: 0xf4f4ec,
  },
} as const;
