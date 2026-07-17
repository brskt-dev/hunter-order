import { describe, expect, it } from 'vitest';

import { parseLogLevel } from './env';

describe('parseLogLevel', () => {
  it('accepts valid levels', () => {
    expect(parseLogLevel('debug', 'warn')).toBe('debug');
    expect(parseLogLevel('silent', 'warn')).toBe('silent');
  });

  it('falls back for unknown or missing values', () => {
    expect(parseLogLevel('verbose', 'warn')).toBe('warn');
    expect(parseLogLevel(undefined, 'info')).toBe('info');
    expect(parseLogLevel('', 'error')).toBe('error');
  });
});
