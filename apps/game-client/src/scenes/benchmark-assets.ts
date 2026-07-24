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
/** Base key for the ruin-hound directional idle (suffixed by facing). */
export const HOUND_IDLE_BASE = 'art-hound-idle';

const HOUND_URLS: Record<Direction8, string> = {
  n: houndN,
  ne: houndNE,
  e: houndE,
  se: houndSE,
  s: houndS,
  sw: houndSW,
  w: houndW,
  nw: houndNW,
};

/** Geometry (from each metadata.json) for aligning real sprites to the feet pivot. */
export const FRAGMENT_ART = { canvas: { width: 32, height: 32 } } as const;
export const HOUND_ART = { canvas: { width: 68, height: 68 }, pivotY: 60 } as const;

/** Every real-art frame the scene preloads (texture key -> bundled URL). */
export const BENCHMARK_ART_FRAMES: readonly ArtFrame[] = [
  { key: FRAGMENT_TEXTURE, url: fragmentUrl },
  ...(Object.keys(HOUND_URLS) as Direction8[]).map((facing) => ({
    key: directionalFrameKey(HOUND_IDLE_BASE, facing),
    url: HOUND_URLS[facing],
  })),
];
