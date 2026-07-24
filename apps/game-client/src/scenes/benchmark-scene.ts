import { BENCHMARK, COLORS, GAME_HEIGHT, GAME_WIDTH } from '@core/config';
import { BaseScene, SceneKeys } from '@core/scenes';
import {
  BenchmarkSimulation,
  clampDeltaSeconds,
  createTileWorld,
  directionToVector,
  intentFromActions,
  type Interactable,
  lookAheadTarget,
  movementActionsFromCodes,
  type RuinHoundConfig,
  smoothTowards,
  tileCentre,
  type TileWorld,
  type Vec2,
  ZERO,
} from '@gameplay';
import Phaser from 'phaser';

/**
 * First-playable-loop greybox — the "Overgrown Ruin" benchmark scene.
 *
 * This is a thin Phaser adapter: all movement, collision, camera and
 * interaction *logic* lives in the Phaser-free, unit-tested
 * {@link BenchmarkSimulation} and the `@gameplay` core. The scene reads keyboard
 * input, drives the simulation, and renders the resulting logical state with
 * placeholder primitives. Logical position (owned by the simulation) is kept
 * strictly separate from the rendered position (set here) — GD-0004.
 *
 * Input is read from a capture-phase `window` keydown/keyup listener keyed on
 * `event.code` (physical keys). This is deliberate: it is layout-independent,
 * and it receives keys before any bubble-phase handler or browser extension can
 * `preventDefault` them — Phaser's own keyboard handler is bubble-phase and
 * silently drops already-defaulted events, which made WASD/E fail under some
 * extensions while arrows worked.
 *
 * The world is rendered with an identity logical->screen projection for now;
 * the oblique presentation is a later art-pass concern and, per GD-0004, must
 * never affect logical distance or collision.
 *
 * The simulation is BENCHMARK-ONLY and NON-AUTHORITATIVE (no server transport
 * exists yet — that needs its own ADR).
 */

// Render layer depths, following the approved layer stack (asset-specification):
// ground / ground-decal / low-object / item-drop / shadow / entity-body / world-ui.
const DEPTH = {
  ground: 0,
  groundDecal: 10,
  lowObject: 100,
  itemDrop: 150, // ground items sit above low objects but below the Hunter/shadow
  shadow: 200,
  entity: 1000, // + pivot.y so entities sort front-to-back by their feet
  effect: 3000, // transient combat effects (swing, hit flash) above all entities
  worldUi: 90_000,
  ui: 100_000,
} as const;

// Hunter placeholder geometry (drawn from the feet pivot upward).
const BODY_WIDTH = 26;
const BODY_HEIGHT = 46;
const FACING_TICK_SIZE = 8;
const FACING_TICK_RADIUS = 14;

// Ruin-hound placeholder geometry (a low, wide quadruped silhouette).
const HOUND_BODY_WIDTH = 46;
const HOUND_BODY_HEIGHT = 22;
const HOUND_TICK_SIZE = 7;
const HOUND_TICK_RADIUS = 12;

// Peak alpha of the danger vignette when the hound is in contact (restrained).
const DANGER_MAX_ALPHA = 0.22;

// Scalar frame-rate-independent smoothing toward a target (companion to the
// Vec2 `smoothTowards`): the same 1 - e^(-rate*dt) curve.
const approach = (current: number, target: number, rate: number, dt: number): number =>
  dt <= 0 || rate <= 0 ? current : current + (target - current) * (1 - Math.exp(-rate * dt));
const lerpScalar = (a: number, b: number, t: number): number => a + (b - a) * t;

// Physical key codes for the non-movement semantic actions.
const INTERACT_CODE = 'KeyE';
const ATTACK_CODE = 'Space';
const RESTART_CODE = 'KeyR';

// Contextual prompt verb per interactable kind (benchmark placeholder).
const INTERACT_LABEL: Record<string, string> = { overgrowth: 'Cut', fragment: 'Pick up' };
// Item name shown alongside the verb for pickup items (contextual UI, not lore).
const ITEM_LABEL: Record<string, string> = { fragment: 'Unknown fragment' };
// Restrained, temporary discovery line shown on pickup ("a trace, not a burst").
const DISCOVERY_MESSAGE: Record<string, string> = {
  fragment: 'You found an unidentified ancient fragment.',
};
const cssHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

export class BenchmarkScene extends BaseScene {
  private world!: TileWorld;
  private sim!: BenchmarkSimulation;
  private hunter!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private facingTick!: Phaser.GameObjects.Rectangle;
  private prompt?: Phaser.GameObjects.Text;
  private satchel?: Phaser.GameObjects.Text;
  private readonly interactableViews = new Map<string, Phaser.GameObjects.Shape>();
  private hound?: Phaser.GameObjects.Container;
  private houndShadow?: Phaser.GameObjects.Ellipse;
  private houndFacingTick?: Phaser.GameObjects.Rectangle;
  private dangerOverlay?: Phaser.GameObjects.Rectangle;
  private readonly pressedCodes = new Set<string>();
  private interactQueued = false;
  private attackQueued = false;
  private restartQueued = false;
  private lookAhead: Vec2 = ZERO;
  private combatIntensity = 0;
  private dangerAlpha = 0;

  constructor() {
    super({ key: SceneKeys.Benchmark });
  }

  create(): void {
    this.log.info('Benchmark greybox created (benchmark-only, non-authoritative)');
    this.bus.emit('scene:started', { key: this.scene.key });

    this.world = createTileWorld({
      cols: BENCHMARK.world.cols,
      rows: BENCHMARK.world.rows,
      tileSize: BENCHMARK.tileSize,
      spawnTile: BENCHMARK.spawnTile,
      solidTiles: BENCHMARK.solidTiles,
    });
    const interactables = this.buildInteractables();
    this.sim = new BenchmarkSimulation(
      this.world,
      {
        speed: BENCHMARK.movement.walkSpeed,
        footprintRadius: BENCHMARK.hunter.footprintRadius,
        interactRange: BENCHMARK.interaction.range,
        attackRange: BENCHMARK.combat.attackRange,
        attackArcCos: BENCHMARK.combat.attackArcCos,
        attackCooldownSeconds: BENCHMARK.combat.attackCooldownSeconds,
      },
      interactables,
      this.buildHoundConfig(),
    );
    this.lookAhead = ZERO;
    this.combatIntensity = 0;
    this.dangerAlpha = 0;
    this.attackQueued = false;
    this.interactableViews.clear();

    this.drawWorld();
    this.drawInteractables(interactables);
    this.createHunter();
    this.createHound();
    this.createPrompt();
    this.setupCamera();
    this.setupInput();
    this.addHint();
    this.createSatchel();
    this.createDangerOverlay();
  }

  private buildHoundConfig(): RuinHoundConfig {
    const ts = BENCHMARK.tileSize;
    const h = BENCHMARK.hound;
    return {
      speed: h.speed,
      footprintRadius: h.footprintRadius,
      waypoints: h.patrolTiles.map((t) => tileCentre(t.col, t.row, ts)),
      aggroRadius: h.aggroRadius,
      deAggroRadius: h.deAggroRadius,
      contactRadius: h.contactRadius,
      arriveEpsilon: h.arriveEpsilon,
      hitsToRepel: h.hitsToRepel,
      fleeSpeedMultiplier: h.fleeSpeedMultiplier,
    };
  }

  override update(_time: number, delta: number): void {
    if (!this.sim) {
      return;
    }
    const dt = clampDeltaSeconds(delta, BENCHMARK.movement.maxDeltaSeconds);

    if (this.restartQueued) {
      this.restartQueued = false;
      this.scene.restart();
      return;
    }

    const actions = movementActionsFromCodes(this.pressedCodes);
    this.sim.update(actions, dt);

    if (this.interactQueued) {
      this.interactQueued = false;
      this.handleInteract();
    }

    if (this.attackQueued) {
      this.attackQueued = false;
      this.handleAttack();
    }

    const { position, facing } = this.sim.hunter;
    this.hunter.setPosition(position.x, position.y);
    this.hunter.setDepth(DEPTH.entity + position.y); // pivot.y sorting
    this.shadow.setPosition(position.x, position.y);

    const tick = directionToVector(facing);
    this.facingTick.setPosition(
      tick.x * FACING_TICK_RADIUS,
      -BODY_HEIGHT * 0.6 + tick.y * FACING_TICK_RADIUS,
    );

    this.updatePrompt();
    this.renderHound();
    this.updateCombatCamera(intentFromActions(actions), dt);
  }

  /** Mirrors the hound's logical state onto its placeholder (body/shadow/facing). */
  private renderHound(): void {
    const state = this.sim.hound;
    if (!state || !this.hound || !this.houndShadow || !this.houndFacingTick) {
      return;
    }
    this.hound.setPosition(state.position.x, state.position.y);
    this.hound.setDepth(DEPTH.entity + state.position.y); // pivot.y sorting
    this.houndShadow.setPosition(state.position.x, state.position.y);
    const tick = directionToVector(state.facing);
    this.houndFacingTick.setPosition(
      tick.x * HOUND_TICK_RADIUS,
      -HOUND_BODY_HEIGHT * 0.5 + tick.y * HOUND_TICK_RADIUS,
    );
  }

  /**
   * Presentation-only combat camera (GD-0004): a smoothed 0..1 engagement drives
   * a moderate zoom-in and reduced look-ahead while the hound chases, easing back
   * on disengage (hysteresis lives in the AI's chase/return modes). Also drives
   * the danger vignette. Never changes logical distance, range or perception.
   */
  private updateCombatCamera(intent: Vec2, dt: number): void {
    const cc = BENCHMARK.combatCamera;
    const engaged = this.sim.threatEngaged ? 1 : 0;
    this.combatIntensity = approach(this.combatIntensity, engaged, cc.intensitySmoothing, dt);

    this.cameras.main.setZoom(lerpScalar(cc.exploreZoom, cc.combatZoom, this.combatIntensity));

    const laScale = lerpScalar(1, cc.lookAheadCombatScale, this.combatIntensity);
    const target = lookAheadTarget(intent, BENCHMARK.camera.lookAheadDistance * laScale);
    this.lookAhead = smoothTowards(this.lookAhead, target, BENCHMARK.camera.lookAheadSmoothing, dt);
    this.cameras.main.setFollowOffset(-this.lookAhead.x, -this.lookAhead.y);

    const dangerTarget = this.sim.inDanger ? DANGER_MAX_ALPHA : 0;
    this.dangerAlpha = approach(this.dangerAlpha, dangerTarget, cc.intensitySmoothing, dt);
    this.dangerOverlay?.setAlpha(this.dangerAlpha);
  }

  private buildInteractables(): Interactable[] {
    const ts = BENCHMARK.tileSize;
    return BENCHMARK.interactables.map((it) => ({
      id: it.id,
      kind: it.kind,
      bounds: {
        x: it.tile.col * ts,
        y: it.tile.row * ts,
        width: it.tile.cols * ts,
        height: it.tile.rows * ts,
      },
      blocksWhileActive: it.blocksWhileActive,
      collectible: it.collectible,
      state: 'active' as const,
    }));
  }

  private drawWorld(): void {
    const { colors, tileSize } = BENCHMARK;
    const worldWidth = this.world.bounds.width;
    const worldHeight = this.world.bounds.height;

    this.add
      .rectangle(0, 0, worldWidth, worldHeight, colors.ground)
      .setOrigin(0, 0)
      .setDepth(DEPTH.ground);

    const grid = this.add.graphics().setDepth(DEPTH.groundDecal);
    grid.lineStyle(1, colors.gridLine, 0.5);
    for (let col = 0; col <= this.world.cols; col += 1) {
      grid.lineBetween(col * tileSize, 0, col * tileSize, worldHeight);
    }
    for (let row = 0; row <= this.world.rows; row += 1) {
      grid.lineBetween(0, row * tileSize, worldWidth, row * tileSize);
    }

    // Subtle marker for the safe starting pocket.
    this.add
      .circle(this.world.spawn.x, this.world.spawn.y, tileSize * 0.4, colors.spawn, 0.25)
      .setDepth(DEPTH.groundDecal);

    for (const solid of this.world.solids) {
      this.add
        .rectangle(solid.x, solid.y, solid.width, solid.height, colors.solid)
        .setOrigin(0, 0)
        .setStrokeStyle(2, colors.solidStroke)
        .setDepth(DEPTH.lowObject);
    }
  }

  private drawInteractables(interactables: readonly Interactable[]): void {
    const { colors } = BENCHMARK;
    for (const it of interactables) {
      if (it.collectible) {
        this.interactableViews.set(it.id, this.drawFragment(it));
        continue;
      }
      const view = this.add
        .rectangle(it.bounds.x, it.bounds.y, it.bounds.width, it.bounds.height, colors.overgrowth)
        .setOrigin(0, 0)
        .setStrokeStyle(2, colors.overgrowthStroke)
        .setDepth(DEPTH.lowObject + 1);
      this.interactableViews.set(it.id, view);
    }
  }

  /**
   * A discreet ground item on the item-drop layer: a small weathered shard
   * (rotated square) with a faint accent stroke — readable as interactable
   * without glow or loot-style emphasis. No baked shadow (per the item spec).
   */
  private drawFragment(it: Interactable): Phaser.GameObjects.Shape {
    const { colors } = BENCHMARK;
    const cx = it.bounds.x + it.bounds.width / 2;
    const cy = it.bounds.y + it.bounds.height / 2;
    return this.add
      .rectangle(cx, cy, 18, 18, colors.fragment)
      .setAngle(45)
      .setStrokeStyle(2, colors.fragmentAccent)
      .setDepth(DEPTH.itemDrop);
  }

  private createHunter(): void {
    const { colors, hunter } = BENCHMARK;
    const { spawn } = this.world;

    // Runtime shadow / footprint (flattened ellipse), kept on its own layer and
    // separate from the body sprite — never baked into the character.
    this.shadow = this.add
      .ellipse(
        spawn.x,
        spawn.y,
        hunter.footprintRadius * 2,
        hunter.footprintRadius,
        colors.footprint,
        0.5,
      )
      .setDepth(DEPTH.shadow);

    const body = this.add
      .rectangle(0, -BODY_HEIGHT / 2, BODY_WIDTH, BODY_HEIGHT, colors.hunter)
      .setStrokeStyle(1, 0x000000, 0.4);
    this.facingTick = this.add.rectangle(
      0,
      -BODY_HEIGHT * 0.6 + FACING_TICK_RADIUS,
      FACING_TICK_SIZE,
      FACING_TICK_SIZE,
      colors.hunterFacing,
    );

    this.hunter = this.add
      .container(spawn.x, spawn.y, [body, this.facingTick])
      .setDepth(DEPTH.entity + spawn.y);
  }

  /** The ruin-hound placeholder: wide body + separate runtime shadow + nose tick. */
  private createHound(): void {
    const state = this.sim.hound;
    if (!state) {
      return;
    }
    const { colors, hound } = BENCHMARK;
    const { position } = state;

    this.houndShadow = this.add
      .ellipse(
        position.x,
        position.y,
        hound.footprintRadius * 2,
        hound.footprintRadius,
        colors.footprint,
        0.5,
      )
      .setDepth(DEPTH.shadow);

    const body = this.add
      .rectangle(0, -HOUND_BODY_HEIGHT / 2, HOUND_BODY_WIDTH, HOUND_BODY_HEIGHT, colors.hound)
      .setStrokeStyle(2, colors.houndStroke);
    this.houndFacingTick = this.add.rectangle(
      0,
      -HOUND_BODY_HEIGHT / 2,
      HOUND_TICK_SIZE,
      HOUND_TICK_SIZE,
      colors.houndStroke,
    );

    this.hound = this.add
      .container(position.x, position.y, [body, this.houndFacingTick])
      .setDepth(DEPTH.entity + position.y);
  }

  // Screen-fixed red vignette shown while the hound is in contact. Oversized and
  // centred so it still covers the view under the combat-camera zoom; its alpha is
  // driven from the danger state each frame.
  private createDangerOverlay(): void {
    this.dangerOverlay = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH * 1.6,
        GAME_HEIGHT * 1.6,
        BENCHMARK.colors.danger,
      )
      .setScrollFactor(0)
      .setDepth(DEPTH.ui - 1)
      .setAlpha(0);
  }

  private createPrompt(): void {
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: cssHex(BENCHMARK.colors.prompt),
        backgroundColor: 'rgba(12,15,12,0.8)',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
  }

  // Minimal possession / pickup-log placeholder (NOT an inventory panel): a single
  // unobtrusive line that stays hidden until the first item is collected, keeping
  // the default UI clean per the benchmark's contextual-UI rule.
  private createSatchel(): void {
    this.satchel = this.add
      .text(12, GAME_HEIGHT - 40, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: cssHex(BENCHMARK.colors.fragmentAccent),
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.ui)
      .setVisible(false);
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.world.bounds.width, this.world.bounds.height);
    camera.setRoundPixels(true);
    camera.setZoom(BENCHMARK.combatCamera.exploreZoom); // reset on (re)start before combat zoom
    camera.startFollow(this.hunter, true, BENCHMARK.camera.followLerp, BENCHMARK.camera.followLerp);
  }

  private setupInput(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      this.pressedCodes.add(event.code);
      if (event.code === INTERACT_CODE) {
        this.interactQueued = true;
      } else if (event.code === ATTACK_CODE) {
        this.attackQueued = true;
      } else if (event.code === RESTART_CODE) {
        this.restartQueued = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      this.pressedCodes.delete(event.code);
    };
    // Losing focus releases held keys so the Hunter never "runs away" while the
    // player is typing elsewhere (GD-0004 controls: focus loss releases keys).
    const onBlur = (): void => {
      this.pressedCodes.clear();
    };

    // Capture phase so we receive keys before any bubble-phase handler/extension
    // can preventDefault them (the cause of WASD/E being swallowed for some users).
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      this.pressedCodes.clear();
      this.interactQueued = false;
      this.attackQueued = false;
      this.restartQueued = false;
      this.bus.emit('scene:shutdown', { key: this.scene.key });
    });
  }

  private addHint(): void {
    this.add
      .text(
        12,
        GAME_HEIGHT - 22,
        'WASD / Arrows: move   ·   E: interact   ·   Space: attack   ·   R: restart   ·   greybox (non-authoritative)',
        { fontFamily: 'monospace', fontSize: '12px', color: COLORS.accent },
      )
      .setScrollFactor(0)
      .setDepth(DEPTH.ui);
  }

  private handleInteract(): void {
    const resolved = this.sim.tryInteract();
    if (!resolved) {
      return;
    }
    const view = this.interactableViews.get(resolved.id);
    if (view) {
      this.tweens.add({
        targets: view,
        alpha: 0,
        duration: 180,
        onComplete: () => view.setVisible(false),
      });
    }
    if (resolved.collectible) {
      this.showDiscovery(DISCOVERY_MESSAGE[resolved.kind] ?? 'You found something.');
      this.updatePossession();
      this.log.info('Benchmark pickup: collected item', resolved.id);
    } else {
      this.log.info('Benchmark interaction: cleared obstruction', resolved.id);
    }
  }

  private handleAttack(): void {
    const result = this.sim.tryAttack();
    if (!result.swung) {
      return; // still on cooldown
    }
    this.showSwing();
    if (result.hit) {
      this.flashHound();
    }
    if (result.repelled) {
      this.showDiscovery('The ruin hound is driven off — the pocket falls quiet.');
      this.fadeOutHound();
      this.log.info('Benchmark combat: ruin hound repelled (benchmark stub)');
    }
  }

  /** A brief axe-swing arc in front of the Hunter's facing (transient effect). */
  private showSwing(): void {
    const { position, facing } = this.sim.hunter;
    const dir = directionToVector(facing);
    const reach = BENCHMARK.combat.attackRange;
    const slash = this.add
      .ellipse(
        position.x + dir.x * reach * 0.6,
        position.y - BODY_HEIGHT * 0.4 + dir.y * reach * 0.6,
        reach * 0.9,
        16,
        BENCHMARK.colors.attack,
        0.75,
      )
      .setRotation(Math.atan2(dir.y, dir.x))
      .setDepth(DEPTH.effect);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 160,
      onComplete: () => slash.destroy(),
    });
  }

  /** A quick bright flash on the hound to read a landed hit. */
  private flashHound(): void {
    const state = this.sim.hound;
    if (!state) {
      return;
    }
    const flash = this.add
      .ellipse(
        state.position.x,
        state.position.y - HOUND_BODY_HEIGHT * 0.4,
        HOUND_BODY_WIDTH,
        HOUND_BODY_HEIGHT,
        BENCHMARK.colors.hitFlash,
        0.85,
      )
      .setDepth(DEPTH.effect);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  /** Fades the hound out as it flees (the sim keeps stepping it off-screen). */
  private fadeOutHound(): void {
    const targets = [this.hound, this.houndShadow].filter(Boolean) as Phaser.GameObjects.GameObject[];
    if (targets.length > 0) {
      this.tweens.add({ targets, alpha: 0, duration: 500 });
    }
  }

  /** Brief, self-fading discovery line near the top of the screen. */
  private showDiscovery(text: string): void {
    const message = this.add
      .text(GAME_WIDTH / 2, 64, text, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: cssHex(BENCHMARK.colors.prompt),
        backgroundColor: 'rgba(12,15,12,0.82)',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui);
    this.tweens.add({
      targets: message,
      alpha: { from: 1, to: 0 },
      delay: 1200,
      duration: 700,
      onComplete: () => message.destroy(),
    });
  }

  /** Refreshes the satchel line from the simulation's pickup log. */
  private updatePossession(): void {
    if (!this.satchel) {
      return;
    }
    const counts = new Map<string, number>();
    for (const item of this.sim.collected) {
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    }
    if (counts.size === 0) {
      this.satchel.setVisible(false);
      return;
    }
    const parts = [...counts].map(
      ([kind, count]) => `${ITEM_LABEL[kind] ?? kind} ×${count}`,
    );
    this.satchel.setText(`Satchel: ${parts.join(', ')}`).setVisible(true);
  }

  private updatePrompt(): void {
    if (!this.prompt) {
      return;
    }
    const target = this.sim.target;
    if (!target) {
      this.prompt.setVisible(false);
      return;
    }
    const verb = INTERACT_LABEL[target.kind] ?? 'Use';
    const name = ITEM_LABEL[target.kind];
    const { bounds } = target;
    // Float just above the small ground marker for a pickup; above the top edge
    // for a full-tile obstruction.
    const anchorY = target.collectible ? bounds.y + bounds.height / 2 - 16 : bounds.y - 8;
    this.prompt
      .setText(name ? `[E] ${verb} · ${name}` : `[E] ${verb}`)
      .setPosition(bounds.x + bounds.width / 2, anchorY)
      .setVisible(true);
  }
}
