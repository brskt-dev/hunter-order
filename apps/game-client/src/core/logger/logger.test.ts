import { describe, expect, it, vi } from 'vitest';

import type { LogSink } from './logger';
import { createLogger } from './logger';

function createFakeSink(): LogSink {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('createLogger', () => {
  it('emits messages at or above the configured level', () => {
    const sink = createFakeSink();
    const log = createLogger('test', { level: 'warn', sink });

    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');

    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).toHaveBeenCalledOnce();
    expect(sink.error).toHaveBeenCalledOnce();
  });

  it('drops everything at the silent level', () => {
    const sink = createFakeSink();
    const log = createLogger('test', { level: 'silent', sink });

    log.error('nope');

    expect(sink.error).not.toHaveBeenCalled();
  });

  it('prefixes messages with the scope and forwards extra args', () => {
    const sink = createFakeSink();
    const log = createLogger('boot', { level: 'debug', sink });

    log.info('hello', 42);

    expect(sink.info).toHaveBeenCalledWith('[boot]', 'hello', 42);
  });

  it('nests scopes with child()', () => {
    const sink = createFakeSink();
    const log = createLogger('app', { level: 'debug', sink }).child('scene');

    log.info('x');

    expect(sink.info).toHaveBeenCalledWith('[app:scene]', 'x');
  });
});
