// Benchmark-only art manifest. Maps Phaser texture keys to the generated,
// review-status source frames so BenchmarkScene can render real art where present
// and fall back to the greybox primitives otherwise. Everything here is
// benchmark-only / NON-AUTHORITATIVE (see each asset's metadata.json, status
// "review"). Vite resolves the PNG imports to bundled URLs.

import houndE from '@assets/source/creatures/ruin-hound/body/idle/e/000.png';
import houndN from '@assets/source/creatures/ruin-hound/body/idle/n/000.png';
import houndNE from '@assets/source/creatures/ruin-hound/body/idle/ne/000.png';
import houndNW from '@assets/source/creatures/ruin-hound/body/idle/nw/000.png';
import houndS from '@assets/source/creatures/ruin-hound/body/idle/s/000.png';
import houndSE from '@assets/source/creatures/ruin-hound/body/idle/se/000.png';
import houndSW from '@assets/source/creatures/ruin-hound/body/idle/sw/000.png';
import houndW from '@assets/source/creatures/ruin-hound/body/idle/w/000.png';
import fragmentUrl from '@assets/source/items/fragments/ancient-fragment/000.png';
import { type Direction8, directionalFrameKey } from '@gameplay';

/** A texture to preload: a Phaser key and the bundled URL of its frame. */
export interface ArtFrame {
  readonly key: string;
  readonly url: string;
}

/** Texture key for the ancient-fragment item sprite. */
export const FRAGMENT_TEXTURE = 'art-fragment';
/** Base key for the ruin-hound directional static idle (suffixed by facing). */
export const HOUND_IDLE_BASE = 'art-hound-idle';
/** Base key for the ruin-hound directional run animation (suffixed by facing). */
export const HOUND_RUN_BASE = 'art-hound-run';
/** Frames per direction in the run animation. */
export const HOUND_RUN_FRAME_COUNT = 4;

/** Texture key for one run frame (e.g. ('sw', 2) -> 'art-hound-run-sw-2'). */
export function houndRunFrameKey(facing: Direction8, frame: number): string {
  return `${directionalFrameKey(HOUND_RUN_BASE, facing)}-${frame}`;
}

const HOUND_IDLE_URLS: Record<Direction8, string> = {
  n: houndN,
  ne: houndNE,
  e: houndE,
  se: houndSE,
  s: houndS,
  sw: houndSW,
  w: houndW,
  nw: houndNW,
};

// Run frames (8 directions x 4) live under body/run/<dir>/<nnn>.png. Loaded by
// glob so we don't hand-write 32 imports; the path yields the direction + index.
const RUN_MODULES = import.meta.glob<string>(
  '../assets/source/creatures/ruin-hound/body/run/*/*.png',
  { eager: true, query: '?url', import: 'default' },
);

function runFrames(): ArtFrame[] {
  const frames: ArtFrame[] = [];
  for (const [path, url] of Object.entries(RUN_MODULES)) {
    const match = /\/run\/([a-z]+)\/(\d+)\.png$/.exec(path);
    if (!match) {
      continue;
    }
    frames.push({ key: houndRunFrameKey(match[1] as Direction8, Number(match[2])), url });
  }
  return frames;
}

// --- Hunter sprites (PLAYER = bruno-dentes, TEST = eduardo-careca) ---------
// Both characters share the same body/{idle,run,punch}/<dir>/<nnn>.png layout
// as the hound, with full 8-direction punch coverage (see each metadata.json).
// Loaded entirely by glob (idle included) since 2 characters x 3 poses is too
// many hand imports.

/** Base key for the PLAYER (bruno-dentes) directional static idle. */
export const PLAYER_IDLE_BASE = 'art-player-idle';
/** Base key for the PLAYER directional run animation. */
export const PLAYER_RUN_BASE = 'art-player-run';
/** Base key for the PLAYER directional punch animation. */
export const PLAYER_PUNCH_BASE = 'art-player-punch';
/** Base key for the TEST Hunter (eduardo-careca) directional static idle. */
export const TEST_IDLE_BASE = 'art-test-idle';
/** Base key for the TEST Hunter directional run animation. */
export const TEST_RUN_BASE = 'art-test-run';
/** Base key for the TEST Hunter directional punch animation. */
export const TEST_PUNCH_BASE = 'art-test-punch';

/** Frames per direction in the run animation (both characters). */
export const RUN_FRAME_COUNT = 4;
/** Frames per direction in the punch animation (both characters). */
export const PUNCH_FRAME_COUNT = 6;

/** Directions with punch source art for the PLAYER Hunter. */
export const PLAYER_PUNCH_DIRS: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
/** Directions with punch source art for the TEST Hunter. */
export const TEST_PUNCH_DIRS: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/** Builds a `(facing, frame) -> texture key` function for an animation base. */
function frameKeyBuilder(base: string): (facing: Direction8, frame: number) => string {
  return (facing, frame) => `${directionalFrameKey(base, facing)}-${frame}`;
}

/** Texture key for one PLAYER run frame (e.g. ('sw', 2) -> 'art-player-run-sw-2'). */
export const playerRunFrameKey = frameKeyBuilder(PLAYER_RUN_BASE);
/** Texture key for one PLAYER punch frame. */
export const playerPunchFrameKey = frameKeyBuilder(PLAYER_PUNCH_BASE);
/** Texture key for one TEST Hunter run frame. */
export const testRunFrameKey = frameKeyBuilder(TEST_RUN_BASE);
/** Texture key for one TEST Hunter punch frame. */
export const testPunchFrameKey = frameKeyBuilder(TEST_PUNCH_BASE);

const PLAYER_IDLE_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/bruno-dentes/body/idle/*/000.png',
  { eager: true, query: '?url', import: 'default' },
);
const PLAYER_RUN_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/bruno-dentes/body/run/*/*.png',
  { eager: true, query: '?url', import: 'default' },
);
const PLAYER_PUNCH_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/bruno-dentes/body/punch/*/*.png',
  { eager: true, query: '?url', import: 'default' },
);
const TEST_IDLE_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/eduardo-careca/body/idle/*/000.png',
  { eager: true, query: '?url', import: 'default' },
);
const TEST_RUN_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/eduardo-careca/body/run/*/*.png',
  { eager: true, query: '?url', import: 'default' },
);
const TEST_PUNCH_MODULES = import.meta.glob<string>(
  '../assets/source/characters/hunter/eduardo-careca/body/punch/*/*.png',
  { eager: true, query: '?url', import: 'default' },
);

/** Builds idle ArtFrames from a `body/idle/<dir>/000.png` glob result. */
function idleFrames(modules: Record<string, string>, base: string): ArtFrame[] {
  const frames: ArtFrame[] = [];
  for (const [path, url] of Object.entries(modules)) {
    const match = /\/idle\/([a-z]+)\/\d+\.png$/.exec(path);
    if (!match) {
      continue;
    }
    frames.push({ key: directionalFrameKey(base, match[1] as Direction8), url });
  }
  return frames;
}

/** Builds run/punch ArtFrames from a `body/<pose>/<dir>/<nnn>.png` glob result. */
function animFrames(
  modules: Record<string, string>,
  pose: 'run' | 'punch',
  keyFor: (facing: Direction8, frame: number) => string,
): ArtFrame[] {
  const pattern = new RegExp(`/${pose}/([a-z]+)/(\\d+)\\.png$`);
  const frames: ArtFrame[] = [];
  for (const [path, url] of Object.entries(modules)) {
    const match = pattern.exec(path);
    if (!match) {
      continue;
    }
    frames.push({ key: keyFor(match[1] as Direction8, Number(match[2])), url });
  }
  return frames;
}

/** Geometry (from each metadata.json) for aligning real sprites to the feet pivot. */
export const FRAGMENT_ART = { canvas: { width: 32, height: 32 } } as const;
export const HOUND_ART = { canvas: { width: 68, height: 68 }, pivotY: 60 } as const;
export const PLAYER_ART = { canvas: { width: 68, height: 68 }, pivotY: 60 } as const;
export const TEST_ART = { canvas: { width: 68, height: 68 }, pivotY: 60 } as const;

/** Every real-art frame the scene preloads (texture key -> bundled URL). */
export const BENCHMARK_ART_FRAMES: readonly ArtFrame[] = [
  { key: FRAGMENT_TEXTURE, url: fragmentUrl },
  ...(Object.keys(HOUND_IDLE_URLS) as Direction8[]).map((facing) => ({
    key: directionalFrameKey(HOUND_IDLE_BASE, facing),
    url: HOUND_IDLE_URLS[facing],
  })),
  ...runFrames(),
  ...idleFrames(PLAYER_IDLE_MODULES, PLAYER_IDLE_BASE),
  ...animFrames(PLAYER_RUN_MODULES, 'run', playerRunFrameKey),
  ...animFrames(PLAYER_PUNCH_MODULES, 'punch', playerPunchFrameKey),
  ...idleFrames(TEST_IDLE_MODULES, TEST_IDLE_BASE),
  ...animFrames(TEST_RUN_MODULES, 'run', testRunFrameKey),
  ...animFrames(TEST_PUNCH_MODULES, 'punch', testPunchFrameKey),
];
