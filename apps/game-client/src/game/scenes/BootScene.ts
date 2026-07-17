import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

/**
 * Minimal boot screen: a centered "Hunter Order" title over the solid
 * background, plus a live FPS counter that is only rendered in development.
 */
export class BootScene extends Phaser.Scene {
  private fpsText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Hunter Order', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#e6e6e6',
      })
      .setOrigin(0.5);

    if (import.meta.env.DEV) {
      this.fpsText = this.add.text(12, 12, 'FPS: --', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#7fdc7f',
      });
    }
  }

  update(): void {
    this.fpsText?.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }
}
