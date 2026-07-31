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

export type HoundMode = 'patrol' | 'chase' | 'return' | 'flee';

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
  /** Speed multiplier while fleeing; defaults to 1.3 when omitted. */
  readonly fleeSpeedMultiplier?: number;
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
 * Marks a hound as defeated: it enters the terminal `flee` mode and runs off
 * (the benchmark's "downed → vanish", GD-0007). The caller (sim) decides WHEN a
 * hound is defeated, from HP. Pure.
 */
export function defeatHound(state: HoundState): HoundState {
  return { ...state, mode: 'flee' };
}

/**
 * True when the hound is within `range` and inside the Hunter's facing arc
 * (`arcCos` is the cosine of the half-arc; e.g. 0.5 ≈ a 120° cone). `facingVec`
 * must be unit-length. A hound on top of the Hunter always connects. Within
 * `pointBlankRange` (default 0, i.e. disabled) the hound connects regardless of
 * facing — a soft tolerance for the case where the Hunter and hound are pressed
 * together during combat (GD-0006).
 */
export function houndInAttackReach(
  state: HoundState,
  hunterPos: Vec2,
  facingVec: Vec2,
  range: number,
  arcCos: number,
  pointBlankRange = 0,
): boolean {
  const to = { x: state.position.x - hunterPos.x, y: state.position.y - hunterPos.y };
  const dist = length(to);
  if (dist > range) {
    return false;
  }
  if (dist <= pointBlankRange || dist < 1e-6) {
    return true;
  }
  const dir = normalize(to);
  return dir.x * facingVec.x + dir.y * facingVec.y >= arcCos;
}

/**
 * Circumstantial combat collision (GD-0006): resolve a hound overlapping the Hunter
 * to a soft, non-stacking standoff. Returns the hound position pushed OUT to
 * `minDistance` from the Hunter along the current separation direction; a hound
 * already at/beyond `minDistance` is returned unchanged (only pushes out, never in).
 * Pure. The caller decides when this applies (only while in combat) and re-resolves
 * the result against world solids.
 */
export function combatSeparation(houndPos: Vec2, hunterPos: Vec2, minDistance: number): Vec2 {
  const away = { x: houndPos.x - hunterPos.x, y: houndPos.y - hunterPos.y };
  const d = length(away);
  if (d >= minDistance) {
    return houndPos;
  }
  if (d < 1e-6) {
    return { x: hunterPos.x + minDistance, y: hunterPos.y };
  }
  const scale = minDistance / d;
  return { x: hunterPos.x + away.x * scale, y: hunterPos.y + away.y * scale };
}

/**
 * Symmetric soft push-apart for two engaged bodies (GD-0006 creature↔creature): each
 * is moved half the overlap along their shared centre line, so neither acts as a hard
 * wall and the outcome is order-independent. A pair already at/beyond `minDistance` is
 * returned unchanged (same references). Pure; caller re-resolves against world solids.
 */
export function separatePairSymmetric(a: Vec2, b: Vec2, minDistance: number): [Vec2, Vec2] {
  const delta = { x: a.x - b.x, y: a.y - b.y };
  const d = length(delta);
  if (d >= minDistance) {
    return [a, b];
  }
  const dir = d < 1e-6 ? { x: 1, y: 0 } : normalize(delta);
  const push = (minDistance - d) / 2;
  return [
    { x: a.x + dir.x * push, y: a.y + dir.y * push },
    { x: b.x - dir.x * push, y: b.y - dir.y * push },
  ];
}

/** The nearest point in `points` to `from`, or null when `points` is empty. Pure. */
export function nearestOf(from: Vec2, points: readonly Vec2[]): Vec2 | null {
  let best: Vec2 | null = null;
  let bestD = Infinity;
  for (const p of points) {
    const d = (p.x - from.x) ** 2 + (p.y - from.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
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

  // `flee` is terminal: once driven off, the hound never re-engages this encounter.
  let mode: HoundMode = state.mode;
  if (mode !== 'flee') {
    if (mode === 'chase') {
      if (distToHunter >= config.deAggroRadius) {
        mode = 'return';
      }
    } else if (distToHunter <= config.aggroRadius) {
      mode = 'chase';
    }
  }

  const home = config.waypoints[0] ?? state.position;
  let waypointIndex = state.waypointIndex;
  let target: Vec2;

  if (mode === 'flee') {
    // Run directly away from the Hunter.
    const away = { x: state.position.x - hunterPos.x, y: state.position.y - hunterPos.y };
    const dir = length(away) > 1e-6 ? normalize(away) : ZERO_INTENT;
    target = { x: state.position.x + dir.x * 1000, y: state.position.y + dir.y * 1000 };
  } else if (mode === 'chase') {
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

  const speed = mode === 'flee' ? config.speed * (config.fleeSpeedMultiplier ?? 1.3) : config.speed;
  const toTarget = { x: target.x - state.position.x, y: target.y - state.position.y };
  const intent = length(toTarget) > 1e-6 ? normalize(toTarget) : ZERO_INTENT;
  const desired = stepPosition(state.position, intent, speed, dtSeconds);
  const position = resolveMovement(
    state.position,
    desired,
    config.footprintRadius,
    world.solids,
    world.bounds,
  );
  return {
    position,
    facing: directionFromVector(intent, state.facing),
    mode,
    waypointIndex,
  };
}

function distance(a: Vec2, b: Vec2): number {
  return length({ x: a.x - b.x, y: a.y - b.y });
}

function reached(from: Vec2, to: Vec2, epsilon: number): boolean {
  return distance(from, to) <= epsilon;
}
