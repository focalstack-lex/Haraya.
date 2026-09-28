import type { AmenityKey, Cafe, DavaoCity, District, WeeklyHours } from '../types/coffee';
import { DAVAO_CITIES, DAVAO_DISTRICTS } from '../types/coffee';

/**
 * Community spot submissions: the row shape stored in Supabase (spot_submissions), the form input, the
 * client-side checks that mirror the database constraints, and the mapping into the shared Cafe model.
 */

export const SPOT_AMENITIES = ['plugs', 'fastWifi', 'aircon', 'quietFocus', 'petFriendly', 'outdoor'] as const;
export type SpotAmenity = (typeof SPOT_AMENITIES)[number];

export const SPOT_VIBES = [
  { id: 'quietStudy', label: 'Quiet study spot', hint: 'Sockets at tables, low music, good for exams' },
  { id: 'fastWifiWork', label: 'Fast Wi-Fi and work', hint: 'Strong internet, roomy desks, air-con' },
  { id: 'hiddenNook', label: 'Hidden garden or cozy nook', hint: 'Tucked away, peaceful, good coffee' },
  { id: 'lateNight', label: 'Late night study', hint: 'Open until midnight or later' },
] as const;
export type SpotVibe = (typeof SPOT_VIBES)[number]['id'];

/**
 * Vibes that clearly imply an amenity, so community spots match the same filters and moods as listed
 * cafes. "Hidden garden or cozy nook" implies nothing specific, so it adds no amenity.
 */
const VIBE_AMENITY: Partial<Record<SpotVibe, AmenityKey>> = {
  quietStudy: 'quietFocus',
  fastWifiWork: 'workFriendly',
  lateNight: 'lateNight',
};

/** Davao Region bounding box; must match the check constraints in the migration. */
export const REGION_BOUNDS = { minLat: 5.3, maxLat: 8.2, minLng: 125.0, maxLng: 126.7 } as const;

export const SPOT_LIMITS = { name: 80, address: 160, tip: 280 } as const;

export interface SpotInput {
  name: string;
  city: Exclude<DavaoCity, 'All Davao Region'>;
  district: District;
  address: string;
  lat: number | null;
  lng: number | null;
  amenities: SpotAmenity[];
  vibes: SpotVibe[];
  priceLevel: 1 | 2 | 3 | null;
  /** "HH:MM" or empty; both or neither. */
  opensAt: string;
  closesAt: string;
  tip: string;
  publicPlaceConfirmed: boolean;
}

export interface SpotRow {
  id: string;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  amenities: string[];
  vibes: string[];
  price_level: number;
  opens_at: string | null;
  closes_at: string | null;
  tip: string;
  review_note: string | null;
  created_at: string;
}

/** Returns the first problem with the input, or null when it can be submitted. */
export function validateSpotInput(input: SpotInput): string | null {
  const name = input.name.trim();
  if (name.length < 2) return 'Add the name of the place.';
  if (name.length > SPOT_LIMITS.name) return `Keep the name under ${SPOT_LIMITS.name} characters.`;
  const address = input.address.trim();
  if (address.length < 4) return 'Add a landmark or street so people can find it.';
  if (address.length > SPOT_LIMITS.address) return `Keep the address under ${SPOT_LIMITS.address} characters.`;
  if (input.lat === null || input.lng === null) return 'Set the location: use your current spot or tap the map.';
  const { minLat, maxLat, minLng, maxLng } = REGION_BOUNDS;
  if (input.lat < minLat || input.lat > maxLat || input.lng < minLng || input.lng > maxLng) {
    return 'That pin is outside the Davao Region.';
  }
  if (input.priceLevel === null) return 'Pick a price range.';
  if (Boolean(input.opensAt) !== Boolean(input.closesAt)) return 'Add both opening and closing times, or leave both empty.';
  if (input.tip.trim().length > SPOT_LIMITS.tip) return `Keep the tip under ${SPOT_LIMITS.tip} characters.`;
  if (!input.publicPlaceConfirmed) return 'Confirm this is a place open to the public.';
  return null;
}

/** Insert payload for spot_submissions. Status, owner and timestamps are set by the database. */
export function toInsertRow(input: SpotInput) {
  return {
    name: input.name.trim(),
    city: input.city,
    district: input.district,
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    amenities: input.amenities,
    vibes: input.vibes,
    price_level: input.priceLevel,
    opens_at: input.opensAt || null,
    closes_at: input.closesAt || null,
    tip: input.tip.trim(),
    public_place_confirmed: input.publicPlaceConfirmed,
  };
}

const PLACEHOLDER_PHOTO = '/placeholders/no-photo.svg';

const everyDay = (open: string | null, close: string | null): WeeklyHours => {
  const day = { open, close };
  return { Monday: day, Tuesday: day, Wednesday: day, Thursday: day, Friday: day, Saturday: day, Sunday: day };
};

const asCity = (value: string): DavaoCity =>
  (DAVAO_CITIES as readonly string[]).includes(value) ? (value as DavaoCity) : 'Davao City';
const asDistrict = (value: string): District =>
  (DAVAO_DISTRICTS as readonly string[]).includes(value) ? (value as District) : 'Poblacion';
const isAmenity = (value: string): value is SpotAmenity => (SPOT_AMENITIES as readonly string[]).includes(value);
const isVibe = (value: string): value is SpotVibe => SPOT_VIBES.some((vibe) => vibe.id === value);

/**
 * A submission as a Cafe. Nothing is invented: no photo, menu or Wi-Fi speed; hours only when given.
 * Rejected rows return null because they never appear on the map or feed.
 */
export function rowToCafe(row: SpotRow): Cafe | null {
  if (row.status === 'rejected') return null;
  const vibes = row.vibes.filter(isVibe);
  const amenities = new Set<AmenityKey>(row.amenities.filter(isAmenity));
  for (const vibe of vibes) {
    const implied = VIBE_AMENITY[vibe];
    if (implied) amenities.add(implied);
  }
  const priceLevel = row.price_level === 1 || row.price_level === 3 ? row.price_level : 2;
  const open = row.opens_at ? row.opens_at.slice(0, 5) : null;
  const close = row.closes_at ? row.closes_at.slice(0, 5) : null;

  return {
    id: `spot-${row.id}`,
    handle: `spot-${row.id}`,
    name: row.name,
    isRoastery: false,
    city: asCity(row.city),
    district: asDistrict(row.district),
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    images: [PLACEHOLDER_PHOTO],
    logoUrl: PLACEHOLDER_PHOTO,
    description: '',
    signature: '',
    menu: [],
    amenities: [...amenities],
    wifiMbps: 0,
    brewMethods: [],
    priceLevel,
    hours: everyDay(open, close),
    vibeTags: vibes.map((id) => SPOT_VIBES.find((vibe) => vibe.id === id)?.label ?? id),
    verified: false,
    saveCount: 0,
    viewCount: 0,
    dateAdded: row.created_at.slice(0, 10),
    community: { status: row.status, tip: row.tip },
  };
}

/** Friendly text for errors raised by the database trigger and constraints. */
export function describeSubmitError(message: string): string {
  if (message.includes('daily_limit')) return 'You can add up to 5 spots a day. Try again tomorrow.';
  if (message.includes('pending_limit')) return '10 of your spots are already waiting for review. Please wait for those first.';
  if (message.includes('Sign in')) return 'Sign in again to add a spot.';
  if (message.includes('violates check constraint')) return 'Some details are outside what Haraya accepts. Check the form and try again.';
  return 'Could not send your spot right now. Please try again.';
}
