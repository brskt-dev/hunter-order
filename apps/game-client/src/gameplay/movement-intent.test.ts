import { describe, expect, it } from 'vitest';

import { intentFromActions, type MovementAction } from './movement-intent';
import { length } from './vec2';

const set = (...actions: MovementAction[]): ReadonlySet<MovementAction> => new Set(actions);

describe('intentFromActions', () => {
  it('produces zero intent when no action is active', () => {
    expect(intentFromActions(set())).toEqual({ x: 0, y: 0 });
  });

  it('maps cardinal actions (screen-space: south is +y)', () => {
    expect(intentFromActions(set('move-east'))).toEqual({ x: 1, y: 0 });
    expect(intentFromActions(set('move-west'))).toEqual({ x: -1, y: 0 });
    expect(intentFromActions(set('move-north'))).toEqual({ x: 0, y: -1 });
    expect(intentFromActions(set('move-south'))).toEqual({ x: 0, y: 1 });
  });

  it('normalizes diagonals so they are not faster than cardinals', () => {
    const diagonal = intentFromActions(set('move-east', 'move-south'));
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2);
    expect(diagonal.y).toBeCloseTo(Math.SQRT1_2);
    expect(length(diagonal)).toBeCloseTo(1);
  });

  it('cancels opposing actions on the same axis', () => {
    expect(intentFromActions(set('move-east', 'move-west'))).toEqual({ x: 0, y: 0 });
    expect(intentFromActions(set('move-north', 'move-south'))).toEqual({ x: 0, y: 0 });
    expect(intentFromActions(set('move-north', 'move-south', 'move-east'))).toEqual({ x: 1, y: 0 });
  });

  it('yields unit magnitude for every non-idle combination', () => {
    expect(length(intentFromActions(set('move-north')))).toBeCloseTo(1);
    expect(length(intentFromActions(set('move-north', 'move-west')))).toBeCloseTo(1);
    expect(length(intentFromActions(set('move-south', 'move-east')))).toBeCloseTo(1);
  });

  it('produces zero intent when all four actions are held', () => {
    expect(intentFromActions(set('move-north', 'move-south', 'move-east', 'move-west'))).toEqual({
      x: 0,
      y: 0,
    });
  });
});
