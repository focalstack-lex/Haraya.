import { describe, expect, it } from 'vitest';
import { NEARBY_RADIUS_KM, splitByDistance } from './nearby';

const ORIGIN = { lat: 6.75, lng: 125.36 };
// A spot dy km north of the origin
const north = (id: string, dy: number) => ({ id, lat: ORIGIN.lat + dy / 111.32, lng: ORIGIN.lng });

describe('splitByDistance', () => {
  it('ranks spots nearest first and splits them at the nearby radius', () => {
    const { nearby, farther } = splitByDistance([north('far', 9), north('mid', 2.5), north('close', 0.4)], ORIGIN);
    expect(nearby.map((entry) => entry.spot.id)).toEqual(['close', 'mid']);
    expect(farther.map((entry) => entry.spot.id)).toEqual(['far']);
    expect(nearby[0].km).toBeCloseTo(0.4, 1);
  });

  it('keeps a spot right on the radius as nearby', () => {
    const { nearby } = splitByDistance([north('edge', NEARBY_RADIUS_KM - 0.01)], ORIGIN);
    expect(nearby).toHaveLength(1);
  });

  it('returns nothing nearby when every spot is out of range', () => {
    const { nearby, farther } = splitByDistance([north('a', 12), north('b', 30)], ORIGIN);
    expect(nearby).toEqual([]);
    expect(farther.map((entry) => entry.spot.id)).toEqual(['a', 'b']);
  });

  it('handles an empty catalog', () => {
    expect(splitByDistance([], ORIGIN)).toEqual({ nearby: [], farther: [] });
  });
});
