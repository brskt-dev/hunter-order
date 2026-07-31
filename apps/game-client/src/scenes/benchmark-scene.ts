import { BENCHMARK, COLORS, GAME_HEIGHT, GAME_WIDTH } from '@core/config';
import { BaseScene, SceneKeys } from '@core/scenes';
import {
  BenchmarkSimulation,
  clampDeltaSeconds,
  createTileWorld,
  decayImpact,
  type Direction8,
  directionalFrameKey,
  directionToVector,
  type HoundState,
  type ImpactFeel,
  intentFromActions,
  type Interactable,
  isHitStopped,
  lookAheadTarget,
  movementActionsFromCodes,
  nearestCoveredDirection,
  type RuinHoundConfig,
  smoothTowards,
  tileCentre,
  type TileWorld,
  triggerImpact,
  type Vec2,
  ZERO,
  zeroImpact,
} from '@gameplay';
import Phaser from 'phaser';

import {
  BENCHMARK_ART_FRAMES,
  FRAGMENT_TEXTURE,
  HOUND_ART,
  HOUND_IDLE_BASE,
  HOUND_RUN_BASE,
  HOUND_RUN_FRAME_COUNT,
  houndRunFrameKey,
  PLAYER_ART,
  PLAYER_IDLE_BASE,
  PLAYER_PUNCH_BASE,
  PLAYER_PUNCH_DIRS,
  PLAYER_RUN_BASE,
  playerPunchFrameKey,
  playerRunFrameKey,
  PUNCH_FRAME_COUNT,
  RUN_FRAME_COUNT,
  TEST_ART,
  TEST_IDLE_BASE,
  TEST_PUNCH_BASE,
  TEST_PUNCH_DIRS,
  TEST_RUN_BASE,
  testPunchFrameKey,
  testRunFrameKey,
} from './benchmark-assets';
import { obliqueWallTiles } from './oblique-walls';

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

/**
 * One ruin hound's render state (GD-0006 pack): a separate runtime shadow + a
 * body inside a depth-sorted container, generalised from the original single
 * hound so `houndViews[i]` mirrors `sim.hounds[i]` (index-stable).
 */
interface HoundView {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  flash?: Phaser.GameObjects.Ellipse;
  sprite?: Phaser.GameObjects.Sprite;
  facingTick?: Phaser.GameObjects.Rectangle;
  prev?: Vec2;
}

/** Render state for the combat-sandbox stand-in "other player" Hunter (GD-0006). */
interface StandInView {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  /** Greybox fallback facing tick; undefined when the real TEST sprite is used. */
  facingTick?: Phaser.GameObjects.Rectangle;
  /** Real directional TEST Hunter sprite; undefined when falling back to the greybox. */
  sprite?: Phaser.GameObjects.Sprite;
}

/** The PvP "EM COMBATE" indicator (ring + label) that floats above the stand-in
 * only while `sim.pvpEngaged` (GD-0006 test-bed). */
interface CombatMarkerView {
  ring: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

export class BenchmarkScene extends BaseScene {
  private world!: TileWorld;
  private sim!: BenchmarkSimulation;
  private hunter!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  /** Fallback greybox facing tick; undefined when the real player sprite is used
   * (the sprite itself conveys facing). */
  private facingTick?: Phaser.GameObjects.Rectangle;
  /** Real directional Hunter sprite; undefined when falling back to the greybox. */
  private playerSprite?: Phaser.GameObjects.Sprite;
  /** True once the player run frames loaded, mirroring `houndRunReady`. */
  private playerRunReady = false;
  /** True while a punch animation is playing — holds the pose instead of
   * switching to run/idle each frame (cleared on `animationcomplete`). */
  private playerPunching = false;
  private playerPrev?: Vec2;
  private prompt?: Phaser.GameObjects.Text;
  private satchel?: Phaser.GameObjects.Text;
  private readonly interactableViews = new Map<
    string,
    Phaser.GameObjects.Image | Phaser.GameObjects.Shape
  >();
  private houndViews: HoundView[] = [];
  private houndRunReady = false;
  /** Index into `houndViews` that gets the per-hound recoil/flash/hit-stop hold
   * (the hound the axe actually connected with), or null when none. */
  private recoilHoundIndex: number | null = null;
  private standIn?: StandInView;
  /** True once the TEST Hunter run frames loaded, mirroring `playerRunReady`. */
  private standInRunReady = false;
  /** True while the stand-in's punch animation is playing — holds the pose
   * (mirrors `playerPunching`); cleared on `animationcomplete`. */
  private standInPunching = false;
  private standInPrev?: Vec2;
  private combatMarker?: CombatMarkerView;
  private dangerOverlay?: Phaser.GameObjects.Rectangle;
  private readonly pressedCodes = new Set<string>();
  private interactQueued = false;
  private attackQueued = false;
  private restartQueued = false;
  private lookAhead: Vec2 = ZERO;
  private combatIntensity = 0;
  private dangerAlpha = 0;
  private impact: ImpactFeel = zeroImpact();
  private recoilDir: Vec2 = ZERO;
  private shakeClock = 0;

  constructor() {
    super({ key: SceneKeys.Benchmark });
  }

  preload(): void {
    // Load the review-status real-art frames. A missing/failed load simply leaves
    // the texture absent, and the scene falls back to the greybox primitive.
    for (const frame of BENCHMARK_ART_FRAMES) {
      this.load.image(frame.key, frame.url);
    }
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
    // The combat-sandbox stand-in "other player" Hunter (GD-0006 test-bed): only
    // spawned when a tile is configured, sharing its tunables from BENCHMARK.sandbox.
    const otherHunterTile = BENCHMARK.sandbox.otherHunterTile;
    const standInConfig = otherHunterTile ? BENCHMARK.sandbox.otherHunter : null;
    const standInSpawn = otherHunterTile
      ? tileCentre(otherHunterTile.col, otherHunterTile.row, BENCHMARK.tileSize)
      : null;
    this.sim = new BenchmarkSimulation(
      this.world,
      {
        speed: BENCHMARK.movement.walkSpeed,
        footprintRadius: BENCHMARK.hunter.footprintRadius,
        interactRange: BENCHMARK.interaction.range,
        attackRange: BENCHMARK.combat.attackRange,
        attackArcCos: BENCHMARK.combat.attackArcCos,
        attackCooldownSeconds: BENCHMARK.combat.attackCooldownSeconds,
        pointBlankRange: BENCHMARK.combat.pointBlankRange,
      },
      BENCHMARK.combatModel,
      interactables,
      this.buildHoundConfigs(),
      standInConfig,
      standInSpawn,
      BENCHMARK.sandbox.pvpCombatSeconds,
    );
    this.lookAhead = ZERO;
    this.combatIntensity = 0;
    this.dangerAlpha = 0;
    this.impact = zeroImpact();
    this.recoilDir = ZERO;
    this.shakeClock = 0;
    this.recoilHoundIndex = null;
    this.attackQueued = false;
    // Reset the player-sprite transient state too, so a scene restart mid-punch
    // doesn't leave `playerPunching` stuck (freezing idle/run) or `playerPrev`
    // pointing at the pre-restart position (a spurious first-frame "moving").
    this.playerPunching = false;
    this.playerPrev = undefined;
    // Reset the stand-in sprite's transient state too (same reason): a restart
    // mid-punch or mid-chase must not leave `standInPunching` stuck or
    // `standInPrev` pointing at the pre-restart position.
    this.standInRunReady = false;
    this.standInPunching = false;
    this.standInPrev = undefined;
    this.interactableViews.clear();

    this.drawWorld();
    this.drawInteractables(interactables);
    this.registerPlayerAnimations();
    this.createHunter();
    this.registerHoundAnimations();
    this.createHounds();
    this.registerTestAnimations();
    this.createStandIn();
    this.createPrompt();
    this.setupCamera();
    this.setupInput();
    this.addHint();
    this.createSatchel();
    this.createDangerOverlay();
  }

  /**
   * The primary "ruin hound" (BENCHMARK.hound) plus one extra hound per
   * `BENCHMARK.sandbox.extraHoundTiles` — same tunables, but that tile becomes
   * its home/patrol point (a combat-sandbox test fixture, GD-0006; see the
   * config's own doc comment). An empty `extraHoundTiles` reproduces the
   * original 1-hound first-playable-loop.
   */
  private buildHoundConfigs(): RuinHoundConfig[] {
    const ts = BENCHMARK.tileSize;
    const h = BENCHMARK.hound;
    const withWaypoints = (waypoints: Vec2[]): RuinHoundConfig => ({
      speed: h.speed,
      footprintRadius: h.footprintRadius,
      waypoints,
      aggroRadius: h.aggroRadius,
      deAggroRadius: h.deAggroRadius,
      contactRadius: h.contactRadius,
      arriveEpsilon: h.arriveEpsilon,
      fleeSpeedMultiplier: h.fleeSpeedMultiplier,
    });
    const primary = withWaypoints(h.patrolTiles.map((t) => tileCentre(t.col, t.row, ts)));
    const extras = BENCHMARK.sandbox.extraHoundTiles.map((t) =>
      withWaypoints([tileCentre(t.col, t.row, ts)]),
    );
    return [primary, ...extras];
  }

  override update(_time: number, delta: number): void {
    if (!this.sim) {
      return;
    }
    const dt = clampDeltaSeconds(delta, BENCHMARK.movement.maxDeltaSeconds);
    this.impact = decayImpact(this.impact, dt, BENCHMARK.feel);
    this.shakeClock += dt;

    if (this.restartQueued) {
      this.restartQueued = false;
      this.scene.restart();
      return;
    }

    const actions = movementActionsFromCodes(this.pressedCodes);
    this.sim.update(actions, dt);

    // `standInStruck` is a ONE-FRAME pulse (never latched) — the stand-in landed
    // its punch on the player this frame (GD-0006 stub, visual/timer effect only,
    // no damage model). React immediately: the stand-in's punch pose + a brief
    // hit-flash on the player.
    if (this.sim.standInStruck) {
      this.handleStandInStruck();
    }

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
    // Sort the shadow with its owner (just under the body) so it stays grounded
    // in front of walls the Hunter is standing before — not hidden behind their
    // oblique front faces (which live in the entity depth band).
    this.shadow.setDepth(DEPTH.entity + position.y - 1);

    this.renderPlayer(position, facing);

    this.updatePrompt();
    this.renderHounds();
    this.renderStandIn();
    this.updateCombatCamera(intentFromActions(actions), dt);
  }

  /**
   * Mirrors the Hunter's facing/movement onto the real sprite (run while
   * moving, idle at rest, held during a punch) or the greybox facing tick —
   * the same choice `renderHounds` makes per hound. A punch in progress
   * (`playerPunching`) is left alone here; it releases on `animationcomplete`.
   */
  private renderPlayer(position: Vec2, facing: Direction8): void {
    const moving = this.playerPrev
      ? Math.hypot(position.x - this.playerPrev.x, position.y - this.playerPrev.y) > 0.05
      : false;
    this.playerPrev = position;

    if (this.playerSprite) {
      if (this.playerPunching) {
        return; // hold the punch pose; released by the animationcomplete handler
      }
      if (moving && this.playerRunReady) {
        this.playerSprite.play(directionalFrameKey(PLAYER_RUN_BASE, facing), true);
        return;
      }
      this.playerSprite.stop();
      const idleKey = directionalFrameKey(PLAYER_IDLE_BASE, facing);
      if (this.textures.exists(idleKey)) {
        this.playerSprite.setTexture(idleKey);
      }
      return;
    }

    if (this.facingTick) {
      const tick = directionToVector(facing);
      this.facingTick.setPosition(
        tick.x * FACING_TICK_RADIUS,
        -BODY_HEIGHT * 0.6 + tick.y * FACING_TICK_RADIUS,
      );
    }
  }

  /**
   * Mirrors each hound's logical state onto its sprite/primitive + shadow
   * (GD-0006 pack). The recoil/flash/hit-stop-hold hit feel applies ONLY to
   * `houndViews[recoilHoundIndex]` — the hound the axe actually connected
   * with; every other hound renders normally. The camera shake stays global
   * (`updateCombatCamera`).
   */
  private renderHounds(): void {
    const hounds = this.sim.hounds;
    for (let i = 0; i < hounds.length; i += 1) {
      const state = hounds[i];
      const view = this.houndViews[i];
      if (!view) {
        continue;
      }
      const isRecoiling = i === this.recoilHoundIndex;
      const recoil = isRecoiling ? BENCHMARK.feel.recoilPeakPx * this.impact.recoil : 0;
      view.container.setPosition(
        state.position.x + this.recoilDir.x * recoil,
        state.position.y + this.recoilDir.y * recoil,
      );
      view.container.setDepth(DEPTH.entity + state.position.y); // pivot.y sorting
      view.shadow.setPosition(state.position.x, state.position.y);
      view.shadow.setDepth(DEPTH.entity + state.position.y - 1); // grounded vs walls (Y-sort)
      view.flash?.setAlpha(isRecoiling ? this.impact.flash * 0.85 : 0);

      const holdForHitStop = isRecoiling && isHitStopped(this.impact);
      if (view.sprite && !holdForHitStop) {
        // Moving -> play the directional run loop; at rest -> the static idle pose.
        const moving = view.prev
          ? Math.hypot(state.position.x - view.prev.x, state.position.y - view.prev.y) > 0.05
          : false;
        view.prev = state.position;
        if (moving && this.houndRunReady) {
          view.sprite.play(directionalFrameKey(HOUND_RUN_BASE, state.facing), true);
        } else {
          view.sprite.stop();
          const idleKey = directionalFrameKey(HOUND_IDLE_BASE, state.facing);
          if (this.textures.exists(idleKey)) {
            view.sprite.setTexture(idleKey);
          }
        }
      } else if (!view.sprite && view.facingTick) {
        const tick = directionToVector(state.facing);
        view.facingTick.setPosition(
          tick.x * HOUND_TICK_RADIUS,
          -HOUND_BODY_HEIGHT * 0.5 + tick.y * HOUND_TICK_RADIUS,
        );
      }
    }
  }

  /**
   * Mirrors the stand-in Hunter's logical state onto its container + shadow
   * (GD-0006 test-bed), the same way `update()` does for the real Hunter —
   * plus the run/idle/punch sprite choice `renderPlayer` makes for the player,
   * and the "EM COMBATE" marker while `sim.pvpEngaged`.
   */
  private renderStandIn(): void {
    const state = this.sim.otherHunter;
    if (!state || !this.standIn) {
      return;
    }
    const { position, facing } = state;
    this.standIn.container.setPosition(position.x, position.y);
    this.standIn.container.setDepth(DEPTH.entity + position.y); // pivot.y sorting
    this.standIn.shadow.setPosition(position.x, position.y);
    this.standIn.shadow.setDepth(DEPTH.entity + position.y - 1); // grounded vs walls (Y-sort)

    const moving = this.standInPrev
      ? Math.hypot(position.x - this.standInPrev.x, position.y - this.standInPrev.y) > 0.05
      : false;
    this.standInPrev = position;

    if (this.standIn.sprite) {
      if (!this.standInPunching) {
        if (moving && this.standInRunReady) {
          this.standIn.sprite.play(directionalFrameKey(TEST_RUN_BASE, facing), true);
        } else {
          this.standIn.sprite.stop();
          const idleKey = directionalFrameKey(TEST_IDLE_BASE, facing);
          if (this.textures.exists(idleKey)) {
            this.standIn.sprite.setTexture(idleKey);
          }
        }
      }
    } else if (this.standIn.facingTick) {
      const tick = directionToVector(facing);
      this.standIn.facingTick.setPosition(
        tick.x * FACING_TICK_RADIUS,
        -BODY_HEIGHT * 0.6 + tick.y * FACING_TICK_RADIUS,
      );
    }

    this.renderCombatMarker(position);
  }

  /** Positions/shows the "EM COMBATE" ring + label above the stand-in only
   * while `sim.pvpEngaged`; hidden otherwise (GD-0006 test-bed). */
  private renderCombatMarker(position: Vec2): void {
    const marker = this.combatMarker;
    if (!marker) {
      return;
    }
    const engaged = this.sim.pvpEngaged;
    marker.ring.setVisible(engaged);
    marker.label.setVisible(engaged);
    if (!engaged) {
      return;
    }
    const markerY = position.y - BODY_HEIGHT - 12;
    marker.ring.setPosition(position.x, markerY);
    marker.label.setPosition(position.x, markerY - 10);
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
    const intensityRate = this.sim.threatEngaged ? cc.intensitySmoothing : cc.exitSmoothing;
    this.combatIntensity = approach(this.combatIntensity, engaged, intensityRate, dt);

    this.cameras.main.setZoom(lerpScalar(cc.exploreZoom, cc.combatZoom, this.combatIntensity));

    const laScale = lerpScalar(1, cc.lookAheadCombatScale, this.combatIntensity);
    const target = lookAheadTarget(intent, BENCHMARK.camera.lookAheadDistance * laScale);
    this.lookAhead = smoothTowards(this.lookAhead, target, BENCHMARK.camera.lookAheadSmoothing, dt);
    const shakeMag = BENCHMARK.feel.shakePeakPx * this.impact.shake;
    const shakeX = shakeMag * Math.sin(this.shakeClock * BENCHMARK.feel.shakeFrequency);
    const shakeY = shakeMag * Math.sin(this.shakeClock * BENCHMARK.feel.shakeFrequency * 1.3 + 1.7);
    this.cameras.main.setFollowOffset(-(this.lookAhead.x + shakeX), -(this.lookAhead.y + shakeY));

    const dangerTarget = this.sim.inDanger ? DANGER_MAX_ALPHA : 0;
    const dangerRate = this.sim.inDanger ? cc.intensitySmoothing : cc.exitSmoothing;
    this.dangerAlpha = approach(this.dangerAlpha, dangerTarget, dangerRate, dt);
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
    const { colors, tileSize, oblique } = BENCHMARK;
    const worldWidth = this.world.bounds.width;
    const worldHeight = this.world.bounds.height;

    // Base grass fill.
    this.add
      .rectangle(0, 0, worldWidth, worldHeight, colors.ground)
      .setOrigin(0, 0)
      .setDepth(DEPTH.ground);

    // Tiled-floor read: a subtle 2-tone grass checker + a dirt path. Placeholder
    // until real ground tiles arrive (PixelLab, paid). One Graphics, many fills.
    const floor = this.add.graphics().setDepth(DEPTH.groundDecal);
    floor.fillStyle(colors.groundAlt, 0.5);
    for (let row = 0; row < this.world.rows; row += 1) {
      for (let col = 0; col < this.world.cols; col += 1) {
        if ((col + row) % 2 === 0) {
          floor.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
      }
    }
    floor.fillStyle(colors.dirt, 0.9);
    for (const tile of oblique.dirtTiles) {
      floor.fillRect(tile.col * tileSize, tile.row * tileSize, tileSize, tileSize);
    }

    // Subtle marker for the safe starting pocket.
    this.add
      .circle(this.world.spawn.x, this.world.spawn.y, tileSize * 0.4, colors.spawn, 0.25)
      .setDepth(DEPTH.groundDecal);

    this.drawObliqueWalls();
  }

  /**
   * 2.5D walls (presentation only; collision stays the logical AABB — GD-0004).
   * Every solid tile gets a flat top face; tiles with an empty south neighbour
   * also get a raised front face, depth-sorted in the entity band by its base
   * edge so the Hunter/hound pass in front of walls below them and behind walls
   * above them. Per-tile fronts keep occlusion correct on tall walls.
   */
  private drawObliqueWalls(): void {
    const { colors, tileSize, oblique } = BENCHMARK;
    const height = oblique.wallHeight;
    const { tops, fronts } = obliqueWallTiles(BENCHMARK.solidTiles);
    const exposed = new Set(fronts.map((c) => `${c.col},${c.row}`));

    // Walls live in the entity depth band, sorted by each tile's south (ground)
    // edge: entities in front (south) draw over them; entities behind (north) are
    // occluded. The height is drawn UPWARD *within* the tile (a top strip + a
    // front strip) — it never intrudes into the walkable tile in front, so a
    // Hunter standing against a wall stays cleanly on the ground. Presentation
    // only; collision is the logical tile AABB (GD-0004).
    for (const cell of tops) {
      const x = cell.col * tileSize;
      const y = cell.row * tileSize;
      const depth = DEPTH.entity + (y + tileSize); // south/ground edge of the tile
      if (!exposed.has(`${cell.col},${cell.row}`)) {
        this.add
          .rectangle(x, y, tileSize, tileSize, colors.wallTop)
          .setOrigin(0, 0)
          .setDepth(depth);
        continue;
      }
      const faceY = y + tileSize - height;
      this.add
        .rectangle(x, y, tileSize, tileSize - height, colors.wallTop)
        .setOrigin(0, 0)
        .setDepth(depth);
      this.add
        .rectangle(x, faceY, tileSize, height, colors.wallFront)
        .setOrigin(0, 0)
        .setDepth(depth + 0.1);
      this.add
        .rectangle(x, faceY, tileSize, 2, colors.wallEdge)
        .setOrigin(0, 0)
        .setDepth(depth + 0.2);
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
   * A discreet ground item on the item-drop layer. Uses the real fragment sprite
   * when its texture loaded; otherwise a small weathered shard primitive (rotated
   * square + accent stroke). No baked shadow (per the item spec).
   */
  private drawFragment(it: Interactable): Phaser.GameObjects.Image | Phaser.GameObjects.Shape {
    const cx = it.bounds.x + it.bounds.width / 2;
    const cy = it.bounds.y + it.bounds.height / 2;
    if (this.textures.exists(FRAGMENT_TEXTURE)) {
      return this.add.image(cx, cy, FRAGMENT_TEXTURE).setDepth(DEPTH.itemDrop);
    }
    const { colors } = BENCHMARK;
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

    let children: Phaser.GameObjects.GameObject[];
    if (this.playerArtReady()) {
      // Real sprite; feet-pivot aligned to the container origin (logical position).
      // It conveys facing directly, so the greybox facing tick is dropped.
      this.playerRunReady = this.textures.exists(playerRunFrameKey('s', 0));
      this.playerSprite = this.add
        .sprite(0, 0, directionalFrameKey(PLAYER_IDLE_BASE, this.sim.hunter.facing))
        .setOrigin(0.5, PLAYER_ART.pivotY / PLAYER_ART.canvas.height);
      this.playerSprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
        if (anim.key.startsWith(PLAYER_PUNCH_BASE)) {
          this.playerPunching = false;
        }
      });
      children = [this.playerSprite];
    } else {
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
      children = [body, this.facingTick];
    }

    this.hunter = this.add
      .container(spawn.x, spawn.y, children)
      .setDepth(DEPTH.entity + spawn.y);
  }

  /** True when the real PLAYER Hunter idle art loaded (else render the greybox). */
  private playerArtReady(): boolean {
    return this.textures.exists(directionalFrameKey(PLAYER_IDLE_BASE, 's'));
  }

  /**
   * Registers the PLAYER Hunter's run (all 8 dirs, looping) and punch (covered
   * dirs only, non-looping) animations — mirrors `registerHoundAnimations`.
   */
  private registerPlayerAnimations(): void {
    if (!this.playerArtReady() || !this.textures.exists(playerRunFrameKey('s', 0))) {
      return;
    }
    const dirs: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (const dir of dirs) {
      const key = directionalFrameKey(PLAYER_RUN_BASE, dir);
      if (this.anims.exists(key)) {
        continue; // shared across scene restarts
      }
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < RUN_FRAME_COUNT; i += 1) {
        frames.push({ key: playerRunFrameKey(dir, i) });
      }
      this.anims.create({ key, frames, frameRate: 9, repeat: -1 });
    }

    for (const dir of PLAYER_PUNCH_DIRS) {
      const key = directionalFrameKey(PLAYER_PUNCH_BASE, dir);
      if (this.anims.exists(key) || !this.textures.exists(playerPunchFrameKey(dir, 0))) {
        continue;
      }
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < PUNCH_FRAME_COUNT; i += 1) {
        frames.push({ key: playerPunchFrameKey(dir, i) });
      }
      this.anims.create({ key, frames, frameRate: 12, repeat: 0 });
    }
  }

  /** True when the real ruin-hound idle art loaded (else render the primitive). */
  private houndArtReady(): boolean {
    return this.textures.exists(directionalFrameKey(HOUND_IDLE_BASE, 's'));
  }

  /** Registers one looping run animation per direction from the loaded run frames. */
  private registerHoundAnimations(): void {
    if (!this.houndArtReady() || !this.textures.exists(houndRunFrameKey('s', 0))) {
      return;
    }
    const dirs: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (const dir of dirs) {
      const key = directionalFrameKey(HOUND_RUN_BASE, dir);
      if (this.anims.exists(key)) {
        continue; // shared across scene restarts
      }
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < HOUND_RUN_FRAME_COUNT; i += 1) {
        frames.push({ key: houndRunFrameKey(dir, i) });
      }
      this.anims.create({ key, frames, frameRate: 9, repeat: -1 });
    }
  }

  /**
   * Builds one `HoundView` per `sim.hounds` entry (index-stable, GD-0006 pack).
   * An empty `sim.hounds` (no hound configured) leaves `houndViews` empty.
   */
  private createHounds(): void {
    this.houndRunReady = this.houndArtReady() && this.textures.exists(houndRunFrameKey('s', 0));
    this.houndViews = this.sim.hounds.map((state) => this.createHoundView(state));
  }

  /**
   * One ruin hound's view: a separate runtime shadow + a body inside a
   * depth-sorted container. The body is the real directional sprite when its
   * art loaded, otherwise the greybox wide-rectangle + nose tick.
   */
  private createHoundView(state: HoundState): HoundView {
    const { colors, hound } = BENCHMARK;
    const { position } = state;

    const shadow = this.add
      .ellipse(
        position.x,
        position.y,
        hound.footprintRadius * 2,
        hound.footprintRadius,
        colors.footprint,
        0.5,
      )
      .setDepth(DEPTH.shadow);

    // Envelope-driven hit flash (alpha set each frame in renderHounds, only for
    // the hound that was actually hit). A container child so it rides the body
    // — including the recoil offset.
    const flash = this.add
      .ellipse(0, -HOUND_BODY_HEIGHT * 0.4, HOUND_BODY_WIDTH, HOUND_BODY_HEIGHT, colors.hitFlash, 1)
      .setAlpha(0);

    let sprite: Phaser.GameObjects.Sprite | undefined;
    let facingTick: Phaser.GameObjects.Rectangle | undefined;
    let children: Phaser.GameObjects.GameObject[];
    if (this.houndArtReady()) {
      // Real sprite; feet-pivot aligned to the container origin (logical position).
      // It plays the directional run animation while moving (see renderHounds).
      sprite = this.add
        .sprite(0, 0, directionalFrameKey(HOUND_IDLE_BASE, state.facing))
        .setOrigin(0.5, HOUND_ART.pivotY / HOUND_ART.canvas.height);
      children = [sprite, flash];
    } else {
      const body = this.add
        .rectangle(0, -HOUND_BODY_HEIGHT / 2, HOUND_BODY_WIDTH, HOUND_BODY_HEIGHT, colors.hound)
        .setStrokeStyle(2, colors.houndStroke);
      facingTick = this.add.rectangle(
        0,
        -HOUND_BODY_HEIGHT / 2,
        HOUND_TICK_SIZE,
        HOUND_TICK_SIZE,
        colors.houndStroke,
      );
      children = [body, facingTick, flash];
    }

    const container = this.add
      .container(position.x, position.y, children)
      .setDepth(DEPTH.entity + position.y);

    return { container, shadow, flash, sprite, facingTick };
  }

  /** True when the real TEST Hunter (Eduardo, the stand-in) idle art loaded
   * (else render the greybox), mirroring `playerArtReady`. */
  private testArtReady(): boolean {
    return this.textures.exists(directionalFrameKey(TEST_IDLE_BASE, 's'));
  }

  /**
   * Registers the TEST Hunter's run (all 8 dirs, looping) and punch
   * (`TEST_PUNCH_DIRS` only, non-looping) animations — mirrors
   * `registerPlayerAnimations`.
   */
  private registerTestAnimations(): void {
    if (!this.testArtReady() || !this.textures.exists(testRunFrameKey('s', 0))) {
      return;
    }
    const dirs: Direction8[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (const dir of dirs) {
      const key = directionalFrameKey(TEST_RUN_BASE, dir);
      if (this.anims.exists(key)) {
        continue; // shared across scene restarts
      }
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < RUN_FRAME_COUNT; i += 1) {
        frames.push({ key: testRunFrameKey(dir, i) });
      }
      this.anims.create({ key, frames, frameRate: 9, repeat: -1 });
    }

    for (const dir of TEST_PUNCH_DIRS) {
      const key = directionalFrameKey(TEST_PUNCH_BASE, dir);
      if (this.anims.exists(key) || !this.textures.exists(testPunchFrameKey(dir, 0))) {
        continue;
      }
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < PUNCH_FRAME_COUNT; i += 1) {
        frames.push({ key: testPunchFrameKey(dir, i) });
      }
      this.anims.create({ key, frames, frameRate: 12, repeat: 0 });
    }
  }

  /**
   * The combat-sandbox stand-in "other player" Hunter (GD-0006 test-bed): the
   * real Eduardo sprite (idle/run/punch) when its art loaded, mirroring
   * `createHunter`, else the greybox distinct-colour Hunter + facing tick.
   * Also builds the "EM COMBATE" marker that floats above it. Omitted
   * entirely when no stand-in is configured (`sim.otherHunter` is null).
   */
  private createStandIn(): void {
    const state = this.sim.otherHunter;
    if (!state) {
      return;
    }
    const { colors, sandbox } = BENCHMARK;
    const { position } = state;
    const footprintRadius = sandbox.otherHunter.footprintRadius;

    const shadow = this.add
      .ellipse(position.x, position.y, footprintRadius * 2, footprintRadius, colors.footprint, 0.5)
      .setDepth(DEPTH.shadow);

    let sprite: Phaser.GameObjects.Sprite | undefined;
    let facingTick: Phaser.GameObjects.Rectangle | undefined;
    let children: Phaser.GameObjects.GameObject[];
    if (this.testArtReady()) {
      // Real sprite; feet-pivot aligned to the container origin (logical position).
      this.standInRunReady = this.textures.exists(testRunFrameKey('s', 0));
      sprite = this.add
        .sprite(0, 0, directionalFrameKey(TEST_IDLE_BASE, state.facing))
        .setOrigin(0.5, TEST_ART.pivotY / TEST_ART.canvas.height);
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
        if (anim.key.startsWith(TEST_PUNCH_BASE)) {
          this.standInPunching = false;
        }
      });
      children = [sprite];
    } else {
      const body = this.add
        .rectangle(0, -BODY_HEIGHT / 2, BODY_WIDTH, BODY_HEIGHT, colors.otherHunter)
        .setStrokeStyle(1, 0x000000, 0.4);
      facingTick = this.add.rectangle(
        0,
        -BODY_HEIGHT * 0.6 + FACING_TICK_RADIUS,
        FACING_TICK_SIZE,
        FACING_TICK_SIZE,
        colors.otherHunterFacing,
      );
      children = [body, facingTick];
    }

    const container = this.add
      .container(position.x, position.y, children)
      .setDepth(DEPTH.entity + position.y);

    this.standIn = { container, shadow, sprite, facingTick };
    this.createCombatMarker();
  }

  /** Builds the (initially hidden) "EM COMBATE" ring + label shown above the
   * stand-in only while `sim.pvpEngaged` (GD-0006 test-bed, world-space UI). */
  private createCombatMarker(): void {
    const { combatMarker } = BENCHMARK.colors;
    const ring = this.add
      .circle(0, 0, 10, combatMarker, 0)
      .setStrokeStyle(2, combatMarker, 1)
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
    const label = this.add
      .text(0, 0, 'EM COMBATE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: cssHex(combatMarker),
        backgroundColor: 'rgba(12,15,12,0.75)',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
    this.combatMarker = { ring, label };
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
    if (resolved.collectible) {
      // A small pop + fade "trace" on the fragment as it is taken (not a loot burst).
      if (view) {
        const pop = BENCHMARK.feel.pickupPopScale;
        this.tweens.add({
          targets: view,
          scaleX: pop,
          scaleY: pop,
          alpha: 0,
          duration: BENCHMARK.feel.pickupPopMs,
          ease: 'Quad.easeOut',
          onComplete: () => view.setVisible(false),
        });
      }
      this.showDiscovery(DISCOVERY_MESSAGE[resolved.kind] ?? 'You found something.');
      this.updatePossession();
      this.log.info('Benchmark pickup: collected item', resolved.id);
    } else {
      // The axe-cut reads as a connected hit: a brief chop flash as the overgrowth clears.
      if (view) {
        this.tweens.add({
          targets: view,
          alpha: 0,
          duration: 180,
          onComplete: () => view.setVisible(false),
        });
      }
      this.showCutFeedback(resolved);
      this.log.info('Benchmark interaction: cleared obstruction', resolved.id);
    }
  }

  private handleAttack(): void {
    const result = this.sim.tryAttack();
    if (!result.swung) {
      return; // still on cooldown
    }
    this.showSwing();
    this.startPlayerPunch();
    if (result.hit) {
      this.registerHit(result.hitIndex);
    }
    if (result.repelled && result.hitIndex !== null) {
      this.showDiscovery('The ruin hound is driven off — the pocket falls quiet.');
      this.fadeOutHound(result.hitIndex);
      this.log.info('Benchmark combat: ruin hound repelled (benchmark stub)');
    }
  }

  /** Presentation-only hit feedback: peak the juice envelopes, capture the recoil
   * direction (the Hunter's facing) and record which hound gets the per-hound
   * recoil/flash/hit-stop hold (GD-0006 pack). Never touches logical state
   * (GD-0004). */
  private registerHit(hitIndex: number | null): void {
    this.impact = triggerImpact(this.impact, BENCHMARK.feel);
    this.recoilDir = directionToVector(this.sim.hunter.facing);
    this.recoilHoundIndex = hitIndex;
  }

  /**
   * Starts the player's punch pose on a connecting/whiffed swing alike (any
   * `result.swung`), picking the nearest covered direction to the Hunter's
   * current facing. Held via `playerPunching` until `animationcomplete`
   * releases it back to run/idle in `renderPlayer`. No-op for the greybox
   * fallback or if the punch animation somehow isn't registered.
   */
  private startPlayerPunch(): void {
    if (!this.playerSprite) {
      return;
    }
    const dir = nearestCoveredDirection(this.sim.hunter.facing, PLAYER_PUNCH_DIRS);
    const key = directionalFrameKey(PLAYER_PUNCH_BASE, dir);
    if (!this.anims.exists(key)) {
      return;
    }
    this.playerPunching = true;
    this.playerSprite.play(key, true);
  }

  /**
   * Reacts to the stand-in landing its punch on the player this frame
   * (`sim.standInStruck`, a one-frame pulse — GD-0006 stub, visual/timer effect
   * only, no damage model): plays the stand-in's punch pose and flashes the
   * player. Never touches logical state.
   */
  private handleStandInStruck(): void {
    const state = this.sim.otherHunter;
    if (state) {
      this.startStandInPunch(state.facing);
    }
    this.showPlayerHitFlash();
  }

  /**
   * Starts the stand-in's punch pose, picking the nearest covered direction to
   * its current facing — mirrors `startPlayerPunch`. Held via `standInPunching`
   * until `animationcomplete` releases it back to run/idle in `renderStandIn`.
   * No-op for the greybox fallback or if the punch animation isn't registered.
   */
  private startStandInPunch(facing: Direction8): void {
    const sprite = this.standIn?.sprite;
    if (!sprite) {
      return;
    }
    const dir = nearestCoveredDirection(facing, TEST_PUNCH_DIRS);
    const key = directionalFrameKey(TEST_PUNCH_BASE, dir);
    if (!this.anims.exists(key)) {
      return;
    }
    this.standInPunching = true;
    sprite.play(key, true);
  }

  /** A brief, restrained flash over the player Hunter where the stand-in's punch
   * lands, so the hit reads as connecting — the same tween'd-overlay idiom as
   * `showCutFeedback`, on the effect layer above the Hunter. */
  private showPlayerHitFlash(): void {
    const { position } = this.sim.hunter;
    const flash = this.add
      .ellipse(
        position.x,
        position.y - BODY_HEIGHT * 0.55,
        BODY_WIDTH * 1.15,
        BODY_HEIGHT * 0.9,
        BENCHMARK.colors.hitFlash,
        0.75,
      )
      .setDepth(DEPTH.effect);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
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

  /** A brief, restrained flash where overgrowth is cut, so the axe reads as connecting. */
  private showCutFeedback(target: Interactable): void {
    const cx = target.bounds.x + target.bounds.width / 2;
    const cy = target.bounds.y + target.bounds.height / 2;
    const flash = this.add
      .rectangle(cx, cy, target.bounds.width * 0.9, target.bounds.height * 0.9, BENCHMARK.colors.hitFlash, 0.5)
      .setDepth(DEPTH.effect);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 160,
      onComplete: () => flash.destroy(),
    });
  }

  /** Fades the repelled hound's view out as it flees (the sim keeps stepping it off-screen). */
  private fadeOutHound(index: number): void {
    const view = this.houndViews[index];
    if (!view) {
      return;
    }
    this.tweens.add({ targets: [view.container, view.shadow], alpha: 0, duration: 500 });
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
