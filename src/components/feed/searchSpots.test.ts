import { describe, expect, it } from 'vitest';
import { matchesSearch } from './searchSpots';
import type { Cafe } from '../../types/coffee';

const cafe = (over: Partial<Cafe> = {}): Cafe =>
  ({
    id: 'c1',
    handle: 'c1',
    name: 'Green Coffee',
    city: 'Digos City',
    district: 'Digos',
    address: 'Quezon Avenue',
    signature: '',
    vibeTags: [],
    amenities: ['fastWifi'],
    ...over,
  }) as Cafe;

describe('matchesSearch', () => {
  it('matches everything on an empty query', () => {
    expect(matchesSearch(cafe(), '  ')).toBe(true);
  });

  it('matches a city plus an amenity in one query', () => {
    expect(matchesSearch(cafe(), 'Digos City wifi')).toBe(true);
    expect(matchesSearch(cafe(), 'digos wi-fi')).toBe(true);
  });

  it('requires every meaningful word', () => {
    expect(matchesSearch(cafe(), 'Tagum wifi')).toBe(false);
    expect(matchesSearch(cafe({ amenities: [] }), 'digos wifi')).toBe(false);
  });

  it('ignores filler words but still matches them inside a name', () => {
    expect(matchesSearch(cafe(), 'cafe in digos')).toBe(true);
    expect(matchesSearch(cafe(), 'green coffee')).toBe(true);
    expect(matchesSearch(cafe({ name: 'Kaffee' }), 'coffee')).toBe(false);
  });
});
