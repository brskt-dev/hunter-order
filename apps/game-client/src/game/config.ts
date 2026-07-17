import Phaser from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './constants';
import { BootScene } from './scenes/BootScene';

/**
 * Build the Phaser game configuration.
 *
 * Thin glue over Phaser: the values it relies on live in `./constants` (unit
 * tested there); this factory is exercised by the production build and a manual
 * run of the client.
 *
 * @param parent - DOM id of the container element that hosts the canvas.
 */
export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: BACKGROUND_COLOR,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [BootScene],
  };
}
