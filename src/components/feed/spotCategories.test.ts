import { describe, expect, it } from 'vitest';
import { closesLate, matchesCategory } from './spotCategories';
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
  city: 'Davao City',
  district: 'Poblacion',
  address: '',
  lat: 7.07,
  lng: 125.61,
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

describe('closesLate', () => {
  it('is true when a day closes at 9 PM or later', () => {
    expect(closesLate(allWeek('08:00', '21:00'))).toBe(true);
    expect(closesLate(allWeek('08:00', '20:59'))).toBe(false);
  });

  it('treats a close time before the open time as past midnight', () => {
    expect(closesLate(allWeek('16:00', '02:00'))).toBe(true);
  });

  it('ignores days without listed hours', () => {
    expect(closesLate(allWeek(null, null))).toBe(false);
  });
});

describe('matchesCategory', () => {
  it('needs both plugs and fast Wi-Fi for Study & Work, unless the spot is work-friendly', () => {
    expect(matchesCategory(cafe(['plugs']), 'study')).toBe(false);
    expect(matchesCategory(cafe(['plugs', 'fastWifi']), 'study')).toBe(true);
    expect(matchesCategory(cafe(['workFriendly']), 'study')).toBe(true);
  });

  it('matches Quiet Corners on the quiet focus amenity', () => {
    expect(matchesCategory(cafe(['quietFocus']), 'quiet')).toBe(true);
    expect(matchesCategory(cafe(['aircon']), 'quiet')).toBe(false);
  });

  it('matches Open Late on the late night amenity or on listed hours', () => {
    expect(matchesCategory(cafe(['lateNight']), 'late')).toBe(true);
    expect(matchesCategory(cafe([], allWeek('10:00', '23:00')), 'late')).toBe(true);
    expect(matchesCategory(cafe(), 'late')).toBe(false);
  });

  it('lets every spot through All Places', () => {
    expect(matchesCategory(cafe(), 'all')).toBe(true);
  });
});
