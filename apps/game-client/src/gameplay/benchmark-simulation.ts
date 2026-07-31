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
  defeatHound,
  houndInAttackReach,
  houndInContact,
  type HoundState,
  nearestOf,
  type RuinHoundConfig,
  separatePairSymmetric,
  stepHound,
} from './ruin-hound';
import { createStandInHunter, type StandInHunterConfig, type StandInHunterState, stepStandInHunter } from './stand-in-hunter';
import { length, normalize, type Vec2 } from './vec2';
import type { TileWorld } from './world';

export interface HunterState {
  readonly position: Vec2;
  readonly facing: Direction8;
}

/**
 * Stand-in "other player" Hunter tunables, as stored by the sim: the pure-AI
 * movement config (`StandInHunterConfig`) plus its own punch reach/pacing
 * (GD-0006 stub — no damage model; the punch is a visual/timer effect only,
 * rendered by the scene in a later slice).
 */
export interface StandInSimConfig extends StandInHunterConfig {
  /** Melee reach (world units) of the stand-in's punch. */
  readonly attackRange: number;
  /** Minimum time (seconds) between the stand-in's punches. */
  readonly attackCooldownSeconds: number;
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

/**
 * Benchmark combat model (GD-0007 — BENCHMARK-ONLY, non-authoritative): HP,
 * fixed per-hit damage, and brief "downed" durations for the player, hounds
 * and the stand-in. Mirrors `BENCHMARK.combatModel` shape-for-shape; passed in
 * (rather than imported) so this module stays Phaser/config-free and
 * unit-testable in isolation. Provisional tuning, not approved balance.
 */
export interface CombatModelConfig {
  /** Player Hunter max HP. */
  readonly hunterMaxHp: number;
  /** Damage the player's axe/punch deals per connecting hit. */
  readonly playerAttackDamage: number;
  readonly hound: {
    /** Hound max HP (was the `hitsToRepel` repel stub). */
    readonly maxHp: number;
    /** Damage a hound deals to the player per contact bite. */
    readonly contactDamage: number;
    /** Seconds between a hound's contact bites. */
    readonly contactCooldownSeconds: number;
    /** Seconds a hound stays "downed" (frozen) after reaching 0 HP, before it flees. */
    readonly downedSeconds: number;
  };
  readonly standIn: {
    /** Stand-in Hunter max HP. */
    readonly maxHp: number;
    /** Damage the stand-in's punch deals to the player. */
    readonly punchDamage: number;
    /** Seconds the stand-in stays "downed" after reaching 0 HP, before it respawns. */
    readonly downedSeconds: number;
  };
}

/** Outcome of an axe swing (benchmark stub — no hitbox/knockback model). */
export interface AttackResult {
  /** The swing actually happened (false when still on cooldown). */
  readonly swung: boolean;
  /** The swing connected with a hound. */
  readonly hit: boolean;
  /** This hit defeated the hound (HP reached 0) — it is now briefly downed, then flees. */
  readonly repelled: boolean;
  /** Index into `hounds` of the hound that was hit, or null when none was. */
  readonly hitIndex: number | null;
  /**
   * The swing connected with the stand-in "other player" Hunter instead of a
   * hound (GD-0006 PvP test-bed stub — no damage model; only starts the mutual
   * combat timer, see `pvpEngaged`). False whenever no stand-in is configured
   * or a hound was the nearer target.
   */
  readonly hitOtherHunter: boolean;
}

/**
 * Point-in-reach check for the stand-in "other player" Hunter, mirroring
 * `houndInAttackReach` (same range/arc/point-blank rule) but against a bare
 * position instead of a `HoundState` — the stand-in has no hound-specific
 * fields to carry. Pure.
 */
function inAttackReach(
  targetPos: Vec2,
  fromPos: Vec2,
  facingVec: Vec2,
  range: number,
  arcCos: number,
  pointBlankRange: number,
): boolean {
  const to = { x: targetPos.x - fromPos.x, y: targetPos.y - fromPos.y };
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
  private otherHunterState: StandInHunterState | null;
  /**
   * Mutual-combat timer (GD-0006 PvP test-bed stub — no damage model): starts
   * at `pvpCombatSeconds` when the axe connects with the stand-in and counts
   * down to zero. While positive (`pvpEngaged`), the stand-in chases and punches
   * the player (retaliating) and Hunter↔Hunter combat separation applies.
   */
  private pvpTimer = 0;
  /** Cooldown (seconds) until the stand-in can punch again (GD-0006 stub). */
  private standInCooldown = 0;
  /** True for exactly the frame the stand-in's punch connects — a pulse, not a state. */
  private standInStruckThisFrame = false;
  /** Player Hunter HP (GD-0007). Never reduced by this task — see `get playerHp`. */
  private hunterHp: number;
  /** Each hound's current HP, index-stable with `houndStates`/`houndConfigs` (GD-0007). */
  private houndHpValues: number[];
  /**
   * Seconds remaining a hound stays "downed" (frozen, not stepped) after
   * reaching 0 HP; 0 means not downed. Index-stable with `houndStates` (GD-0007).
   */
  private houndDownedTimers: number[];
  /** The stand-in Hunter's current HP (GD-0007). */
  private standInHpValue: number;
  /** Seconds remaining the stand-in stays "downed" after reaching 0 HP; 0 means not downed. */
  private standInDownedTimerValue = 0;
  /**
   * Seconds remaining until each hound can next bite the player, index-stable
   * with `houndStates` (Task 4 / GD-0007). 0 (or below) means it may bite this
   * frame if in contact.
   */
  private houndAttackCooldownValues: number[];
  /** True for exactly the frame the player took ANY damage (hound bite or stand-in
   * punch) — a pulse, not a state, for the scene's hit-flash (Task 4 / GD-0007). */
  private playerStruckThisFrame = false;
  /** True for exactly the frame a defeat-triggered respawn happened (Task 4 /
   * GD-0007) — a pulse the scene uses for a brief cue. */
  private playerDefeatedThisFramePulse = false;

  constructor(
    private readonly world: TileWorld,
    private readonly config: HunterSimConfig,
    /** Benchmark HP/damage/downed tunables (GD-0007) — see `CombatModelConfig`. */
    private readonly combatModel: CombatModelConfig,
    interactables: readonly Interactable[] = [],
    private readonly houndConfigs: readonly RuinHoundConfig[] = [],
    /** Stand-in "other player" Hunter tunables, or null to omit it entirely. */
    private readonly standInConfig: StandInSimConfig | null = null,
    /** The stand-in's spawn point; both this and `standInConfig` must be set to spawn it. */
    private readonly standInSpawn: Vec2 | null = null,
    /** Seconds the mutual-combat timer stays active after hitting the stand-in. */
    private readonly pvpCombatSeconds = 3,
  ) {
    this.seed = interactables;
    this.interactableList = interactables.map((it) => ({ ...it }));
    this.state = BenchmarkSimulation.spawnState(world);
    this.houndStates = this.houndConfigs.map((c) => createHoundState(c));
    this.otherHunterState = BenchmarkSimulation.spawnStandIn(standInConfig, standInSpawn);
    this.hunterHp = combatModel.hunterMaxHp;
    this.houndHpValues = this.houndConfigs.map(() => combatModel.hound.maxHp);
    this.houndDownedTimers = this.houndConfigs.map(() => 0);
    this.standInHpValue = combatModel.standIn.maxHp;
    this.standInDownedTimerValue = 0;
    this.houndAttackCooldownValues = this.houndConfigs.map(() => 0);
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

  /** The stand-in "other player" Hunter's current state, or null when none is configured. */
  get otherHunter(): StandInHunterState | null {
    return this.otherHunterState;
  }

  /**
   * True while the mutual-combat timer is active (GD-0006 PvP test-bed stub):
   * set by `tryAttack` connecting with the stand-in, it gates Hunter↔Hunter
   * combat separation and makes the stand-in chase/retaliate instead of wander.
   */
  get pvpEngaged(): boolean {
    return this.pvpTimer > 0;
  }

  /**
   * True for exactly the frame the stand-in's punch connects (GD-0006 stub — a
   * visual/timer effect only, no damage model). Resets to false at the start of
   * every `update` unless that frame's punch lands again.
   */
  get standInStruck(): boolean {
    return this.standInStruckThisFrame;
  }

  /** The player Hunter's current HP (GD-0007), clamped at 0 so it never reads negative. */
  get playerHp(): number {
    return Math.max(0, this.hunterHp);
  }

  /** The player Hunter's max HP (GD-0007) — mirrors `combatModel.hunterMaxHp`. */
  get playerMaxHp(): number {
    return this.combatModel.hunterMaxHp;
  }

  /**
   * True for exactly the frame the player took damage (a hound's contact bite
   * or the stand-in's punch) — a pulse, not a state, for the scene's hit-flash
   * (Task 4 / GD-0007). Resets to false at the start of every `update` unless
   * that frame lands a hit again.
   */
  get playerStruck(): boolean {
    return this.playerStruckThisFrame;
  }

  /**
   * True for exactly the frame a defeat-triggered respawn happened (the
   * player's HP reached 0) — a pulse the scene uses for a brief cue (Task 4 /
   * GD-0007).
   */
  get playerDefeatedThisFrame(): boolean {
    return this.playerDefeatedThisFramePulse;
  }

  /** Each hound's current HP, index-stable with `hounds` (GD-0007). */
  get houndHp(): readonly number[] {
    return this.houndHpValues;
  }

  /** The stand-in Hunter's current HP (GD-0007). */
  get standInHp(): number {
    return this.standInHpValue;
  }

  /**
   * True for a hound that is "downed" — defeated (0 HP) but not yet fled: it is
   * frozen in place for `combatModel.hound.downedSeconds` before its mode flips
   * to `flee` (GD-0007). Index-stable with `hounds`.
   */
  get houndDowned(): readonly boolean[] {
    return this.houndDownedTimers.map((t) => t > 0);
  }

  /** True while the stand-in is "downed" — defeated (0 HP), frozen before it
   * respawns at its spawn point (GD-0007). */
  get standInDowned(): boolean {
    return this.standInDownedTimerValue > 0;
  }

  /**
   * Candidate targets a hound may chase, nearest-first resolution is left to the
   * caller (`nearestOf`). The Hunter, plus the combat-sandbox stand-in Hunter
   * when one is configured.
   */
  private hunterPositions(): Vec2[] {
    return [this.state.position, ...(this.otherHunterState ? [this.otherHunterState.position] : [])];
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
    //
    // GD-0007: a hound at 0 HP is "downed" (`houndDownedTimers[i] > 0`) — frozen
    // in place, skipped here and in the creature<->creature pass below; once its
    // timer runs out this frame, `defeatHound` flips it into terminal `flee`.
    const hunterPositions = this.hunterPositions();
    const nextHoundDownedTimers = this.houndDownedTimers.slice();
    const hounds = this.houndStates.map((houndState, i) => {
      if (nextHoundDownedTimers[i] > 0) {
        nextHoundDownedTimers[i] = Math.max(0, nextHoundDownedTimers[i] - dtSeconds);
        return nextHoundDownedTimers[i] === 0 ? defeatHound(houndState) : houndState;
      }
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
    this.houndDownedTimers = nextHoundDownedTimers;

    // Creature<->creature pass (GD-0006): engaged hounds push each other apart so
    // a pack does not stack on one spot. Two iterations for stability with more
    // than a pair; each pushed position is re-resolved against world solids/bounds.
    // Only hounds move here too — never a Hunter. A downed hound (GD-0007) is
    // frozen and excluded here too.
    for (let iteration = 0; iteration < 2; iteration += 1) {
      for (let i = 0; i < hounds.length; i += 1) {
        for (let j = i + 1; j < hounds.length; j += 1) {
          if (
            nextHoundDownedTimers[i] > 0 ||
            nextHoundDownedTimers[j] > 0 ||
            hounds[i].mode !== 'chase' ||
            hounds[j].mode !== 'chase'
          ) {
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

    // Task 4 / GD-0007: both player-facing damage pulses reset every frame and
    // are re-armed below only if a hit actually lands this frame.
    this.playerStruckThisFrame = false;
    this.playerDefeatedThisFramePulse = false;

    // Task 4 / GD-0007: a hound that is NOT downed and in contact with the
    // player bites on its own per-hound cooldown (never every frame). A downed
    // hound is frozen (see the step loop above) and cannot bite. Nor can a
    // hound already in terminal `flee` mode (defeated, fled the downed window)
    // — it must not keep biting merely because it remains within contactRadius
    // (e.g. cornered, or motionless in a speed-0 benchmark config): a
    // defeated/fleeing entity deals no contact damage (GD-0007).
    this.houndAttackCooldownValues = this.houndAttackCooldownValues.map((cooldown, i) => {
      if (this.houndDownedTimers[i] > 0) {
        return cooldown;
      }
      const nextCooldown = cooldown - dtSeconds;
      if (
        nextCooldown <= 0 &&
        this.houndStates[i].mode !== 'flee' &&
        houndInContact(this.houndStates[i], this.state.position, this.houndConfigs[i])
      ) {
        this.hunterHp -= this.combatModel.hound.contactDamage;
        this.playerStruckThisFrame = true;
        return this.combatModel.hound.contactCooldownSeconds;
      }
      return nextCooldown;
    });

    // GD-0007: a downed stand-in (0 HP) is frozen — skip its movement/attack
    // entirely and count down to a respawn instead. When the timer runs out this
    // frame, it reappears at its original spawn at full HP and the mutual-combat
    // timer clears (mirrors a hound's downed->flee, but the stand-in respawns
    // rather than fleeing off-screen).
    if (this.standInDownedTimerValue > 0) {
      this.standInDownedTimerValue = Math.max(0, this.standInDownedTimerValue - dtSeconds);
      if (this.standInDownedTimerValue === 0) {
        this.otherHunterState = BenchmarkSimulation.spawnStandIn(this.standInConfig, this.standInSpawn);
        this.standInHpValue = this.combatModel.standIn.maxHp;
        this.pvpTimer = 0;
      }
      this.standInStruckThisFrame = false;
    } else {
      // Stand-in "other player" Hunter (GD-0006 PvP test-bed stub, no damage
      // model on ITS punch — see Task 4): wanders when idle, chases/punches the
      // player while `pvpEngaged`. While engaged, it is also pushed off the
      // player via the same soft combat separation used for hounds — only the
      // stand-in is displaced here, re-resolved against world solids; the player
      // (`this.state`) never moves as a result of this pass.
      if (this.otherHunterState) {
        let otherHunter = stepStandInHunter(
          this.otherHunterState,
          this.state.position,
          this.pvpEngaged,
          dtSeconds,
          this.world,
          this.standInConfig!,
        );
        if (this.pvpEngaged) {
          const minDistance = this.standInConfig!.footprintRadius + this.config.footprintRadius;
          const separated = combatSeparation(otherHunter.position, this.state.position, minDistance);
          if (separated !== otherHunter.position) {
            const position = resolveMovement(
              otherHunter.position,
              separated,
              this.standInConfig!.footprintRadius,
              this.world.solids,
              this.world.bounds,
            );
            otherHunter = { ...otherHunter, position };
          }
        }
        this.otherHunterState = otherHunter;
      }

      // Stand-in's punch (GD-0006 stub for ITS OWN visual/timer effect; Task 4 /
      // GD-0007 adds real damage to the player). Off cooldown, while pvp is
      // engaged and the stand-in is within its own attackRange of the player,
      // it lands a punch: a one-frame pulse (`standInStruck`) plus a refresh of
      // the mutual-combat timer, so the stand-in's own attacks keep the fight
      // alive. The player's POSITION is never moved by this (only its HP).
      this.standInCooldown = Math.max(0, this.standInCooldown - dtSeconds);
      if (this.otherHunterState && this.standInConfig && this.pvpEngaged && this.standInCooldown <= 0) {
        const distance = length({
          x: this.otherHunterState.position.x - this.state.position.x,
          y: this.otherHunterState.position.y - this.state.position.y,
        });
        if (distance <= this.standInConfig.attackRange) {
          this.standInStruckThisFrame = true;
          this.standInCooldown = this.standInConfig.attackCooldownSeconds;
          this.pvpTimer = this.pvpCombatSeconds;
          this.hunterHp -= this.combatModel.standIn.punchDamage;
          this.playerStruckThisFrame = true;
        } else {
          this.standInStruckThisFrame = false;
        }
      } else {
        this.standInStruckThisFrame = false;
      }
    }

    this.pvpTimer = Math.max(0, this.pvpTimer - dtSeconds);

    // Task 4 / GD-0007: once all of this frame's damage (hound bites, the
    // stand-in's punch) has been applied, a defeated player (0 HP) respawns at
    // the safe pocket immediately — no permadeath (GD-0007). Collected/cleared
    // progress is explicitly NOT reset here (see `resetCombatEntities`).
    if (this.hunterHp <= 0) {
      this.respawnAfterDefeat();
      this.playerDefeatedThisFramePulse = true;
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
   * Swings the hand axe (benchmark stub — no hitbox/knockback model). Off
   * cooldown, the swing connects with the NEAREST hound that is within
   * `attackRange` and the facing arc, dealing `combatModel.playerAttackDamage`
   * (GD-0007); the hit that brings it to 0 HP downs it (briefly frozen, then it
   * flees — see `update`). A hound already fled cannot be re-targeted. When no
   * hound is hit, a swing connecting with the stand-in instead damages it the
   * same way. The player is never damaged by its own swing (obviously).
   */
  tryAttack(): AttackResult {
    if (this.attackCooldown > 0) {
      return { swung: false, hit: false, repelled: false, hitIndex: null, hitOtherHunter: false };
    }
    this.attackCooldown = this.config.attackCooldownSeconds;

    const facing = directionToVector(this.state.facing);
    let hitIndex: number | null = null;
    let nearestDistance = Infinity;
    for (let i = 0; i < this.houndStates.length; i += 1) {
      const houndState = this.houndStates[i];
      // A fled hound is gone; a downed one (GD-0007) is already defeated and
      // must not be re-targeted — otherwise repeated swings would keep
      // refreshing `houndDownedTimers[i]` and it would never transition to flee.
      if (houndState.mode === 'flee' || this.houndDownedTimers[i] > 0) {
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
    if (hitIndex !== null) {
      // GD-0007: apply damage, then down the hound at 0 HP (the freeze/flee
      // transition itself happens in `update`, driven by `houndDownedTimers`).
      const remainingHp = Math.max(
        0,
        this.houndHpValues[hitIndex] - this.combatModel.playerAttackDamage,
      );
      const defeated = remainingHp <= 0;
      this.houndHpValues = this.houndHpValues.map((hp, i) => (i === hitIndex ? remainingHp : hp));
      if (defeated) {
        this.houndDownedTimers = this.houndDownedTimers.map((t, i) =>
          i === hitIndex ? this.combatModel.hound.downedSeconds : t,
        );
      }
      return { swung: true, hit: true, repelled: defeated, hitIndex, hitOtherHunter: false };
    }

    // No hound was hit (a hound always takes priority when both are in reach):
    // GD-0006 PvP test-bed stub — a swing that connects with the stand-in
    // starts/refreshes the mutual-combat timer and, per GD-0007, deals the same
    // per-hit damage; at 0 HP the stand-in is downed (see `update`).
    // A downed stand-in (GD-0007, 0 HP) must not be re-targeted either — same
    // reasoning as the hound guard above (would otherwise refresh its downed
    // timer indefinitely and it would never respawn).
    if (
      this.otherHunterState &&
      this.standInDownedTimerValue === 0 &&
      inAttackReach(
        this.otherHunterState.position,
        this.state.position,
        facing,
        this.config.attackRange,
        this.config.attackArcCos,
        this.config.pointBlankRange,
      )
    ) {
      this.standInHpValue = Math.max(
        0,
        this.standInHpValue - this.combatModel.playerAttackDamage,
      );
      if (this.standInHpValue <= 0) {
        this.standInDownedTimerValue = this.combatModel.standIn.downedSeconds;
      }
      this.pvpTimer = this.pvpCombatSeconds;
      return { swung: true, hit: false, repelled: false, hitIndex: null, hitOtherHunter: true };
    }

    return { swung: true, hit: false, repelled: false, hitIndex: null, hitOtherHunter: false };
  }

  /** Full reset for a fresh encounter attempt: entities AND world/possession
   * progress (interactables re-seeded to active, possession log emptied). */
  reset(): void {
    this.interactableList = this.seed.map((it) => ({ ...it }));
    this.collectedList = [];
    this.resetCombatEntities();
    // Task 4 / GD-0007: unlike `respawnAfterDefeat` (where the killing hit's
    // own pulse should still read true for this frame), a full manual reset
    // clears both pulses — there is no "this frame" hit/defeat to report.
    this.playerStruckThisFrame = false;
    this.playerDefeatedThisFramePulse = false;
  }

  /**
   * Defeat-triggered respawn (Task 4 / GD-0007 — no permadeath): the player is
   * returned to the spawn pocket at full HP and every combat entity/timer is
   * reset to a fresh-encounter state, exactly like `reset()` — EXCEPT world
   * progress (`interactableList`/`collectedList`) is deliberately left alone,
   * so anything already cleared or collected stays that way.
   */
  private respawnAfterDefeat(): void {
    this.resetCombatEntities();
  }

  /**
   * Shared by `reset()` and `respawnAfterDefeat()`: returns the player to
   * spawn and every hound/stand-in/combat timer to a fresh-encounter state.
   * Deliberately does NOT touch `interactableList`/`collectedList` — callers
   * that want those reset too (`reset()`) do it themselves first.
   */
  private resetCombatEntities(): void {
    this.state = BenchmarkSimulation.spawnState(this.world);
    this.houndStates = this.houndConfigs.map((c) => createHoundState(c));
    this.otherHunterState = BenchmarkSimulation.spawnStandIn(this.standInConfig, this.standInSpawn);
    this.pvpTimer = 0;
    this.attackCooldown = 0;
    this.standInCooldown = 0;
    this.standInStruckThisFrame = false;
    // GD-0007: rebuild HP/downed state to match a fresh encounter.
    this.hunterHp = this.combatModel.hunterMaxHp;
    this.houndHpValues = this.houndConfigs.map(() => this.combatModel.hound.maxHp);
    this.houndDownedTimers = this.houndConfigs.map(() => 0);
    this.houndAttackCooldownValues = this.houndConfigs.map(() => 0);
    this.standInHpValue = this.combatModel.standIn.maxHp;
    this.standInDownedTimerValue = 0;
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

  /** Both `config` and `spawn` must be set to spawn the stand-in; otherwise null. */
  private static spawnStandIn(
    config: StandInHunterConfig | null,
    spawn: Vec2 | null,
  ): StandInHunterState | null {
    return config && spawn ? createStandInHunter(spawn) : null;
  }
}
