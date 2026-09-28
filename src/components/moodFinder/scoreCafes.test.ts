import { describe, expect, it } from 'vitest';
import { scoreCafes, type ScoreContext } from './scoreCafes';
import { EMPTY_REQUEST, type MoodRequest } from './moods';
import type { AmenityKey, Cafe, WeeklyHours } from '../../types/coffee';

const ORIGIN = { lat: 7.07, lng: 125.61 };
// About 1.1 km of latitude per 0.01 degree
const kmNorth = (km: number) => ({ lat: ORIGIN.lat + km / 111, lng: ORIGIN.lng });

const allWeek = (open: string | null, close: string | null): WeeklyHours => ({
  Monday: { open, close },
  Tuesday: { open, close },
  Wednesday: { open, close },
  Thursday: { open, close },
  Friday: { open, close },
  Saturday: { open, close },
  Sunday: { open, close },
});

let seq = 0;
const cafe = (over: Partial<Cafe> & { km?: number; amenities?: AmenityKey[] } = {}): Cafe => {
  seq += 1;
  const { km = 1, ...rest } = over;
  return {
    id: `cafe-${seq}`,
    handle: `cafe${seq}`,
    name: `Cafe ${seq}`,
    isRoastery: false,
    city: 'Davao City',
    district: 'Poblacion',
    address: 'Somewhere',
    ...kmNorth(km),
    images: ['x.jpg'],
    logoUrl: 'logo.jpg',
    description: '',
    signature: `Signature ${seq}`,
    menu: [],
    amenities: [],
    wifiMbps: 10,
    brewMethods: [],
    priceLevel: 2,
    hours: allWeek('07:00', '22:00'),
    vibeTags: [],
    verified: false,
    saveCount: 0,
    viewCount: 0,
    dateAdded: '2026-01-01',
    ...rest,
  };
};

// Monday 2026-09-28, 14:00
const ctx = (over: Partial<ScoreContext> = {}): ScoreContext => ({
  origin: ORIGIN,
  now: new Date(2026, 8, 28, 14, 0),
  weather: null,
  savedIds: [],
  recentIds: [],
  ...over,
});

const req = (over: Partial<MoodRequest>): MoodRequest => ({ ...EMPTY_REQUEST, ...over });

describe('scoreCafes', () => {
  it('drops cafes missing a must-have', () => {
    const pets = cafe({ amenities: ['petFriendly'] });
    const noPets = cafe();
    const { matches } = scoreCafes([pets, noPets], req({ mustHaves: ['pets'] }), ctx());
    expect(matches.map((m) => m.cafe.id)).toEqual([pets.id]);
  });

  it('requires 25 Mbps for the Wi-Fi must-have and cites the speed', () => {
    const slow = cafe({ wifiMbps: 22 });
    const fast = cafe({ wifiMbps: 85 });
    const { matches } = scoreCafes([slow, fast], req({ mustHaves: ['wifi'] }), ctx());
    expect(matches.map((m) => m.cafe.id)).toEqual([fast.id]);
    expect(matches[0].reasons).toContain('85 Mbps Wi-Fi');
  });

  it('drops cafes closing within two hours for a focused session', () => {
    const closingSoon = cafe({ hours: allWeek('07:00', '15:30') });
    const openLate = cafe({ hours: allWeek('07:00', '22:00') });
    const { matches } = scoreCafes([closingSoon, openLate], req({ mood: 'focused' }), ctx());
    expect(matches.map((m) => m.cafe.id)).toEqual([openLate.id]);
    expect(matches[0].closesAt).toBe('22:00');
  });

  it('applies the price ceiling and the district', () => {
    const premium = cafe({ priceLevel: 3 });
    const budgetMatina = cafe({ priceLevel: 1, district: 'Matina' });
    const budgetPoblacion = cafe({ priceLevel: 1 });
    const { matches } = scoreCafes([premium, budgetMatina, budgetPoblacion], req({ maxPrice: 2, district: 'Matina' }), ctx());
    expect(matches.map((m) => m.cafe.id)).toEqual([budgetMatina.id]);
  });

  it('ranks mood fit above a small distance advantage', () => {
    const focusFit = cafe({ km: 3, amenities: ['quietFocus', 'workFriendly', 'plugs'], wifiMbps: 60 });
    const nearNoFit = cafe({ km: 0.4 });
    const { matches } = scoreCafes([nearNoFit, focusFit], req({ mood: 'focused' }), ctx());
    expect(matches[0].cafe.id).toBe(focusFit.id);
  });

  it('picks best, closest and wildcard without repeating a cafe', () => {
    const best = cafe({ km: 2, amenities: ['outdoor', 'lateNight'], priceLevel: 1 });
    const near = cafe({ km: 0.3 });
    const mid = cafe({ km: 1.5, amenities: ['outdoor'] });
    const seen = cafe({ km: 1.2, amenities: ['outdoor', 'lateNight'], priceLevel: 3 });
    const { picks } = scoreCafes([best, near, mid, seen], req({ mood: 'social' }), ctx({ recentIds: [seen.id] }));
    const labels = picks.map((p) => p.label);
    const ids = picks.map((p) => p.match.cafe.id);
    expect(labels).toEqual(['Best match', 'Closest', 'Wildcard']);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(best.id);
    expect(ids[1]).toBe(near.id);
    expect(ids[2]).not.toBe(seen.id);
  });

  it('returns fewer picks when there are fewer matches', () => {
    const only = cafe();
    const { picks } = scoreCafes([only], req({}), ctx());
    expect(picks).toHaveLength(1);
  });

  it('suggests a drink from the menu, falling back to the signature', () => {
    const withMenu = cafe({
      menu: [
        { name: 'Butter Croissant', price: 120, category: 'Pastry' },
        { name: 'Kalita Filter', price: 180, category: 'Filter' },
      ],
    });
    const noMenu = cafe();
    const { matches } = scoreCafes([withMenu, noMenu], req({ mood: 'focused' }), ctx());
    expect(matches.find((m) => m.cafe.id === withMenu.id)?.drink).toBe('Kalita Filter');
    expect(matches.find((m) => m.cafe.id === noMenu.id)?.drink).toBe(noMenu.signature);
  });

  it('suggests the must-have to relax when nothing matches', () => {
    const quietOnly = cafe({ amenities: ['quietFocus'] });
    const petsOnly = cafe({ amenities: ['petFriendly'] });
    const petsToo = cafe({ amenities: ['petFriendly'] });
    const result = scoreCafes([quietOnly, petsOnly, petsToo], req({ mustHaves: ['pets', 'quiet'] }), ctx());
    expect(result.matches).toHaveLength(0);
    expect(result.relax).toEqual({ mustHave: 'quiet', count: 2 });
  });

  it('only suggests cafes from the given catalog', () => {
    const list = [cafe(), cafe(), cafe()];
    const { matches } = scoreCafes(list, req({ mood: 'explore' }), ctx());
    for (const match of matches) expect(list).toContain(match.cafe);
  });

  it('favors air-con in hot weather', () => {
    const cool = cafe({ km: 2, amenities: ['aircon'] });
    const plain = cafe({ km: 2 });
    const hot = { rainy: false, hot: true, summary: '33 C and sunny' };
    const { matches } = scoreCafes([plain, cool], req({}), ctx({ weather: hot }));
    expect(matches[0].cafe.id).toBe(cool.id);
  });
});
