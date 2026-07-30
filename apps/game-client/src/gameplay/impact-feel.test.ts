import { describe, expect, it } from 'vitest';

import {
  decayImpact,
  type ImpactFeelConfig,
  isHitStopped,
  triggerImpact,
  zeroImpact,
} from './impact-feel';

const CFG: ImpactFeelConfig = {
  hitStopSeconds: 0.05,
  shakeDecayRate: 9,
  flashDecayRate: 8,
  recoilDecayRate: 12,
};

describe('impact-feel', () => {
  it('starts at rest', () => {
    expect(zeroImpact()).toEqual({ shake: 0, flash: 0, recoil: 0, hitStop: 0 });
  });

  it('peaks all impulses and arms the hit-stop on trigger', () => {
    const s = triggerImpact(zeroImpact(), CFG);
    expect(s.shake).toBe(1);
    expect(s.flash).toBe(1);
    expect(s.recoil).toBe(1);
    expect(s.hitStop).toBe(CFG.hitStopSeconds);
  });

  it('saturates at 1 on re-trigger (does not stack) and re-arms hit-stop', () => {
    const decayed = decayImpact(triggerImpact(zeroImpact(), CFG), 0.02, CFG);
    const again = triggerImpact(decayed, CFG);
    expect(again.shake).toBe(1);
    expect(again.flash).toBe(1);
    expect(again.recoil).toBe(1);
    expect(again.hitStop).toBe(CFG.hitStopSeconds);
  });

  it('decays the envelopes toward zero without going negative', () => {
    const start = triggerImpact(zeroImpact(), CFG);
    const next = decayImpact(start, 0.05, CFG);
    expect(next.shake).toBeGreaterThan(0);
    expect(next.shake).toBeLessThan(start.shake);
    expect(next.flash).toBeLessThan(start.flash);
    expect(next.recoil).toBeLessThan(start.recoil);

    let s = start;
    for (let i = 0; i < 200; i += 1) {
      s = decayImpact(s, 0.05, CFG);
    }
    expect(s.shake).toBeGreaterThanOrEqual(0);
    expect(s.shake).toBeCloseTo(0, 3);
    expect(s.flash).toBeCloseTo(0, 3);
    expect(s.recoil).toBeCloseTo(0, 3);
  });

  it('counts the hit-stop clock down by dt, clamped at zero', () => {
    const start = triggerImpact(zeroImpact(), CFG); // hitStop = 0.05
    const mid = decayImpact(start, 0.02, CFG);
    expect(mid.hitStop).toBeCloseTo(0.03, 5);
    const past = decayImpact(mid, 0.1, CFG);
    expect(past.hitStop).toBe(0);
  });

  it('reports hit-stop only while the clock is positive', () => {
    expect(isHitStopped(triggerImpact(zeroImpact(), CFG))).toBe(true);
    expect(isHitStopped(zeroImpact())).toBe(false);
  });
});
