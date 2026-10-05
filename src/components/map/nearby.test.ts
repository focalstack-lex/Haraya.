import { describe, expect, it } from 'vitest';
import { NEARBY_RADIUS_KM, describeDistance, splitByDistance, walkMinutesFor } from './nearby';

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

  it('carries the road distance along without letting it move the split', () => {
    // 3.9 km as the crow flies but 5.5 km by road: still inside the ring, shown as 5.5 km
    const roads = new Map([['edge', 5.5]]);
    const { nearby, farther } = splitByDistance([north('edge', 3.9), north('far', 9)], ORIGIN, NEARBY_RADIUS_KM, roads);
    expect(nearby.map((entry) => entry.spot.id)).toEqual(['edge']);
    expect(nearby[0].roadKm).toBe(5.5);
    expect(farther[0].roadKm).toBeNull();
  });
});

describe('splitByDistance with road distances', () => {
  it('orders each side by the distance it shows', () => {
    // b is nearer as the crow flies, but a river crossing makes it the longer drive
    const roads = new Map([
      ['a', 1.4],
      ['b', 2.5],
      ['c', 9.5],
      ['d', 7.0],
    ]);
    const { nearby, farther } = splitByDistance(
      [north('a', 1.2), north('b', 1.0), north('c', 6), north('d', 6.5)],
      ORIGIN,
      NEARBY_RADIUS_KM,
      roads
    );
    expect(nearby.map((entry) => entry.spot.id)).toEqual(['a', 'b']);
    expect(farther.map((entry) => entry.spot.id)).toEqual(['d', 'c']);
  });
});

describe('describeDistance', () => {
  it('shows the road figure when known and says so, else the straight line and says that', () => {
    expect(describeDistance({ km: 16.2, roadKm: 20.8 })).toEqual({ value: '20.8 km', note: 'by road' });
    expect(describeDistance({ km: 16.2, roadKm: null })).toEqual({ value: '16.2 km', note: 'straight line' });
  });
});

describe('walkMinutesFor', () => {
  it('walks the shorter of the road and the straight line with a detour allowance', () => {
    expect(walkMinutesFor({ km: 1, roadKm: 1.1 })).toBe(15);
    // A one-way loop makes the drive 3 km; on foot it is still about 1.3 km
    expect(walkMinutesFor({ km: 1, roadKm: 3 })).toBe(20);
    // 1 km straight is about 1.3 km of streets: 15.6 minutes, rounded up to the next 5
    expect(walkMinutesFor({ km: 1, roadKm: null })).toBe(20);
    expect(walkMinutesFor({ km: 0.5, roadKm: null })).toBe(10);
  });
});
