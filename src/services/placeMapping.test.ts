import { describe, expect, it } from 'vitest';
import {
  cafeRowToCafe,
  describePlaceError,
  emptyHours,
  listingFromCafe,
  toApplicationInsertRow,
  toCafeUpdateRow,
  validateListing,
  validatePlaceApplication,
  type CafeRow,
  type ListingInput,
  type PlaceApplicationInput,
} from './placeMapping';

const application = (over: Partial<PlaceApplicationInput> = {}): PlaceApplicationInput => ({
  businessName: 'Matina Micro Roasters',
  placeType: 'roastery',
  city: 'Davao City',
  district: 'Matina',
  address: 'MacArthur Highway, beside the bakery',
  lat: 7.06,
  lng: 125.6,
  permitNumber: 'DN-2026-1234567',
  contactName: 'Ana Reyes',
  contactPhone: '0917 000 0000',
  description: 'Small-batch roasting since 2021.',
  ownerConfirmed: true,
  ...over,
});

const cafeRow = (over: Partial<CafeRow> = {}): CafeRow => ({
  id: 'cafe-1',
  handle: 'matina-micro-roasters',
  name: 'Matina Micro Roasters',
  is_roastery: true,
  city: 'Davao City',
  district: 'Matina',
  address: 'MacArthur Highway',
  lat: 7.06,
  lng: 125.6,
  images: [],
  logo_url: '',
  description: 'Small-batch roasting.',
  signature: 'Mt. Apo pour over',
  menu: [
    { name: 'Espresso', price: 120, category: 'Espresso Bar' },
    { name: 'Broken', price: 'free' },
    { price: 90 },
  ],
  amenities: ['plugs', 'fastWifi', 'unknownAmenity'],
  wifi_mbps: 80,
  brew_methods: ['V60', 'Nitro'],
  price_level: 2,
  hours: { Monday: { open: '08:00', close: '20:00' }, Tuesday: { open: '8am', close: '20:00' } },
  vibe_tags: ['Study spot', ''],
  verified: true,
  save_count: 3,
  view_count: 40,
  created_at: '2026-09-29T01:02:03.000Z',
  ...over,
});

describe('validatePlaceApplication', () => {
  it('accepts a complete application', () => {
    expect(validatePlaceApplication(application())).toBeNull();
  });

  it('requires a name, pin, permit, contact and confirmation', () => {
    expect(validatePlaceApplication(application({ businessName: 'A' }))).toMatch(/name/);
    expect(validatePlaceApplication(application({ lat: null }))).toMatch(/location/);
    expect(validatePlaceApplication(application({ lat: 14.6, lng: 121.0 }))).toMatch(/Davao Region/);
    expect(validatePlaceApplication(application({ permitNumber: '' }))).toMatch(/permit/);
    expect(validatePlaceApplication(application({ contactName: '' }))).toMatch(/contact/);
    expect(validatePlaceApplication(application({ ownerConfirmed: false }))).toMatch(/own or manage/);
  });

  it('caps the description', () => {
    expect(validatePlaceApplication(application({ description: 'x'.repeat(601) }))).toMatch(/description/);
  });
});

describe('toApplicationInsertRow', () => {
  it('trims text and leaves server-owned fields out', () => {
    const row = toApplicationInsertRow(application({ businessName: '  Matina Micro Roasters  ', permitNumber: ' DN-1 ' }));
    expect(row.business_name).toBe('Matina Micro Roasters');
    expect(row.permit_number).toBe('DN-1');
    expect(row).not.toHaveProperty('status');
    expect(row).not.toHaveProperty('owner_id');
  });
});

describe('cafeRowToCafe', () => {
  it('maps a listing without inventing details', () => {
    const cafe = cafeRowToCafe(cafeRow());
    expect(cafe.id).toBe('cafe-1');
    expect(cafe.images).toEqual(['/placeholders/no-photo.svg']);
    expect(cafe.logoUrl).toBe('/placeholders/no-photo.svg');
    expect(cafe.amenities).toEqual(['plugs', 'fastWifi']);
    expect(cafe.brewMethods).toEqual(['V60']);
    expect(cafe.menu).toEqual([{ name: 'Espresso', price: 120, category: 'Espresso Bar' }]);
    expect(cafe.hours.Monday).toEqual({ open: '08:00', close: '20:00' });
    expect(cafe.hours.Tuesday).toEqual({ open: null, close: null });
    expect(cafe.hours.Sunday).toEqual({ open: null, close: null });
    expect(cafe.vibeTags).toEqual(['Study spot']);
    expect(cafe.dateAdded).toBe('2026-09-29');
    expect(cafe.verified).toBe(true);
    expect(cafe.community).toBeUndefined();
  });

  it('falls back on unknown city, district and price level', () => {
    const cafe = cafeRowToCafe(cafeRow({ city: 'Manila', district: 'Nowhere', price_level: 9, hours: null, menu: 'nope' }));
    expect(cafe.city).toBe('Davao City');
    expect(cafe.district).toBe('Poblacion');
    expect(cafe.priceLevel).toBe(2);
    expect(cafe.hours).toEqual(emptyHours());
    expect(cafe.menu).toEqual([]);
  });
});

describe('listing round trip', () => {
  const listing = (): ListingInput => listingFromCafe(cafeRowToCafe(cafeRow()));

  it('accepts the listing as loaded', () => {
    expect(validateListing(listing())).toBeNull();
  });

  it('rejects half-set hours and bad menu prices', () => {
    const halfDay = listing();
    halfDay.hours.Friday = { open: '09:00', close: null };
    expect(validateListing(halfDay)).toMatch(/Friday/);
    const badPrice = listing();
    badPrice.menu.push({ name: 'Latte', price: -5, category: 'Espresso Bar' });
    expect(validateListing(badPrice)).toMatch(/Latte/);
  });

  it('writes only owner-editable columns', () => {
    const row = toCafeUpdateRow(listing());
    expect(row.name).toBe('Matina Micro Roasters');
    expect(row.menu).toEqual([{ name: 'Espresso', price: 120, category: 'Espresso Bar' }]);
    expect(row).not.toHaveProperty('verified');
    expect(row).not.toHaveProperty('handle');
    expect(row).not.toHaveProperty('save_count');
  });
});

describe('describePlaceError', () => {
  it('translates trigger messages', () => {
    expect(describePlaceError('pending_application: waiting')).toMatch(/already waiting/);
    expect(describePlaceError('daily_limit: 3')).toMatch(/3 applications/);
    expect(describePlaceError('own_role: no')).toMatch(/own role/);
    expect(describePlaceError('something else')).toMatch(/try again/i);
  });
});
