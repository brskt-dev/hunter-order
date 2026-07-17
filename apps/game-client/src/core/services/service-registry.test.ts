import { describe, expect, it, vi } from 'vitest';

import type { Service } from './service';
import { ServiceRegistry } from './service-registry';

function fakeService(name: string, hooks: Partial<Service> = {}): Service {
  return { name, ...hooks };
}

describe('ServiceRegistry', () => {
  it('registers and resolves services', () => {
    const registry = new ServiceRegistry();
    const svc = fakeService('audio');

    registry.register(svc);

    expect(registry.has('audio')).toBe(true);
    expect(registry.get('audio')).toBe(svc);
    expect(registry.size).toBe(1);
  });

  it('throws when resolving an unknown service', () => {
    const registry = new ServiceRegistry();
    expect(() => registry.get('missing')).toThrowError('Service not registered: missing');
    expect(registry.tryGet('missing')).toBeUndefined();
  });

  it('rejects duplicate registration', () => {
    const registry = new ServiceRegistry();
    registry.register(fakeService('net'));
    expect(() => registry.register(fakeService('net'))).toThrowError(
      'Service already registered: net',
    );
  });

  it('inits in order and disposes in reverse', async () => {
    const registry = new ServiceRegistry();
    const calls: string[] = [];

    registry.register(fakeService('first', { init: () => void calls.push('init:first') }));
    registry.register(fakeService('second', { init: () => void calls.push('init:second') }));
    registry.register(
      fakeService('first-d', { dispose: () => void calls.push('dispose:first-d') }),
    );

    await registry.initAll();
    await registry.disposeAll();

    expect(calls).toEqual(['init:first', 'init:second', 'dispose:first-d']);
    expect(registry.size).toBe(0);
  });

  it('awaits async lifecycle hooks', async () => {
    const registry = new ServiceRegistry();
    const init = vi.fn().mockResolvedValue(undefined);
    registry.register(fakeService('async', { init }));

    await registry.initAll();

    expect(init).toHaveBeenCalledOnce();
  });
});
