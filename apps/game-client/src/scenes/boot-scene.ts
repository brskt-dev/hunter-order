import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@core/config';
import { BaseScene, SceneKeys } from '@core/scenes';
import Phaser from 'phaser';

// Benchmark-only wiring: how long the boot splash is shown before handing off
// to the playable greybox scene. Not a gameplay value.
const BOOT_SPLASH_MS = 600;

/**
 * Minimal boot screen: a centered "Hunter Order" title over the solid
 * background, plus a live FPS counter rendered only in development. After a
 * short splash it hands off to {@link SceneKeys.Benchmark}.
 *
 * Doubles as the reference example for wiring a scene onto the client
 * infrastructure (context logger + event bus via {@link BaseScene}).
 */
export class BootScene extends BaseScene {
  private fpsText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.Boot });
  }

  create(): void {
    this.log.info('Boot scene created');
    this.bus.emit('scene:started', { key: this.scene.key });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Hunter Order', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: COLORS.title,
      })
      .setOrigin(0.5);

    if (this.context.env.isDev) {
      this.fpsText = this.add.text(12, 12, 'FPS: --', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: COLORS.accent,
      });
    }

    this.time.delayedCall(BOOT_SPLASH_MS, () => this.scene.start(SceneKeys.Benchmark));
  }

  override update(): void {
    this.fpsText?.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }
}
