import { beforeEach, describe, expect, it } from 'vitest';
import {
  CACHE_TTL_MS,
  fitsHere,
  MAX_SPOTS,
  parseTableDistances,
  pickNearest,
  readCache,
  REFETCH_AFTER_KM,
  resetRoadDistanceState,
  writeCache,
  type RoadDistances,
} from './roadDistance';

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

describe('answers kept between visits to the map', () => {
  const here = { lat: 6.7545, lng: 125.354 };
  const north = (km: number) => ({ lat: here.lat + km / 111.32, lng: here.lng });
  const answer = (origin = here, ids = 'a,b', at = 1_000): RoadDistances => ({ origin, ids, byId: new Map([['a', 1.2]]), at });

  beforeEach(() => resetRoadDistanceState());

  it('fits the same catalog from a few steps away, not from across town', () => {
    expect(fitsHere(answer(), north(REFETCH_AFTER_KM / 2), 'a,b')).toBe(true);
    expect(fitsHere(answer(), north(REFETCH_AFTER_KM * 2), 'a,b')).toBe(false);
    expect(fitsHere(answer(), here, 'a,b,c')).toBe(false);
    expect(fitsHere(null, here, 'a,b')).toBe(false);
  });

  it('gives back a fresh answer and forgets a stale one', () => {
    writeCache(answer());
    expect(readCache(here, 'a,b', 1_000 + CACHE_TTL_MS - 1)?.byId.get('a')).toBe(1.2);
    expect(readCache(here, 'a,b', 1_000 + CACHE_TTL_MS)).toBeNull();
    expect(readCache(north(5), 'a,b', 2_000)).toBeNull();
  });

  it('keeps only the newest few answers', () => {
    for (let i = 0; i < 12; i++) writeCache(answer(north(i), 'a,b', 1_000 + i));
    expect(readCache(north(0), 'a,b', 2_000)).toBeNull();
    expect(readCache(north(11), 'a,b', 2_000)).not.toBeNull();
  });
});
