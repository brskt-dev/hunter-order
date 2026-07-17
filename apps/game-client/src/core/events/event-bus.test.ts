import { describe, expect, it, vi } from 'vitest';

import { EventBus } from './event-bus';

interface TestEvents {
  ping: { value: number };
  pong: void;
}

describe('EventBus', () => {
  it('delivers payloads to subscribers', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('ping', handler);
    bus.emit('ping', { value: 7 });

    expect(handler).toHaveBeenCalledWith({ value: 7 });
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    const off = bus.on('ping', handler);
    off();
    bus.emit('ping', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
    expect(bus.listenerCount('ping')).toBe(0);
  });

  it('once() fires a single time', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.once('ping', handler);
    bus.emit('ping', { value: 1 });
    bus.emit('ping', { value: 2 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 1 });
  });

  it('isolates handlers per event and supports clear()', () => {
    const bus = new EventBus<TestEvents>();
    const ping = vi.fn();
    const pong = vi.fn();

    bus.on('ping', ping);
    bus.on('pong', pong);
    bus.clear('ping');

    bus.emit('ping', { value: 1 });
    bus.emit('pong', undefined);

    expect(ping).not.toHaveBeenCalled();
    expect(pong).toHaveBeenCalledOnce();
  });

  it('tolerates handlers that unsubscribe during dispatch', () => {
    const bus = new EventBus<TestEvents>();
    const order: string[] = [];

    const off = bus.on('ping', () => {
      order.push('a');
      off();
    });
    bus.on('ping', () => order.push('b'));

    bus.emit('ping', { value: 1 });

    expect(order).toEqual(['a', 'b']);
  });
});
