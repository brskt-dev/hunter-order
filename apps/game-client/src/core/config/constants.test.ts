import { describe, expect, it } from 'vitest';

import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './constants';

describe('game constants', () => {
  it('defines a positive base resolution', () => {
    expect(GAME_WIDTH).toBeGreaterThan(0);
    expect(GAME_HEIGHT).toBeGreaterThan(0);
  });

  it('uses a 16:9 base resolution', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBeCloseTo(16 / 9);
  });

  it('defines colors as hex values', () => {
    for (const value of Object.values(COLORS)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
