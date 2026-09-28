import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters, CHECK_IN_RADIUS_M, isWithinCheckIn, SESSION_EXIT_RADIUS_M } from './geo';

// Green Coffee, Digos City (Google listing /g/11f3tw8x95)
const venue = { lat: 6.7548589, lng: 125.3555501 };
/** Meters per degree of latitude on the 6,371 km sphere. */
const M_PER_DEG_LAT = (Math.PI * 6_371_000) / 180;

describe('calculateDistanceMeters', () => {
  it('is zero for the same point', () => {
    expect(calculateDistanceMeters(venue.lat, venue.lng, venue.lat, venue.lng)).toBe(0);
  });

  it('matches one degree of latitude', () => {
    expect(calculateDistanceMeters(7, 125, 8, 125)).toBeCloseTo(M_PER_DEG_LAT, 3);
  });

  it('is symmetric', () => {
    const a = calculateDistanceMeters(venue.lat, venue.lng, 7.0731, 125.6128);
    const b = calculateDistanceMeters(7.0731, 125.6128, venue.lat, venue.lng);
    expect(a).toBeCloseTo(b, 6);
  });

  it('measures Digos to Davao City downtown at about 45 km', () => {
    const km = calculateDistanceMeters(venue.lat, venue.lng, 7.0731, 125.6128) / 1000;
    expect(km).toBeGreaterThan(44);
    expect(km).toBeLessThan(46);
  });
});

describe('check-in geofence', () => {
  const north = (meters: number) => ({ lat: venue.lat + meters / M_PER_DEG_LAT, lng: venue.lng });

  it('uses a 120 m check-in radius and a wider 150 m exit radius', () => {
    expect(CHECK_IN_RADIUS_M).toBe(120);
    expect(SESSION_EXIT_RADIUS_M).toBeGreaterThan(CHECK_IN_RADIUS_M);
  });

  it('accepts a device 119 m away and exactly on the line', () => {
    expect(isWithinCheckIn(north(119), venue)).toBe(true);
    expect(isWithinCheckIn(north(119.999), venue)).toBe(true);
  });

  it('rejects a device 121 m away', () => {
    expect(isWithinCheckIn(north(121), venue)).toBe(false);
  });

  it('stays accurate to within a meter at the threshold', () => {
    const d = calculateDistanceMeters(venue.lat, venue.lng, north(120).lat, north(120).lng);
    expect(Math.abs(d - 120)).toBeLessThan(1);
  });
});
