import { describe, expect, it } from 'vitest';
import { matchesMapFilters, type MapFilterId } from './mapFilters';
import type { AmenityKey, Cafe, WeeklyHours } from '../../types/coffee';

const allWeek = (open: string | null, close: string | null): WeeklyHours => ({
  Monday: { open, close },
  Tuesday: { open, close },
  Wednesday: { open, close },
  Thursday: { open, close },
  Friday: { open, close },
  Saturday: { open, close },
  Sunday: { open, close },
});

const cafe = (amenities: AmenityKey[] = [], hours: WeeklyHours = allWeek('08:00', '18:00')): Cafe => ({
  id: 'c1',
  handle: 'c1',
  name: 'Cafe',
  isRoastery: false,
  city: 'Digos City',
  district: 'Digos',
  address: '',
  lat: 6.75,
  lng: 125.35,
  images: [],
  logoUrl: '',
  description: '',
  signature: '',
  menu: [],
  amenities,
  wifiMbps: 0,
  brewMethods: [],
  priceLevel: 2,
  hours,
  vibeTags: [],
  verified: false,
  saveCount: 0,
  viewCount: 0,
  dateAdded: '2026-09-28',
});

const MORNING = new Date('2026-09-30T10:00:00');
const NIGHT = new Date('2026-09-30T22:00:00');
const filters = (...ids: MapFilterId[]) => new Set(ids);

describe('matchesMapFilters', () => {
  it('lets every spot through with no filters', () => {
    expect(matchesMapFilters(cafe(), filters(), NIGHT)).toBe(true);
  });

  it('keeps open spots for Open now and drops closed or unlisted ones', () => {
    expect(matchesMapFilters(cafe(), filters('openNow'), MORNING)).toBe(true);
    expect(matchesMapFilters(cafe(), filters('openNow'), NIGHT)).toBe(false);
    expect(matchesMapFilters(cafe([], allWeek(null, null)), filters('openNow'), MORNING)).toBe(false);
  });

  it('matches Wi-Fi, Plugs and Quiet on the listed amenities', () => {
    const spot = cafe(['fastWifi', 'quietFocus']);
    expect(matchesMapFilters(spot, filters('wifi'), MORNING)).toBe(true);
    expect(matchesMapFilters(spot, filters('quiet'), MORNING)).toBe(true);
    expect(matchesMapFilters(spot, filters('plugs'), MORNING)).toBe(false);
  });

  it('needs every active filter to match', () => {
    const spot = cafe(['fastWifi', 'plugs']);
    expect(matchesMapFilters(spot, filters('wifi', 'plugs'), MORNING)).toBe(true);
    expect(matchesMapFilters(spot, filters('wifi', 'plugs', 'quiet'), MORNING)).toBe(false);
  });
});
