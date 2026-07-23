/**
 * Central registry of scene keys. Referencing scenes through these constants
 * avoids magic strings and keeps transitions type-checked.
 */
export const SceneKeys = {
  Boot: 'boot',
  Benchmark: 'benchmark',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
