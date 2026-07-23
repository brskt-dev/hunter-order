import { describe, expect, it } from 'vitest';

import {
  activeBlockingRects,
  clearInteractable,
  findInteractTarget,
  type Interactable,
} from './interaction';
import { vec2 } from './vec2';

const make = (
  id: string,
  x: number,
  y: number,
  overrides: Partial<Interactable> = {},
): Interactable => ({
  id,
  kind: 'overgrowth',
  bounds: { x, y, width: 48, height: 48 },
  blocksWhileActive: true,
  state: 'active',
  ...overrides,
});

describe('findInteractTarget', () => {
  it('returns an active target within range (distance to the nearest edge)', () => {
    const it0 = make('a', 100, 100); // edges x[100,148]
    // hunter 20px left of the left edge -> distance 20
    expect(findInteractTarget(vec2(80, 124), [it0], 40)?.id).toBe('a');
  });

  it('returns null when the nearest target is out of range', () => {
    const it0 = make('a', 100, 100);
    expect(findInteractTarget(vec2(40, 124), [it0], 40)).toBeNull(); // distance 60 > 40
  });

  it('picks the nearest target among several in range', () => {
    const near = make('near', 100, 100); // left edge at 100
    const far = make('far', 130, 100); // left edge at 130
    expect(findInteractTarget(vec2(90, 124), [far, near], 40)?.id).toBe('near');
  });

  it('ignores cleared targets', () => {
    const cleared = make('a', 100, 100, { state: 'cleared' });
    expect(findInteractTarget(vec2(90, 124), [cleared], 40)).toBeNull();
  });

  it('breaks ties deterministically by id', () => {
    const b = make('b', 100, 100);
    const a = make('a', 100, 100); // identical distance
    expect(findInteractTarget(vec2(90, 124), [b, a], 40)?.id).toBe('a');
  });

  it('counts a point inside the bounds as distance zero (in range)', () => {
    const it0 = make('a', 100, 100);
    expect(findInteractTarget(vec2(120, 120), [it0], 1)?.id).toBe('a');
  });
});

describe('activeBlockingRects', () => {
  it('returns bounds of active, blocking interactables only', () => {
    const list = [
      make('block', 100, 100, { blocksWhileActive: true, state: 'active' }),
      make('cleared', 200, 100, { blocksWhileActive: true, state: 'cleared' }),
      make('passable', 300, 100, { blocksWhileActive: false, state: 'active' }),
    ];
    expect(activeBlockingRects(list)).toEqual([{ x: 100, y: 100, width: 48, height: 48 }]);
  });
});

describe('clearInteractable', () => {
  it('marks the matching active interactable as cleared', () => {
    const list = [make('a', 100, 100), make('b', 200, 100)];
    const next = clearInteractable(list, 'a');
    expect(next.find((i) => i.id === 'a')?.state).toBe('cleared');
    expect(next.find((i) => i.id === 'b')?.state).toBe('active');
  });

  it('does not mutate the input list', () => {
    const list = [make('a', 100, 100)];
    clearInteractable(list, 'a');
    expect(list[0]?.state).toBe('active');
  });

  it('is a no-op for an unknown or already-cleared id', () => {
    const list = [make('a', 100, 100, { state: 'cleared' })];
    expect(clearInteractable(list, 'missing')).toEqual(list);
    expect(clearInteractable(list, 'a')).toEqual(list);
  });
});
