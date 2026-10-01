import { describe, expect, it } from 'vitest';
import { APPROXIMATE_M, fixQuality, formatAccuracy, GOOD_FIX_M, isBetterFix, PRECISE_M } from './locationQuality';

describe('fixQuality', () => {
  it('calls a GPS or Wi-Fi fix precise, a cell-tower fix approximate and a network guess rough', () => {
    expect(fixQuality(12)).toBe('precise');
    expect(fixQuality(PRECISE_M)).toBe('precise');
    expect(fixQuality(1_800)).toBe('approximate');
    expect(fixQuality(APPROXIMATE_M)).toBe('approximate');
    // Digos shown in Davao City: a 45 km miss
    expect(fixQuality(45_000)).toBe('rough');
  });

  it('treats a missing radius as rough', () => {
    expect(fixQuality(Number.NaN)).toBe('rough');
    expect(fixQuality(-1)).toBe('rough');
    expect(fixQuality(Number.POSITIVE_INFINITY)).toBe('rough');
  });

  it('keeps the good-fix bar inside the precise band', () => {
    expect(GOOD_FIX_M).toBeLessThanOrEqual(PRECISE_M);
  });
});

describe('isBetterFix', () => {
  it('takes the first fix, then only a tighter one', () => {
    expect(isBetterFix(null, { accuracy: 2_000 })).toBe(true);
    expect(isBetterFix({ accuracy: 2_000 }, { accuracy: 25 })).toBe(true);
    expect(isBetterFix({ accuracy: 25 }, { accuracy: 25 })).toBe(false);
    expect(isBetterFix({ accuracy: 25 }, { accuracy: 300 })).toBe(false);
  });

  it('never keeps a fix without a radius over one with', () => {
    expect(isBetterFix({ accuracy: Number.NaN }, { accuracy: 500 })).toBe(true);
    expect(isBetterFix({ accuracy: 500 }, { accuracy: Number.NaN })).toBe(false);
  });
});

describe('formatAccuracy', () => {
  it('rounds metres to tens and kilometres to one decimal, then whole', () => {
    expect(formatAccuracy(4)).toBe('about 10 m');
    expect(formatAccuracy(43)).toBe('about 40 m');
    expect(formatAccuracy(1_000)).toBe('about 1 km');
    expect(formatAccuracy(1_850)).toBe('about 1.9 km');
    expect(formatAccuracy(24_600)).toBe('about 25 km');
  });

  it('admits when the radius is unknown', () => {
    expect(formatAccuracy(Number.NaN)).toBe('an unknown distance');
  });
});
