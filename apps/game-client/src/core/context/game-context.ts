import type { Env } from '@core/config';
import { readEnv } from '@core/config';
import type { GameEventMap } from '@core/events';
import { EventBus } from '@core/events';
import type { Logger } from '@core/logger';
import { createLogger } from '@core/logger';
import { ServiceRegistry } from '@core/services';

/** Registry key under which the {@link GameContext} is stored on `Phaser.Game`. */
export const CONTEXT_REGISTRY_KEY = 'hunter-order:context';

/**
 * The composition root shared across the whole client. Built once at bootstrap
 * and injected into Phaser so every scene can reach cross-cutting services.
 */
export interface GameContext {
  readonly env: Env;
  readonly logger: Logger;
  readonly events: EventBus<GameEventMap>;
  readonly services: ServiceRegistry;
}

export interface CreateGameContextOptions {
  /** Override the environment snapshot (used by tests). */
  env?: Env;
  /** Override the root logger (used by tests). */
  logger?: Logger;
}

export function createGameContext(options: CreateGameContextOptions = {}): GameContext {
  const env = options.env ?? readEnv();
  const logger = options.logger ?? createLogger('app', { level: env.logLevel });
  return {
    env,
    logger,
    events: new EventBus<GameEventMap>(),
    services: new ServiceRegistry(),
  };
}
