import type { GameContext } from '@core/context';
import { createGameContext } from '@core/context';
import Phaser from 'phaser';

import { createGameConfig } from './game-config';

export interface BootstrapResult {
  game: Phaser.Game;
  context: GameContext;
}

/**
 * Single entry point for starting the client: builds the {@link GameContext},
 * creates the Phaser game, and wires the app-level "game ready" event.
 *
 * @param parent - DOM id of the container element that hosts the canvas.
 */
export function createGame(parent: string): BootstrapResult {
  const context = createGameContext();
  context.logger.info('Bootstrapping Hunter Order client', {
    mode: context.env.mode,
    logLevel: context.env.logLevel,
  });

  const game = new Phaser.Game(createGameConfig(parent, context));

  game.events.once(Phaser.Core.Events.READY, () => {
    context.logger.debug('Phaser game ready');
    context.events.emit('game:ready', { startedAt: performance.now() });
  });

  return { game, context };
}
