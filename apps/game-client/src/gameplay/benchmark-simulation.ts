// ============================================================================
// BENCHMARK-ONLY, NON-AUTHORITATIVE client-side simulation.
//
// This composes the (Phaser-free) movement + interaction primitives into a
// single step for the greybox. It exists ONLY to make the first playable loop
// demonstrable before a realtime client<->server transport exists. Per ADR-0002
// / GD-0004 the server is the final authority over position, speed, collision
// and interaction; that transport requires its own ADR and is intentionally NOT
// implemented here.
//
// Do NOT treat this as the final authority, persist its output, or build
// public/competitive contracts on it. It is structured so authority can later
// move to the server without discarding the slice: it consumes semantic actions
// (commands) and produces new state (a snapshot), with no Phaser or transport
// coupling.
// ============================================================================

import { resolveMovement } from './collision';
import { DEFAULT_FACING, type Direction8, directionFromVector } from './direction';
import {
  activeBlockingRects,
  clearInteractable,
  findInteractTarget,
  type Interactable,
} from './interaction';
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
  /** Max distance (world units) at which an obstruction can be interacted with. */
  readonly interactRange: number;
}

/**
 * Pure movement step: intent -> integrate -> collide -> face. Returns a new
 * state; never mutates the input. `world.solids` should already include any
 * dynamic obstructions the caller wants treated as solid this frame.
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
 * state and the world obstructions; `update` advances movement (obstructions
 * that still block are treated as solids), `tryInteract` clears the in-range
 * target, `reset` returns to the spawn state.
 */
export class BenchmarkSimulation {
  private state: HunterState;
  private readonly seed: readonly Interactable[];
  private interactableList: Interactable[];
  private currentTarget: Interactable | null = null;

  constructor(
    private readonly world: TileWorld,
    private readonly config: HunterSimConfig,
    interactables: readonly Interactable[] = [],
  ) {
    this.seed = interactables;
    this.interactableList = interactables.map((it) => ({ ...it }));
    this.state = BenchmarkSimulation.spawnState(world);
    this.recomputeTarget();
  }

  get hunter(): HunterState {
    return this.state;
  }

  get interactables(): readonly Interactable[] {
    return this.interactableList;
  }

  /** The obstruction currently in interaction range, or null. */
  get target(): Interactable | null {
    return this.currentTarget;
  }

  update(actions: ReadonlySet<MovementAction>, dtSeconds: number): void {
    const solids = [...this.world.solids, ...activeBlockingRects(this.interactableList)];
    const world: TileWorld = { ...this.world, solids };
    this.state = stepHunter(this.state, actions, dtSeconds, world, this.config);
    this.recomputeTarget();
  }

  /**
   * Clears the current in-range target if there is one. Returns the cleared
   * interactable (single-fire — a second call with no fresh target is a no-op).
   */
  tryInteract(): Interactable | null {
    const target = this.currentTarget;
    if (!target) {
      return null;
    }
    this.interactableList = clearInteractable(this.interactableList, target.id);
    this.recomputeTarget();
    return { ...target, state: 'cleared' };
  }

  reset(): void {
    this.interactableList = this.seed.map((it) => ({ ...it }));
    this.state = BenchmarkSimulation.spawnState(this.world);
    this.recomputeTarget();
  }

  private recomputeTarget(): void {
    this.currentTarget = findInteractTarget(
      this.state.position,
      this.interactableList,
      this.config.interactRange,
    );
  }

  private static spawnState(world: TileWorld): HunterState {
    return { position: world.spawn, facing: DEFAULT_FACING };
  }
}
