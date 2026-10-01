import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchBestFix, type BestFixOptions, type Fix } from './bestFix';

/** A stand-in for navigator.geolocation: the test pushes fixes and errors into the one open watch. */
function fakeGeolocation() {
  let success: PositionCallback | null = null;
  let failure: PositionErrorCallback | null = null;
  const cleared: number[] = [];
  const geolocation = {
    watchPosition: (ok: PositionCallback, fail?: PositionErrorCallback | null) => {
      success = ok;
      failure = fail ?? null;
      return 7;
    },
    clearWatch: (id: number) => cleared.push(id),
    getCurrentPosition: () => {},
  } as unknown as Geolocation;
  return {
    geolocation,
    cleared,
    fix: (lat: number, lng: number, accuracy: number) =>
      success?.({ coords: { latitude: lat, longitude: lng, accuracy } } as GeolocationPosition),
    error: (code: number) => failure?.({ code, message: '' } as GeolocationPositionError),
  };
}

function setup(overrides: Partial<BestFixOptions> = {}) {
  const device = fakeGeolocation();
  const fixes: Fix[] = [];
  const settled: Fix[] = [];
  const errors: string[] = [];
  const cancel = watchBestFix({
    highAccuracy: true,
    maximumAgeMs: 0,
    timeoutMs: 20_000,
    windowMs: 15_000,
    isGoodEnough: (best) => best.accuracy <= 50,
    onFix: (best) => fixes.push(best),
    onSettled: (best) => settled.push(best),
    onError: (failure) => errors.push(failure),
    geolocation: device.geolocation,
    ...overrides,
  });
  return { device, fixes, settled, errors, cancel };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('watchBestFix', () => {
  it('stops at once on a tight first fix', () => {
    const { device, fixes, settled } = setup();
    device.fix(6.75, 125.35, 12);
    expect(fixes).toHaveLength(1);
    expect(settled).toEqual([{ lat: 6.75, lng: 125.35, accuracy: 12 }]);
    expect(device.cleared).toEqual([7]);
  });

  it('replaces a network fix with the GPS fix that follows it', () => {
    // Digos visitor: the network says Davao City, then the GPS locks on
    const { device, fixes, settled } = setup();
    device.fix(7.07, 125.61, 45_000);
    expect(settled).toHaveLength(0);
    device.fix(6.75, 125.35, 14);
    expect(fixes.map((fix) => fix.accuracy)).toEqual([45_000, 14]);
    expect(settled).toEqual([{ lat: 6.75, lng: 125.35, accuracy: 14 }]);
  });

  it('ignores a wider fix after a tighter one', () => {
    const { device, fixes } = setup();
    device.fix(6.75, 125.35, 300);
    device.fix(7.07, 125.61, 2_000);
    expect(fixes.map((fix) => fix.accuracy)).toEqual([300]);
  });

  it('settles on the tightest fix held when the window closes', () => {
    const { device, settled } = setup();
    device.fix(6.78, 125.21, 1_800);
    device.fix(6.78, 125.22, 400);
    vi.advanceTimersByTime(14_999);
    expect(settled).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(settled).toEqual([{ lat: 6.78, lng: 125.22, accuracy: 400 }]);
    expect(device.cleared).toEqual([7]);
  });

  it('keeps listening through a dropout after a fix', () => {
    const { device, settled, errors } = setup();
    device.fix(6.78, 125.21, 1_800);
    device.error(3);
    device.error(2);
    expect(errors).toEqual([]);
    device.fix(6.78, 125.22, 20);
    expect(settled.map((fix) => fix.accuracy)).toEqual([20]);
  });

  it('reports no fix and a refused permission', () => {
    const missing = setup();
    missing.device.error(3);
    expect(missing.errors).toEqual(['unavailable']);
    const refused = setup();
    refused.device.fix(6.78, 125.21, 1_800);
    refused.device.error(1);
    expect(refused.errors).toEqual(['denied']);
    expect(refused.settled).toEqual([]);
    vi.advanceTimersByTime(20_000);
    expect(refused.settled).toEqual([]);
  });

  it('calls nothing back once cancelled', () => {
    const { device, fixes, settled, cancel } = setup();
    device.fix(6.78, 125.21, 1_800);
    cancel();
    device.fix(6.78, 125.22, 10);
    vi.advanceTimersByTime(20_000);
    expect(fixes).toHaveLength(1);
    expect(settled).toEqual([]);
    expect(device.cleared).toEqual([7]);
  });

  it('settles on the first fix when any fix will do', () => {
    const { device, settled } = setup({ highAccuracy: false, isGoodEnough: () => true });
    device.fix(6.78, 125.21, 1_800);
    expect(settled.map((fix) => fix.accuracy)).toEqual([1_800]);
  });
});
