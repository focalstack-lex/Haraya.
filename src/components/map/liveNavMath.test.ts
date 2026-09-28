import { describe, expect, it } from 'vitest';
import { bearingDegrees, formatRemaining, hasArrived, nextHeading, walkMinutesLeft, walkProgress } from './liveNavMath';

const ORIGIN = { lat: 7.07, lng: 125.61 };
// About 1.11 km per 0.01 degree of latitude
const north = (km: number) => ({ lat: ORIGIN.lat + km / 111.2, lng: ORIGIN.lng });
const east = (km: number) => ({ lat: ORIGIN.lat, lng: ORIGIN.lng + km / (111.2 * Math.cos((ORIGIN.lat * Math.PI) / 180)) });

describe('walkMinutesLeft', () => {
  it('applies the detour factor at 4.8 km/h', () => {
    // 1 km straight is 1.3 km walked, about 16 minutes
    expect(walkMinutesLeft(1)).toBe(16);
  });

  it('never shows 0 minutes before arrival, and 0 once arrived', () => {
    expect(walkMinutesLeft(0.05)).toBe(1);
    expect(walkMinutesLeft(0.02)).toBe(0);
  });
});

describe('walkProgress', () => {
  it('runs from 0 at the start to 1 at arrival', () => {
    expect(walkProgress(1, 1)).toBe(0);
    expect(walkProgress(1, 0.03)).toBe(1);
    expect(walkProgress(1, 0.515)).toBeCloseTo(0.5, 2);
  });

  it('clamps when the visitor walks away from the destination', () => {
    expect(walkProgress(1, 1.4)).toBe(0);
  });

  it('is complete when the first fix is already at the destination', () => {
    expect(walkProgress(0.01, 0.01)).toBe(1);
  });
});

describe('hasArrived', () => {
  it('triggers inside 30 metres', () => {
    expect(hasArrived(0.029)).toBe(true);
    expect(hasArrived(0.031)).toBe(false);
  });
});

describe('bearingDegrees', () => {
  it('points north and east', () => {
    expect(bearingDegrees(ORIGIN, north(1))).toBeCloseTo(0, 0);
    expect(bearingDegrees(ORIGIN, east(1))).toBeCloseTo(90, 0);
  });
});

describe('nextHeading', () => {
  it('prefers the device heading', () => {
    expect(nextHeading(45, ORIGIN, north(1), null)).toBe(45);
  });

  it('falls back to the direction of travel', () => {
    expect(nextHeading(null, ORIGIN, east(0.05), null)).toBeCloseTo(90, 0);
  });

  it('keeps the last heading when the move is only GPS jitter', () => {
    expect(nextHeading(null, ORIGIN, north(0.001), 120)).toBe(120);
  });
});

describe('formatRemaining', () => {
  it('uses metres under a kilometre and kilometres above', () => {
    expect(formatRemaining(0.354)).toBe('350 m');
    expect(formatRemaining(1.26)).toBe('1.3 km');
  });
});
