import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@core/config';
import type { GameContext } from '@core/context';
import { CONTEXT_REGISTRY_KEY } from '@core/context';
import { sceneClasses } from '@scenes';
import Phaser from 'phaser';

/**
 * Build the Phaser game configuration and inject the {@link GameContext} into
 * the game registry before scenes boot (via the `preBoot` callback), so scenes
 * can resolve it synchronously in their lifecycle methods.
 */
export function createGameConfig(
  parent: string,
  context: GameContext,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: COLORS.background,
    // Crisp pixel art: nearest-neighbor filtering, no antialiasing (GD-0005 #6).
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: sceneClasses,
    callbacks: {
      preBoot: (game) => {
        game.registry.set(CONTEXT_REGISTRY_KEY, context);
      },
    },
  };
}
