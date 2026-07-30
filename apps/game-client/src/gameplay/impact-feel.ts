// Presentation-only "juice" envelopes for the benchmark feel pass (GD-0004).
// Pure and framework-free: the scene passes `dt` and a config, and maps the
// returned 0..1 envelopes + hit-stop clock onto pixels. Never affects logical
// state — it only describes how visual feedback decays over time.

export interface ImpactFeel {
  /** 0..1 normalized camera-shake intensity. */
  readonly shake: number;
  /** 0..1 normalized impact-flash intensity. */
  readonly flash: number;
  /** 0..1 normalized hound visual-recoil intensity. */
  readonly recoil: number;
  /** Seconds of visual hit-stop remaining (> 0 => micro-hold active). */
  readonly hitStop: number;
}

export interface ImpactFeelConfig {
  readonly hitStopSeconds: number;
  readonly shakeDecayRate: number;
  readonly flashDecayRate: number;
  readonly recoilDecayRate: number;
}

/** Peak value every impulse is raised to on a landed hit. */
const PEAK = 1;

const REST: ImpactFeel = { shake: 0, flash: 0, recoil: 0, hitStop: 0 };

/** Exponential decay toward 0 (matches the scene's `approach(x, 0, rate, dt)`). */
const decay = (value: number, rate: number, dt: number): number =>
  dt <= 0 || rate <= 0 ? value : Math.max(0, value * Math.exp(-rate * dt));

/** Zeroed state (no active feel). */
export function zeroImpact(): ImpactFeel {
  return REST;
}

/**
 * Raise every impulse to its peak (saturating — never stacks above `PEAK`) and
 * re-arm the hit-stop clock. Called when the hand-axe lands a hit.
 */
export function triggerImpact(prev: ImpactFeel, cfg: ImpactFeelConfig): ImpactFeel {
  return {
    shake: Math.max(prev.shake, PEAK),
    flash: Math.max(prev.flash, PEAK),
    recoil: Math.max(prev.recoil, PEAK),
    hitStop: cfg.hitStopSeconds,
  };
}

/**
 * Advance one frame: each envelope decays exponentially toward 0 (never below 0);
 * the hit-stop clock counts down by `dt`, clamped at 0.
 */
export function decayImpact(prev: ImpactFeel, dt: number, cfg: ImpactFeelConfig): ImpactFeel {
  return {
    shake: decay(prev.shake, cfg.shakeDecayRate, dt),
    flash: decay(prev.flash, cfg.flashDecayRate, dt),
    recoil: decay(prev.recoil, cfg.recoilDecayRate, dt),
    hitStop: Math.max(0, prev.hitStop - dt),
  };
}

/** True while the visual hit-stop micro-hold is active. */
export function isHitStopped(state: ImpactFeel): boolean {
  return state.hitStop > 0;
}
