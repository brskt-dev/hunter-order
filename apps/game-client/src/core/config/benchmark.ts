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
  },
} as const;
