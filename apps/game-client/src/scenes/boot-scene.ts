import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@core/config';
import { BaseScene, SceneKeys } from '@core/scenes';
import Phaser from 'phaser';

/**
 * Minimal boot screen: a centered "Hunter Order" title over the solid
 * background, plus a live FPS counter rendered only in development.
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
  }

  override update(): void {
    this.fpsText?.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }
}
