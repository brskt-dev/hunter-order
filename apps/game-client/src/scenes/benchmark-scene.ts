import { BENCHMARK, COLORS, GAME_HEIGHT } from '@core/config';
import { BaseScene, SceneKeys } from '@core/scenes';
import {
  BenchmarkSimulation,
  clampDeltaSeconds,
  createTileWorld,
  type Direction8,
  intentFromActions,
  type Interactable,
  lookAheadTarget,
  type MovementAction,
  smoothTowards,
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
 * The world is rendered with an identity logical->screen projection for now;
 * the oblique presentation is a later art-pass concern and, per GD-0004, must
 * never affect logical distance or collision.
 *
 * The simulation is BENCHMARK-ONLY and NON-AUTHORITATIVE (no server transport
 * exists yet — that needs its own ADR).
 */

// Render layer depths, following the approved layer stack (asset-specification):
// ground / ground-decal / low-object / shadow / entity-body / world-ui.
const DEPTH = {
  ground: 0,
  groundDecal: 10,
  lowObject: 100,
  shadow: 200,
  entity: 1000, // + pivot.y so entities sort front-to-back by their feet
  worldUi: 90_000,
  ui: 100_000,
} as const;

// Hunter placeholder geometry (drawn from the feet pivot upward).
const BODY_WIDTH = 26;
const BODY_HEIGHT = 46;
const FACING_TICK_SIZE = 8;
const FACING_TICK_RADIUS = 14;

const DIAGONAL = Math.SQRT1_2;
const DIRECTION_OFFSET: Record<Direction8, Vec2> = {
  n: { x: 0, y: -1 },
  ne: { x: DIAGONAL, y: -DIAGONAL },
  e: { x: 1, y: 0 },
  se: { x: DIAGONAL, y: DIAGONAL },
  s: { x: 0, y: 1 },
  sw: { x: -DIAGONAL, y: DIAGONAL },
  w: { x: -1, y: 0 },
  nw: { x: -DIAGONAL, y: -DIAGONAL },
};

// Contextual prompt verb per interactable kind (benchmark placeholder).
const INTERACT_LABEL: Record<string, string> = { overgrowth: 'Cut' };
const cssHex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

interface InputKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
  restart: Phaser.Input.Keyboard.Key;
}

export class BenchmarkScene extends BaseScene {
  private world!: TileWorld;
  private sim!: BenchmarkSimulation;
  private hunter!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private facingTick!: Phaser.GameObjects.Rectangle;
  private keys?: InputKeys;
  private lookAhead: Vec2 = ZERO;
  private readonly interactableViews = new Map<string, Phaser.GameObjects.Rectangle>();
  private prompt?: Phaser.GameObjects.Text;

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
      },
      interactables,
    );
    this.lookAhead = ZERO;
    this.interactableViews.clear();

    this.drawWorld();
    this.drawInteractables(interactables);
    this.createHunter();
    this.createPrompt();
    this.setupCamera();
    this.setupInput();
    this.addHint();
  }

  override update(_time: number, delta: number): void {
    if (!this.sim) {
      return;
    }
    const dt = clampDeltaSeconds(delta, BENCHMARK.movement.maxDeltaSeconds);

    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.scene.restart();
      return;
    }

    const actions = this.readActions();
    this.sim.update(actions, dt);

    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this.handleInteract();
    }

    const { position, facing } = this.sim.hunter;
    this.hunter.setPosition(position.x, position.y);
    this.hunter.setDepth(DEPTH.entity + position.y); // pivot.y sorting
    this.shadow.setPosition(position.x, position.y);

    const tick = DIRECTION_OFFSET[facing];
    this.facingTick.setPosition(
      tick.x * FACING_TICK_RADIUS,
      -BODY_HEIGHT * 0.6 + tick.y * FACING_TICK_RADIUS,
    );

    this.updatePrompt();

    const target = lookAheadTarget(intentFromActions(actions), BENCHMARK.camera.lookAheadDistance);
    this.lookAhead = smoothTowards(this.lookAhead, target, BENCHMARK.camera.lookAheadSmoothing, dt);
    this.cameras.main.setFollowOffset(-this.lookAhead.x, -this.lookAhead.y);
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
      const view = this.add
        .rectangle(it.bounds.x, it.bounds.y, it.bounds.width, it.bounds.height, colors.overgrowth)
        .setOrigin(0, 0)
        .setStrokeStyle(2, colors.overgrowthStroke)
        .setDepth(DEPTH.lowObject + 1);
      this.interactableViews.set(it.id, view);
    }
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

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.world.bounds.width, this.world.bounds.height);
    camera.setRoundPixels(true);
    camera.startFollow(this.hunter, true, BENCHMARK.camera.followLerp, BENCHMARK.camera.followLerp);
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      this.log.warn('Keyboard plugin unavailable; benchmark movement disabled');
      return;
    }
    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    }) as InputKeys;

    // Losing focus releases held keys so the Hunter never "runs away" while the
    // player is typing elsewhere (GD-0004 controls: focus loss releases keys).
    const releaseKeys = (): void => {
      keyboard.resetKeys();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, releaseKeys);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, releaseKeys);
      this.bus.emit('scene:shutdown', { key: this.scene.key });
    });
  }

  private addHint(): void {
    this.add
      .text(
        12,
        GAME_HEIGHT - 22,
        'WASD / Arrows: move   ·   E: interact   ·   R: restart   ·   greybox benchmark (non-authoritative)',
        { fontFamily: 'monospace', fontSize: '12px', color: COLORS.accent },
      )
      .setScrollFactor(0)
      .setDepth(DEPTH.ui);
  }

  private handleInteract(): void {
    const cleared = this.sim.tryInteract();
    if (!cleared) {
      return;
    }
    const view = this.interactableViews.get(cleared.id);
    if (view) {
      this.tweens.add({
        targets: view,
        alpha: 0,
        duration: 180,
        onComplete: () => view.setVisible(false),
      });
    }
    this.log.info('Benchmark interaction: cleared obstruction', cleared.id);
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
    const label = INTERACT_LABEL[target.kind] ?? 'Use';
    this.prompt
      .setText(`[E] ${label}`)
      .setPosition(target.bounds.x + target.bounds.width / 2, target.bounds.y - 8)
      .setVisible(true);
  }

  private readActions(): ReadonlySet<MovementAction> {
    const actions = new Set<MovementAction>();
    const keys = this.keys;
    if (!keys) {
      return actions;
    }
    if (keys.up.isDown || keys.w.isDown) {
      actions.add('move-north');
    }
    if (keys.down.isDown || keys.s.isDown) {
      actions.add('move-south');
    }
    if (keys.left.isDown || keys.a.isDown) {
      actions.add('move-west');
    }
    if (keys.right.isDown || keys.d.isDown) {
      actions.add('move-east');
    }
    return actions;
  }
}
