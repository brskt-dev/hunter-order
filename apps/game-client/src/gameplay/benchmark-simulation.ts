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
import {
  DEFAULT_FACING,
  type Direction8,
  directionFromVector,
  directionToVector,
} from './direction';
import {
  activeBlockingRects,
  clearInteractable,
  findInteractTarget,
  type Interactable,
} from './interaction';
import { stepPosition } from './movement';
import { intentFromActions, type MovementAction } from './movement-intent';
import {
  combatSeparation,
  createHoundState,
  houndInAttackReach,
  houndInContact,
  type HoundState,
  registerHoundHit,
  type RuinHoundConfig,
  stepHound,
} from './ruin-hound';
import type { Vec2 } from './vec2';
import type { TileWorld } from './world';

export interface HunterState {
  readonly position: Vec2;
  readonly facing: Direction8;
}

/**
 * A benchmark-only, NON-AUTHORITATIVE record of something the Hunter has picked
 * up. This is a placeholder pickup log, not an inventory system: it records only
 * that an item was collected (its id and placeholder kind), with no counts,
 * stacking, identification or persistence. The server remains the authority over
 * real inventory (a future concern; see the module header).
 */
export interface CollectedItem {
  readonly id: string;
  readonly kind: string;
}

/** Benchmark-only tunables (temporary values; see core/config/benchmark.ts). */
export interface HunterSimConfig {
  /** World units per second. */
  readonly speed: number;
  /** Circular footprint radius in world units. */
  readonly footprintRadius: number;
  /** Max distance (world units) at which an obstruction can be interacted with. */
  readonly interactRange: number;
  /** Melee reach (world units) of the hand-axe attack. */
  readonly attackRange: number;
  /** Cosine of the attack half-arc (e.g. 0.5 ≈ a 120° cone in front of facing). */
  readonly attackArcCos: number;
  /** Minimum time (seconds) between axe swings. */
  readonly attackCooldownSeconds: number;
  /** Within this distance, an axe swing connects regardless of facing (GD-0006). */
  readonly pointBlankRange: number;
}

/** Outcome of an axe swing (benchmark stub — no damage model). */
export interface AttackResult {
  /** The swing actually happened (false when still on cooldown). */
  readonly swung: boolean;
  /** The swing connected with the hound. */
  readonly hit: boolean;
  /** This hit drove the hound off (transition into flee). */
  readonly repelled: boolean;
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
  private collectedList: CollectedItem[] = [];
  private houndState: HoundState | null;
  private attackCooldown = 0;

  constructor(
    private readonly world: TileWorld,
    private readonly config: HunterSimConfig,
    interactables: readonly Interactable[] = [],
    private readonly houndConfig: RuinHoundConfig | null = null,
  ) {
    this.seed = interactables;
    this.interactableList = interactables.map((it) => ({ ...it }));
    this.state = BenchmarkSimulation.spawnState(world);
    this.houndState = houndConfig ? createHoundState(houndConfig) : null;
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

  /** Benchmark-only pickup log of items the Hunter has collected, in order. */
  get collected(): readonly CollectedItem[] {
    return this.collectedList;
  }

  /** The ruin hound's current state, or null when no hound is configured. */
  get hound(): HoundState | null {
    return this.houndState;
  }

  /** True while the hound is actively chasing the Hunter (drives combat camera). */
  get threatEngaged(): boolean {
    return this.houndState?.mode === 'chase';
  }

  /** True while the hound is in contact with the Hunter (a benchmark danger state). */
  get inDanger(): boolean {
    return (
      this.houndState !== null &&
      this.houndConfig !== null &&
      houndInContact(this.houndState, this.state.position, this.houndConfig)
    );
  }

  update(actions: ReadonlySet<MovementAction>, dtSeconds: number): void {
    const solids = [...this.world.solids, ...activeBlockingRects(this.interactableList)];
    const world: TileWorld = { ...this.world, solids };
    this.state = stepHunter(this.state, actions, dtSeconds, world, this.config);
    // The hound chases the Hunter's updated position and collides with the static
    // world only (it ignores clearable obstructions — a deliberate stub simplification).
    if (this.houndState && this.houndConfig) {
      let hound = stepHound(
        this.houndState,
        this.state.position,
        dtSeconds,
        this.world,
        this.houndConfig,
      );
      // GD-0006: while engaged (in combat), the hound and Hunter collide via a soft
      // push-apart so the hound holds at biting distance instead of stacking on the
      // Hunter's centre. Benchmark scope: only the hound is displaced (the player keeps
      // authority over its own position); out of combat there is no separation.
      if (hound.mode === 'chase') {
        const minDistance = this.houndConfig.footprintRadius + this.config.footprintRadius;
        const separated = combatSeparation(hound.position, this.state.position, minDistance);
        if (separated !== hound.position) {
          const position = resolveMovement(
            hound.position,
            separated,
            this.houndConfig.footprintRadius,
            this.world.solids,
            this.world.bounds,
          );
          hound = { ...hound, position };
        }
      }
      this.houndState = hound;
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - dtSeconds);
    this.recomputeTarget();
  }

  /**
   * Acts on the current in-range target if there is one. An obstruction is
   * cleared (opening the passage); a collectible is additionally recorded in the
   * possession log. Returns the resolved interactable (single-fire — a second
   * call with no fresh target is a no-op).
   */
  tryInteract(): Interactable | null {
    const target = this.currentTarget;
    if (!target) {
      return null;
    }
    this.interactableList = clearInteractable(this.interactableList, target.id);
    if (target.collectible) {
      this.collectedList = [...this.collectedList, { id: target.id, kind: target.kind }];
    }
    this.recomputeTarget();
    return { ...target, state: 'cleared' };
  }

  /**
   * Swings the hand axe (benchmark stub — no damage model). Off cooldown, the
   * swing connects when the hound is within `attackRange` and the facing arc; the
   * `hitsToRepel`-th hit drives the hound off (transition to flee).
   */
  tryAttack(): AttackResult {
    if (this.attackCooldown > 0) {
      return { swung: false, hit: false, repelled: false };
    }
    this.attackCooldown = this.config.attackCooldownSeconds;

    if (!this.houndState || !this.houndConfig || this.houndState.mode === 'flee') {
      return { swung: true, hit: false, repelled: false };
    }
    const facing = directionToVector(this.state.facing);
    const inReach = houndInAttackReach(
      this.houndState,
      this.state.position,
      facing,
      this.config.attackRange,
      this.config.attackArcCos,
      this.config.pointBlankRange,
    );
    if (!inReach) {
      return { swung: true, hit: false, repelled: false };
    }
    this.houndState = registerHoundHit(this.houndState, this.houndConfig);
    return { swung: true, hit: true, repelled: this.houndState.mode === 'flee' };
  }

  reset(): void {
    this.interactableList = this.seed.map((it) => ({ ...it }));
    this.collectedList = [];
    this.state = BenchmarkSimulation.spawnState(this.world);
    this.houndState = this.houndConfig ? createHoundState(this.houndConfig) : null;
    this.attackCooldown = 0;
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
