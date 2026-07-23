// ============================================================================
// BENCHMARK-ONLY, NON-AUTHORITATIVE client-side simulation.
//
// This composes the (Phaser-free) movement primitives into a single step for
// the greybox. It exists ONLY to make the first playable loop demonstrable
// before a realtime client<->server transport exists. Per ADR-0002 / GD-0004
// the server is the final authority over position, speed and collision; that
// transport requires its own ADR and is intentionally NOT implemented here.
//
// Do NOT treat this as the final movement authority, persist its output, or
// build public/competitive contracts on it. It is structured so authority can
// later move to the server without discarding the slice: it consumes a semantic
// action set (a command) and produces a new state (a snapshot), with no Phaser
// or transport coupling.
// ============================================================================

import { resolveMovement } from './collision';
import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import { stepPosition } from './movement';
import { intentFromActions, type MovementAction } from './movement-intent';
import type { Vec2 } from './vec2';
import type { TileWorld } from './world';

export interface HunterState {
  readonly position: Vec2;
  readonly facing: Direction8;
}

/** Benchmark-only tunables (temporary values; see core/config/benchmark.ts). */
export interface HunterSimConfig {
  /** World units per second. */
  readonly speed: number;
  /** Circular footprint radius in world units. */
  readonly footprintRadius: number;
}

/**
 * Pure movement step: intent -> integrate -> collide -> face. Returns a new
 * state; never mutates the input.
 */
export function stepHunter(
  state: HunterState,
  actions: ReadonlySet<MovementAction>,
  dtSeconds: number,
  world: TileWorld,
  config: HunterSimConfig,
): HunterState {
  const intent = intentFromActions(actions);
  const desired = stepPosition(state.position, intent, config.speed, dtSeconds);
  const position = resolveMovement(
    state.position,
    desired,
    config.footprintRadius,
    world.solids,
    world.bounds,
  );
  return { position, facing: directionFromVector(intent, state.facing) };
}

/**
 * Thin stateful wrapper the scene drives each frame. Holds the current Hunter
 * state; `update` advances it, `reset` returns to the spawn state.
 */
export class BenchmarkSimulation {
  private state: HunterState;

  constructor(
    private readonly world: TileWorld,
    private readonly config: HunterSimConfig,
  ) {
    this.state = BenchmarkSimulation.spawnState(world);
  }

  get hunter(): HunterState {
    return this.state;
  }

  update(actions: ReadonlySet<MovementAction>, dtSeconds: number): void {
    this.state = stepHunter(this.state, actions, dtSeconds, this.world, this.config);
  }

  reset(): void {
    this.state = BenchmarkSimulation.spawnState(this.world);
  }

  private static spawnState(world: TileWorld): HunterState {
    return { position: world.spawn, facing: DEFAULT_FACING };
  }
}
