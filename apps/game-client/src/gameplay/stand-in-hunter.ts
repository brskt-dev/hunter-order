// BENCHMARK TEST-ONLY, non-authoritative: a simple stand-in "other player" Hunter for
// the combat test-bed (GD-0006). Wanders deterministically; retaliates — chases the
// player and punches (visual/timer effect only, no damage model; see
// BenchmarkSimulation.standInStruck) — while a mutual combat is active. Reuses the
// same movement + collision primitives as the Hunter, so the server can later own
// real PvP without discarding this slice.

import { resolveMovement } from './collision';
import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import { stepPosition } from './movement';
import { length, normalize, type Vec2 } from './vec2';
import type { TileWorld } from './world';

export interface StandInHunterState {
  readonly position: Vec2;
  readonly facing: Direction8;
  readonly wanderPhase: number;
}

export interface StandInHunterConfig {
  readonly speed: number;
  readonly footprintRadius: number;
  readonly wanderTurnRate: number;
  readonly combatSpeedMultiplier: number;
}

export function createStandInHunter(spawn: Vec2): StandInHunterState {
  return { position: spawn, facing: DEFAULT_FACING, wanderPhase: 0 };
}

/**
 * Advances the stand-in Hunter one step. Not in combat: wanders in a slowly
 * rotating heading (`wanderPhase`) — deterministic, no RNG, so it is testable.
 * In combat: retaliates — chases directly toward the player at
 * `combatSpeedMultiplier` x `speed` (GD-0006 stub; the sim layer resolves
 * whether it is close enough to land a "punch", a visual/timer effect only,
 * no damage model). Collides with the same world solids/bounds as the
 * Hunter. Pure — never mutates the input state.
 */
export function stepStandInHunter(
  state: StandInHunterState,
  playerPos: Vec2,
  inCombat: boolean,
  dtSeconds: number,
  world: TileWorld,
  config: StandInHunterConfig,
): StandInHunterState {
  const wanderPhase = state.wanderPhase + config.wanderTurnRate * dtSeconds;
  let intent: Vec2;
  let speed = config.speed;
  if (inCombat) {
    const toward = { x: playerPos.x - state.position.x, y: playerPos.y - state.position.y };
    intent = length(toward) > 1e-6 ? normalize(toward) : { x: 1, y: 0 };
    speed = config.speed * config.combatSpeedMultiplier;
  } else {
    intent = { x: Math.cos(wanderPhase), y: Math.sin(wanderPhase) };
  }
  const desired = stepPosition(state.position, intent, speed, dtSeconds);
  const position = resolveMovement(state.position, desired, config.footprintRadius, world.solids, world.bounds);
  return { position, facing: directionFromVector(intent, state.facing), wanderPhase };
}
