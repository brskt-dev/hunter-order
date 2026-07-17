import type { Env } from '@core/config';
import { EventBus } from '@core/events';
import { createLogger } from '@core/logger';
import { ServiceRegistry } from '@core/services';
import { describe, expect, it } from 'vitest';

import { createGameContext } from './game-context';

const testEnv: Env = {
  mode: 'test',
  isDev: false,
  isProd: false,
  logLevel: 'silent',
};

describe('createGameContext', () => {
  it('wires the injected env and logger', () => {
    const logger = createLogger('test', { level: 'silent' });
    const ctx = createGameContext({ env: testEnv, logger });

    expect(ctx.env).toBe(testEnv);
    expect(ctx.logger).toBe(logger);
  });

  it('provides a fresh event bus and service registry', () => {
    const a = createGameContext({ env: testEnv });
    const b = createGameContext({ env: testEnv });

    expect(a.events).toBeInstanceOf(EventBus);
    expect(a.services).toBeInstanceOf(ServiceRegistry);
    expect(a.events).not.toBe(b.events);
    expect(a.services).not.toBe(b.services);
  });
});
