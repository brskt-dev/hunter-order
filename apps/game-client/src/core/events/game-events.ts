import type { EventBus } from './event-bus';

/**
 * Application-wide event catalogue. Add new cross-cutting events here so their
 * payloads stay typed at every emit/subscribe site.
 *
 * Gameplay events are intentionally absent — this file carries infrastructure
 * lifecycle events only.
 */
export interface GameEventMap {
  'game:ready': { startedAt: number };
  'scene:started': { key: string };
  'scene:shutdown': { key: string };
}

export type GameEventBus = EventBus<GameEventMap>;
