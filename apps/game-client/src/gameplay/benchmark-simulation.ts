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
  nearestOf,
  registerHoundHit,
  type RuinHoundConfig,
  separatePairSymmetric,
  stepHound,
} from './ruin-hound';
import { length, type Vec2 } from './vec2';
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
  /** The swing connected with a hound. */
  readonly hit: boolean;
  /** This hit drove the hound off (transition into flee). */
  readonly repelled: boolean;
  /** Index into `hounds` of the hound that was hit, or null when none was. */
  readonly hitIndex: number | null;
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
  private houndStates: HoundState[];
  private attackCooldown = 0;

  constructor(
    private readonly world: TileWorld,
    private readonly config: HunterSimConfig,
    interactables: readonly Interactable[] = [],
    private readonly houndConfigs: readonly RuinHoundConfig[] = [],
  ) {
    this.seed = interactables;
    this.interactableList = interactables.map((it) => ({ ...it }));
    this.state = BenchmarkSimulation.spawnState(world);
    this.houndStates = this.houndConfigs.map((c) => createHoundState(c));
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

  /** All hounds' current state, in construction/config order (index-stable). */
  get hounds(): readonly HoundState[] {
    return this.houndStates;
  }

  /**
   * TEMPORARY back-compat accessor for the first hound (index 0), or null when
   * none are configured. Existing single-hound callers (e.g. the scene's render
   * code) read this while they migrate to `hounds`; removed once they do (a later
   * task).
   */
  get hound(): HoundState | null {
    return this.houndStates[0] ?? null;
  }

  /** True while any hound is actively chasing the Hunter (drives combat camera). */
  get threatEngaged(): boolean {
    return this.houndStates.some((h) => h.mode === 'chase');
  }

  /** True while any hound is in contact with the Hunter (a benchmark danger state). */
  get inDanger(): boolean {
    return this.houndStates.some((h, i) =>
      houndInContact(h, this.state.position, this.houndConfigs[i]),
    );
  }

  /**
   * Candidate targets a hound may chase, nearest-first resolution is left to the
   * caller (`nearestOf`). Just the Hunter for now; a later task appends the
   * combat-sandbox stand-in Hunter.
   */
  private hunterPositions(): Vec2[] {
    return [this.state.position];
  }

  update(actions: ReadonlySet<MovementAction>, dtSeconds: number): void {
    const solids = [...this.world.solids, ...activeBlockingRects(this.interactableList)];
    const world: TileWorld = { ...this.world, solids };
    this.state = stepHunter(this.state, actions, dtSeconds, world, this.config);

    // Each hound independently chases the nearest Hunter and collides with the
    // static world only (it ignores clearable obstructions — a deliberate stub
    // simplification). GD-0006: while engaged (chase), it is also pushed off that
    // same target via a soft separation so it holds at biting distance instead of
    // stacking on the target's centre. Benchmark scope: only hounds are displaced
    // here — a Hunter never moves as a result of this pass.
    const hunterPositions = this.hunterPositions();
    const hounds = this.houndStates.map((houndState, i) => {
      const houndConfig = this.houndConfigs[i];
      const target = nearestOf(houndState.position, hunterPositions) ?? this.state.position;
      let hound = stepHound(houndState, target, dtSeconds, this.world, houndConfig);
      if (hound.mode === 'chase') {
        const minDistance = houndConfig.footprintRadius + this.config.footprintRadius;
        const separated = combatSeparation(hound.position, target, minDistance);
        if (separated !== hound.position) {
          const position = resolveMovement(
            hound.position,
            separated,
            houndConfig.footprintRadius,
            this.world.solids,
            this.world.bounds,
          );
          hound = { ...hound, position };
        }
      }
      return hound;
    });

    // Creature<->creature pass (GD-0006): engaged hounds push each other apart so
    // a pack does not stack on one spot. Two iterations for stability with more
    // than a pair; each pushed position is re-resolved against world solids/bounds.
    // Only hounds move here too — never a Hunter.
    for (let iteration = 0; iteration < 2; iteration += 1) {
      for (let i = 0; i < hounds.length; i += 1) {
        for (let j = i + 1; j < hounds.length; j += 1) {
          if (hounds[i].mode !== 'chase' || hounds[j].mode !== 'chase') {
            continue;
          }
          const minDistance =
            this.houndConfigs[i].footprintRadius + this.houndConfigs[j].footprintRadius;
          const [posI, posJ] = separatePairSymmetric(
            hounds[i].position,
            hounds[j].position,
            minDistance,
          );
          if (posI !== hounds[i].position) {
            const position = resolveMovement(
              hounds[i].position,
              posI,
              this.houndConfigs[i].footprintRadius,
              this.world.solids,
              this.world.bounds,
            );
            hounds[i] = { ...hounds[i], position };
          }
          if (posJ !== hounds[j].position) {
            const position = resolveMovement(
              hounds[j].position,
              posJ,
              this.houndConfigs[j].footprintRadius,
              this.world.solids,
              this.world.bounds,
            );
            hounds[j] = { ...hounds[j], position };
          }
        }
      }
    }
    this.houndStates = hounds;

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
   * swing connects with the NEAREST hound that is within `attackRange` and the
   * facing arc; the `hitsToRepel`-th hit on that hound drives it off (transition
   * to flee). A hound already fled cannot be re-targeted.
   */
  tryAttack(): AttackResult {
    if (this.attackCooldown > 0) {
      return { swung: false, hit: false, repelled: false, hitIndex: null };
    }
    this.attackCooldown = this.config.attackCooldownSeconds;

    const facing = directionToVector(this.state.facing);
    let hitIndex: number | null = null;
    let nearestDistance = Infinity;
    for (let i = 0; i < this.houndStates.length; i += 1) {
      const houndState = this.houndStates[i];
      if (houndState.mode === 'flee') {
        continue;
      }
      const inReach = houndInAttackReach(
        houndState,
        this.state.position,
        facing,
        this.config.attackRange,
        this.config.attackArcCos,
        this.config.pointBlankRange,
      );
      if (!inReach) {
        continue;
      }
      const distance = length({
        x: houndState.position.x - this.state.position.x,
        y: houndState.position.y - this.state.position.y,
      });
      if (distance < nearestDistance) {
        nearestDistance = distance;
        hitIndex = i;
      }
    }
    if (hitIndex === null) {
      return { swung: true, hit: false, repelled: false, hitIndex: null };
    }
    const hit = registerHoundHit(this.houndStates[hitIndex], this.houndConfigs[hitIndex]);
    this.houndStates = this.houndStates.map((h, i) => (i === hitIndex ? hit : h));
    return { swung: true, hit: true, repelled: hit.mode === 'flee', hitIndex };
  }

  reset(): void {
    this.interactableList = this.seed.map((it) => ({ ...it }));
    this.collectedList = [];
    this.state = BenchmarkSimulation.spawnState(this.world);
    this.houndStates = this.houndConfigs.map((c) => createHoundState(c));
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
