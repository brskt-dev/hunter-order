// Maps physical keyboard codes (KeyboardEvent.code) to semantic movement
// actions. Using `code` (physical position) keeps controls layout-independent,
// and the scene reads these from a capture-phase window listener so input is not
// affected by other handlers/extensions that preventDefault key events before
// Phaser's own (bubble-phase) keyboard handler would see them.

import type { MovementAction } from './movement-intent';

/** Physical key code -> movement action. WASD and arrows are equivalent. */
export const MOVEMENT_KEY_CODES: Readonly<Record<string, MovementAction>> = {
  KeyW: 'move-north',
  ArrowUp: 'move-north',
  KeyS: 'move-south',
  ArrowDown: 'move-south',
  KeyA: 'move-west',
  ArrowLeft: 'move-west',
  KeyD: 'move-east',
  ArrowRight: 'move-east',
};

/** Builds the set of active movement actions from the currently-pressed codes. */
export function movementActionsFromCodes(pressed: ReadonlySet<string>): Set<MovementAction> {
  const actions = new Set<MovementAction>();
  for (const code of pressed) {
    const action = MOVEMENT_KEY_CODES[code];
    if (action) {
      actions.add(action);
    }
  }
  return actions;
}
