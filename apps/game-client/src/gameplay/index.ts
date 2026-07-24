// Public surface of the Phaser-free gameplay core. All modules here are pure
// TypeScript (no Phaser import), unit-tested under the node environment, and
// implement the approved movement/collision/camera rules (GD-0004). The scene
// layer composes these behind a thin Phaser adapter.

export {
  type AttackResult,
  BenchmarkSimulation,
  type CollectedItem,
  type HunterSimConfig,
  type HunterState,
  stepHunter,
} from './benchmark-simulation';
export { lookAheadTarget, smoothTowards } from './camera';
export type { Rect } from './collision';
export { resolveMovement } from './collision';
export type { Direction8 } from './direction';
export { DEFAULT_FACING, directionFromVector, directionToVector } from './direction';
export {
  activeBlockingRects,
  clearInteractable,
  distanceToBounds,
  findInteractTarget,
  type Interactable,
  type InteractableState,
} from './interaction';
export { MOVEMENT_KEY_CODES, movementActionsFromCodes } from './keyboard-input';
export { clampDeltaSeconds, stepPosition } from './movement';
export type { MovementAction } from './movement-intent';
export { intentFromActions } from './movement-intent';
export {
  createHoundState,
  houndInAttackReach,
  houndInContact,
  type HoundMode,
  type HoundState,
  registerHoundHit,
  type RuinHoundConfig,
  stepHound,
} from './ruin-hound';
export type { Vec2 } from './vec2';
export { add, length, lerp, normalize, scale, vec2, ZERO } from './vec2';
export type { TileRect, TileWorld, TileWorldSpec } from './world';
export { createTileWorld, tileCentre } from './world';
