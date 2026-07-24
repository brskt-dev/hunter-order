import { describe, expect, it } from 'vitest';

import { movementActionsFromCodes } from './keyboard-input';

const set = (...codes: string[]): ReadonlySet<string> => new Set(codes);

describe('movementActionsFromCodes', () => {
  it('maps WASD physical codes to movement actions', () => {
    expect([...movementActionsFromCodes(set('KeyW'))]).toEqual(['move-north']);
    expect([...movementActionsFromCodes(set('KeyS'))]).toEqual(['move-south']);
    expect([...movementActionsFromCodes(set('KeyA'))]).toEqual(['move-west']);
    expect([...movementActionsFromCodes(set('KeyD'))]).toEqual(['move-east']);
  });

  it('maps arrow codes to the same actions (layout-independent physical keys)', () => {
    expect([...movementActionsFromCodes(set('ArrowUp'))]).toEqual(['move-north']);
    expect([...movementActionsFromCodes(set('ArrowDown'))]).toEqual(['move-south']);
    expect([...movementActionsFromCodes(set('ArrowLeft'))]).toEqual(['move-west']);
    expect([...movementActionsFromCodes(set('ArrowRight'))]).toEqual(['move-east']);
  });

  it('combines multiple keys and de-duplicates equivalent bindings', () => {
    expect(movementActionsFromCodes(set('KeyW', 'KeyD'))).toEqual(
      new Set(['move-north', 'move-east']),
    );
    expect(movementActionsFromCodes(set('KeyW', 'ArrowUp'))).toEqual(new Set(['move-north']));
  });

  it('ignores non-movement and unknown codes', () => {
    expect(movementActionsFromCodes(set()).size).toBe(0);
    expect(movementActionsFromCodes(set('KeyE', 'KeyR', 'KeyZ', 'Space')).size).toBe(0);
  });
});
