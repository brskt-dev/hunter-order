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

/** Geometry (from each metadata.json) for aligning real sprites to the feet pivot. */
export const FRAGMENT_ART = { canvas: { width: 32, height: 32 } } as const;
export const HOUND_ART = { canvas: { width: 68, height: 68 }, pivotY: 60 } as const;

/** Every real-art frame the scene preloads (texture key -> bundled URL). */
export const BENCHMARK_ART_FRAMES: readonly ArtFrame[] = [
  { key: FRAGMENT_TEXTURE, url: fragmentUrl },
  ...(Object.keys(HOUND_IDLE_URLS) as Direction8[]).map((facing) => ({
    key: directionalFrameKey(HOUND_IDLE_BASE, facing),
    url: HOUND_IDLE_URLS[facing],
  })),
  ...runFrames(),
];
