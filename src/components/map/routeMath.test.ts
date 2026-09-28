import { describe, expect, it } from 'vitest';
import { OFF_ROUTE_KM, progressAlongRoute, routeMinutesLeft, routeProgress } from './routeMath';

const ORIGIN = { lat: 7.07, lng: 125.61 };
const KX = 111.32 * Math.cos((ORIGIN.lat * Math.PI) / 180);
// A point dx km east and dy km north of the origin
const at = (dx: number, dy: number) => ({ lat: ORIGIN.lat + dy / 111.32, lng: ORIGIN.lng + dx / KX });

// An L-shaped street route: 1 km east, then 1 km north
const ROUTE = [at(0, 0), at(1, 0), at(1, 1)];

describe('progressAlongRoute', () => {
  it('measures the full route from its start', () => {
    const p = progressAlongRoute(ROUTE, at(0, 0));
    expect(p.remainingKm).toBeCloseTo(2, 1);
    expect(p.offRouteKm).toBeLessThan(0.001);
  });

  it('counts along the streets, not the straight line', () => {
    // Halfway along the first street: 0.5 + 1 km left, while the straight line is about 1.1 km
    const p = progressAlongRoute(ROUTE, at(0.5, 0));
    expect(p.remainingKm).toBeCloseTo(1.5, 1);
    expect(p.ahead).toHaveLength(3);
  });

  it('snaps a visitor beside the street onto it', () => {
    const p = progressAlongRoute(ROUTE, at(1.02, 0.5));
    expect(p.remainingKm).toBeCloseTo(0.5, 1);
    expect(p.offRouteKm).toBeCloseTo(0.02, 2);
    expect(p.offRouteKm).toBeLessThan(OFF_ROUTE_KM);
    expect(p.ahead).toHaveLength(2);
  });

  it('reports a visitor far from the route as off route', () => {
    const p = progressAlongRoute(ROUTE, at(0.3, 0.4));
    expect(p.offRouteKm).toBeGreaterThan(OFF_ROUTE_KM);
  });
});

describe('routeMinutesLeft and routeProgress', () => {
  it('walks 1.2 km in 15 minutes at 4.8 km/h, and 0 once arrived', () => {
    expect(routeMinutesLeft(1.2)).toBe(15);
    expect(routeMinutesLeft(0.02)).toBe(0);
    expect(routeMinutesLeft(0.05)).toBe(1);
  });

  it('clamps progress between 0 and 1', () => {
    expect(routeProgress(2, 1.5)).toBeCloseTo(0.25);
    expect(routeProgress(2, 3)).toBe(0);
    expect(routeProgress(0.01, 0)).toBe(1);
  });
});
