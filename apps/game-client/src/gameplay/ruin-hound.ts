// ============================================================================
// BENCHMARK-ONLY, NON-AUTHORITATIVE ruin-hound AI stub.
//
// A deliberately small finite-state behaviour for the medium "ruin hound" threat
// in the greybox: patrol a short path, notice the Hunter within an aggro radius,
// chase, and give up / return home once the Hunter escapes past a larger de-aggro
// radius (hysteresis, so the state does not rapidly toggle at the boundary).
//
// This is a STUB, not the final AI or combat model (both are Level C / non-goals
// per the benchmark doc): no pathfinding, no attacks, no damage model. It reuses
// the same Phaser-free movement + collision primitives as the Hunter, so the
// server can later own creature simulation without discarding this slice.
// ============================================================================

import { resolveMovement } from './collision';
import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import { stepPosition } from './movement';
import { length, normalize, type Vec2 } from './vec2';
import type { TileWorld } from './world';

export type HoundMode = 'patrol' | 'chase' | 'return';

export interface HoundState {
  readonly position: Vec2;
  readonly facing: Direction8;
  readonly mode: HoundMode;
  /** Patrol waypoint the hound is currently heading toward. */
  readonly waypointIndex: number;
}

/** Benchmark-only tunables (temporary values; see core/config/benchmark.ts). */
export interface RuinHoundConfig {
  /** World units per second. */
  readonly speed: number;
  /** Circular footprint radius in world units. */
  readonly footprintRadius: number;
  /** Patrol path in world pixels; index 0 is treated as home for `return`. */
  readonly waypoints: readonly Vec2[];
  /** At/under this distance to the Hunter, patrol|return → chase. */
  readonly aggroRadius: number;
  /** At/over this distance to the Hunter, chase → return (must be > aggroRadius). */
  readonly deAggroRadius: number;
  /** At/under this distance to the Hunter, the hound is "in contact". */
  readonly contactRadius: number;
  /** How close (world px) counts as having reached a waypoint/home. */
  readonly arriveEpsilon: number;
}

const ZERO_INTENT: Vec2 = { x: 0, y: 0 };

/** Initial state: at home (waypoint 0), patrolling toward the next waypoint. */
export function createHoundState(config: RuinHoundConfig): HoundState {
  const home = config.waypoints[0] ?? { x: 0, y: 0 };
  return {
    position: home,
    facing: DEFAULT_FACING,
    mode: 'patrol',
    waypointIndex: config.waypoints.length > 1 ? 1 : 0,
  };
}

/** True when the Hunter is within the hound's contact radius. */
export function houndInContact(state: HoundState, hunterPos: Vec2, config: RuinHoundConfig): boolean {
  return distance(state.position, hunterPos) <= config.contactRadius;
}

/**
 * Advances the hound one step: resolve the mode transition (with hysteresis),
 * pick a target, move toward it (colliding with the same world solids/bounds as
 * the Hunter) and update facing. Pure — never mutates the input state.
 */
export function stepHound(
  state: HoundState,
  hunterPos: Vec2,
  dtSeconds: number,
  world: TileWorld,
  config: RuinHoundConfig,
): HoundState {
  const distToHunter = distance(state.position, hunterPos);

  let mode: HoundMode = state.mode;
  if (mode === 'chase') {
    if (distToHunter >= config.deAggroRadius) {
      mode = 'return';
    }
  } else if (distToHunter <= config.aggroRadius) {
    mode = 'chase';
  }

  const home = config.waypoints[0] ?? state.position;
  let waypointIndex = state.waypointIndex;
  let target: Vec2;

  if (mode === 'chase') {
    target = hunterPos;
  } else if (mode === 'return') {
    if (reached(state.position, home, config.arriveEpsilon)) {
      // Back home: resume patrol toward the next waypoint.
      mode = 'patrol';
      waypointIndex = config.waypoints.length > 1 ? 1 : 0;
      target = config.waypoints[waypointIndex] ?? home;
    } else {
      target = home;
    }
  } else {
    // patrol
    target = config.waypoints[waypointIndex] ?? state.position;
    if (reached(state.position, target, config.arriveEpsilon)) {
      waypointIndex = (waypointIndex + 1) % Math.max(1, config.waypoints.length);
      target = config.waypoints[waypointIndex] ?? state.position;
    }
  }

  const toTarget = { x: target.x - state.position.x, y: target.y - state.position.y };
  const intent = length(toTarget) > 1e-6 ? normalize(toTarget) : ZERO_INTENT;
  const desired = stepPosition(state.position, intent, config.speed, dtSeconds);
  const position = resolveMovement(
    state.position,
    desired,
    config.footprintRadius,
    world.solids,
    world.bounds,
  );
  return { position, facing: directionFromVector(intent, state.facing), mode, waypointIndex };
}

function distance(a: Vec2, b: Vec2): number {
  return length({ x: a.x - b.x, y: a.y - b.y });
}

function reached(from: Vec2, to: Vec2, epsilon: number): boolean {
  return distance(from, to) <= epsilon;
}
