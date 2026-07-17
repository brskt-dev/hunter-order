import { describe, expect, it } from 'vitest';

import { assert, assertDefined } from './assert';

describe('assert', () => {
  it('does nothing when the condition is truthy', () => {
    expect(() => assert(1 === 1, 'nope')).not.toThrow();
  });

  it('throws with the message when the condition is falsy', () => {
    expect(() => assert(false, 'boom')).toThrowError('boom');
  });
});

describe('assertDefined', () => {
  it('returns the value when defined', () => {
    expect(assertDefined('x', 'msg')).toBe('x');
    expect(assertDefined(0, 'msg')).toBe(0);
    expect(assertDefined(false, 'msg')).toBe(false);
  });

  it('throws for null or undefined', () => {
    expect(() => assertDefined(null, 'missing')).toThrowError('missing');
    expect(() => assertDefined(undefined, 'missing')).toThrowError('missing');
  });
});
