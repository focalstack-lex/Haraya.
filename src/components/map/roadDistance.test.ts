import { describe, expect, it } from 'vitest';
import { MAX_SPOTS, parseTableDistances, pickNearest } from './roadDistance';

describe('parseTableDistances', () => {
  it('reads the metres to each destination from the one source row', () => {
    // Bansalan to Lil' Ben and G&Co. in Digos, as the router answered on 2026-10-01
    const body = { code: 'Ok', distances: [[0, 16007.4, 17253.8]] };
    expect(parseTableDistances(body, 2)).toEqual([16007.4, 17253.8]);
  });

  it('keeps a null where the router found no road to a spot', () => {
    expect(parseTableDistances({ code: 'Ok', distances: [[0, null, 1200]] }, 2)).toEqual([null, 1200]);
  });

  it('rejects anything that is not a table for exactly these spots', () => {
    expect(parseTableDistances(null, 1)).toBeNull();
    expect(parseTableDistances('Ok', 1)).toBeNull();
    expect(parseTableDistances({ code: 'NoTable' }, 1)).toBeNull();
    expect(parseTableDistances({ code: 'Ok', distances: [] }, 1)).toBeNull();
    expect(parseTableDistances({ code: 'Ok', distances: [[0, 500]] }, 2)).toBeNull();
    expect(parseTableDistances({ code: 'Ok', distances: [[0, '500']] }, 1)).toBeNull();
    expect(parseTableDistances({ code: 'Ok', distances: [[0, -1]] }, 1)).toBeNull();
  });
});

describe('pickNearest', () => {
  const origin = { lat: 6.75, lng: 125.35 };
  const north = (id: string, km: number) => ({ id, lat: origin.lat + km / 111.32, lng: origin.lng });

  it('orders spots by straight line and stops at the service limit', () => {
    const spots = Array.from({ length: MAX_SPOTS + 5 }, (_, i) => north(`s${i}`, MAX_SPOTS + 5 - i));
    const picked = pickNearest(spots, origin);
    expect(picked).toHaveLength(MAX_SPOTS);
    expect(picked[0].id).toBe(`s${MAX_SPOTS + 4}`);
    expect(picked.map((spot) => spot.id)).not.toContain('s0');
  });

  it('keeps every spot when there are fewer than the limit', () => {
    expect(pickNearest([north('far', 9), north('near', 1)], origin).map((spot) => spot.id)).toEqual(['near', 'far']);
  });
});
