import type { GameContext } from '@core/context';
import { CONTEXT_REGISTRY_KEY } from '@core/context';
import type { GameEventBus } from '@core/events';
import type { Logger } from '@core/logger';
import { assertDefined } from '@shared/utils';
import Phaser from 'phaser';

/**
 * Base class for all scenes. Provides typed access to the {@link GameContext}
 * (logger, event bus, services) that was injected into the Phaser registry at
 * bootstrap. Feature scenes should extend this instead of `Phaser.Scene`.
 *
 * Note: `bus` is deliberately named to avoid shadowing `Phaser.Scene.events`
 * (the per-scene emitter).
 */
export abstract class BaseScene extends Phaser.Scene {
  private cachedLogger?: Logger;

  protected get context(): GameContext {
    return assertDefined(
      this.game.registry.get(CONTEXT_REGISTRY_KEY) as GameContext | undefined,
      'GameContext missing from registry. Bootstrap the game via createGame().',
    );
  }

  /** Logger scoped to this scene's key. */
  protected get log(): Logger {
    this.cachedLogger ??= this.context.logger.child(this.scene.key);
    return this.cachedLogger;
  }

  /** Application-wide event bus (not the per-scene Phaser emitter). */
  protected get bus(): GameEventBus {
    return this.context.events;
  }
}
