import { describe, expect, it } from 'vitest';
import { describeSubmitError, rowToCafe, toInsertRow, validateSpotInput, type SpotInput, type SpotRow } from './spotMapping';

const input = (over: Partial<SpotInput> = {}): SpotInput => ({
  name: 'Lot 38 Study Cafe',
  city: 'Davao City',
  district: 'Poblacion',
  address: 'Behind the Jacinto Extension chapel',
  lat: 7.07,
  lng: 125.61,
  amenities: ['plugs'],
  vibes: ['quietStudy'],
  priceLevel: 1,
  opensAt: '',
  closesAt: '',
  tip: 'Sockets are behind the couch on the second floor.',
  publicPlaceConfirmed: true,
  ...over,
});

const row = (over: Partial<SpotRow> = {}): SpotRow => ({
  id: 'abc',
  submitted_by: 'user-1',
  status: 'approved',
  name: 'Lot 38 Study Cafe',
  city: 'Davao City',
  district: 'Poblacion',
  address: 'Behind the chapel',
  lat: 7.07,
  lng: 125.61,
  amenities: ['plugs', 'fastWifi'],
  vibes: ['lateNight'],
  price_level: 1,
  opens_at: '16:00:00',
  closes_at: '02:00:00',
  tip: 'Ask for the upstairs room.',
  review_note: null,
  created_at: '2026-09-29T02:00:00Z',
  ...over,
});

describe('validateSpotInput', () => {
  it('accepts a complete submission', () => {
    expect(validateSpotInput(input())).toBeNull();
  });

  it('requires a location inside the Davao Region', () => {
    expect(validateSpotInput(input({ lat: null, lng: null }))).toMatch(/location/i);
    expect(validateSpotInput(input({ lat: 14.6, lng: 121.0 }))).toMatch(/outside the Davao Region/);
  });

  it('requires the public place confirmation', () => {
    expect(validateSpotInput(input({ publicPlaceConfirmed: false }))).toMatch(/open to the public/);
  });

  it('requires both hours or neither', () => {
    expect(validateSpotInput(input({ opensAt: '08:00' }))).toMatch(/both/);
    expect(validateSpotInput(input({ opensAt: '08:00', closesAt: '20:00' }))).toBeNull();
  });

  it('enforces the database length limits', () => {
    expect(validateSpotInput(input({ name: 'x'.repeat(81) }))).toMatch(/name/);
    expect(validateSpotInput(input({ tip: 'x'.repeat(281) }))).toMatch(/tip/);
  });

  it('requires a price range', () => {
    expect(validateSpotInput(input({ priceLevel: null }))).toMatch(/price/);
  });
});

describe('toInsertRow', () => {
  it('trims text and sends empty hours as null', () => {
    const payload = toInsertRow(input({ name: '  Lot 38  ' }));
    expect(payload.name).toBe('Lot 38');
    expect(payload.opens_at).toBeNull();
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('submitted_by');
  });
});

describe('rowToCafe', () => {
  it('maps an approved row without inventing details', () => {
    const cafe = rowToCafe(row());
    expect(cafe).not.toBeNull();
    expect(cafe?.id).toBe('spot-abc');
    expect(cafe?.menu).toEqual([]);
    expect(cafe?.wifiMbps).toBe(0);
    expect(cafe?.signature).toBe('');
    expect(cafe?.community).toEqual({ status: 'approved', tip: 'Ask for the upstairs room.' });
  });

  it('adds the amenity each vibe implies', () => {
    expect(rowToCafe(row())?.amenities).toEqual(expect.arrayContaining(['plugs', 'fastWifi', 'lateNight']));
  });

  it('uses the given hours for every day, trimmed to HH:MM', () => {
    expect(rowToCafe(row())?.hours.Monday).toEqual({ open: '16:00', close: '02:00' });
    expect(rowToCafe(row({ opens_at: null, closes_at: null }))?.hours.Friday).toEqual({ open: null, close: null });
  });

  it('drops rejected rows and unknown values', () => {
    expect(rowToCafe(row({ status: 'rejected' }))).toBeNull();
    const cafe = rowToCafe(row({ amenities: ['plugs', 'teleporter'], vibes: ['nope'] }));
    expect(cafe?.amenities).toEqual(['plugs']);
    expect(cafe?.vibeTags).toEqual([]);
  });
});

describe('describeSubmitError', () => {
  it('turns database limits into plain language', () => {
    expect(describeSubmitError('daily_limit: You can add up to 5 spots a day')).toMatch(/5 spots a day/);
    expect(describeSubmitError('pending_limit: 10 of your spots')).toMatch(/waiting for review/);
    expect(describeSubmitError('network down')).toMatch(/try again/i);
  });
});
