// Phaser-free game constants. Isolated so they can be unit tested without the
// Phaser runtime and reused across layers.

/** Base design resolution. The canvas scales to fit the viewport from here. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Shared UI colors for the current (infrastructure-only) screens. */
export const COLORS = {
  background: '#0d0f14',
  title: '#e6e6e6',
  accent: '#7fdc7f',
} as const;
