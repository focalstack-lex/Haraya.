import type { AmenityKey, BrewMethod, Cafe, DavaoCity, District, MenuItem, WeeklyHours } from '../types/coffee';
import { AMENITY_LABELS, BREW_METHODS, DAVAO_CITIES, DAVAO_DISTRICTS } from '../types/coffee';
import { WEEKDAY_ORDER } from '../utils/weekdays';

/**
 * Place Portal data: the application a place owner sends (place_applications), the public listing row
 * (cafes), the client-side checks that mirror the database constraints, and the mappings between the
 * row shapes and the shared Cafe model. Nothing is invented on the way in: missing photos stay a
 * placeholder, missing hours stay unknown.
 */

export const PLACE_TYPES = [
  { id: 'cafe', label: 'Cafe', hint: 'Serves coffee to the public' },
  { id: 'roastery', label: 'Cafe that roasts', hint: 'Roasts its own beans on site' },
  { id: 'study_spot', label: 'Study or work spot', hint: 'Library cafe, co-working space, reading room' },
] as const;
export type PlaceType = (typeof PLACE_TYPES)[number]['id'];

/** Davao Region bounding box; must match the check constraints in the migration. */
export const REGION_BOUNDS = { minLat: 5.3, maxLat: 8.2, minLng: 125.0, maxLng: 126.7 } as const;

export const APPLICATION_LIMITS = {
  businessName: 120,
  address: 200,
  permitNumber: 60,
  contactName: 80,
  contactPhone: 30,
  description: 600,
} as const;

export const LISTING_LIMITS = {
  name: 120,
  address: 200,
  description: 1000,
  signature: 120,
  wifiMbps: 10000,
  amenities: 10,
  brewMethods: 8,
  vibeTags: 8,
  menu: 60,
  menuItemName: 80,
} as const;

export const LISTING_AMENITIES = Object.keys(AMENITY_LABELS) as AmenityKey[];

export type City = Exclude<DavaoCity, 'All Davao Region'>;

export interface PlaceApplicationInput {
  businessName: string;
  placeType: PlaceType;
  city: City;
  district: District;
  address: string;
  lat: number | null;
  lng: number | null;
  permitNumber: string;
  contactName: string;
  contactPhone: string;
  description: string;
  ownerConfirmed: boolean;
}

export interface PlaceApplicationRow {
  id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected';
  business_name: string;
  place_type: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  permit_number: string;
  contact_name: string;
  contact_phone: string;
  description: string;
  review_note: string | null;
  cafe_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/** One row of public.cafes. */
export interface CafeRow {
  id: string;
  handle: string;
  name: string;
  is_roastery: boolean;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  logo_url: string;
  description: string;
  signature: string;
  menu: unknown;
  amenities: string[];
  wifi_mbps: number;
  brew_methods: string[];
  price_level: number;
  hours: unknown;
  vibe_tags: string[];
  verified: boolean;
  save_count: number;
  view_count: number;
  created_at: string;
}

/** The fields an owner edits on their listing. */
export interface ListingInput {
  name: string;
  isRoastery: boolean;
  city: City;
  district: District;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
  signature: string;
  amenities: AmenityKey[];
  brewMethods: BrewMethod[];
  priceLevel: 1 | 2 | 3;
  wifiMbps: number;
  hours: WeeklyHours;
  menu: MenuItem[];
  vibeTags: string[];
}

const PLACEHOLDER_PHOTO = '/placeholders/no-photo.svg';
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MENU_CATEGORIES: MenuItem['category'][] = ['Espresso Bar', 'Filter', 'Signature', 'Pastry'];

const asCity = (value: string): DavaoCity =>
  (DAVAO_CITIES as readonly string[]).includes(value) ? (value as DavaoCity) : 'Davao City';
const asDistrict = (value: string): District =>
  (DAVAO_DISTRICTS as readonly string[]).includes(value) ? (value as District) : 'Poblacion';
const isAmenity = (value: string): value is AmenityKey => value in AMENITY_LABELS;
const isBrewMethod = (value: string): value is BrewMethod => (BREW_METHODS as readonly string[]).includes(value);
const isPlaceType = (value: string): value is PlaceType => PLACE_TYPES.some((type) => type.id === value);

const inRegion = (lat: number, lng: number) =>
  lat >= REGION_BOUNDS.minLat && lat <= REGION_BOUNDS.maxLat && lng >= REGION_BOUNDS.minLng && lng <= REGION_BOUNDS.maxLng;

export const placeTypeLabel = (value: string): string =>
  PLACE_TYPES.find((type) => type.id === value)?.label ?? 'Place';

/** A week with no listed hours. */
export const emptyHours = (): WeeklyHours => {
  const hours = {} as WeeklyHours;
  for (const day of WEEKDAY_ORDER) hours[day] = { open: null, close: null };
  return hours;
};

// Applications -----------------------------------------------------------------------------------------

/** Returns the first problem with the application, or null when it can be sent. */
export function validatePlaceApplication(input: PlaceApplicationInput): string | null {
  const name = input.businessName.trim();
  if (name.length < 2) return 'Add the name of your place.';
  if (name.length > APPLICATION_LIMITS.businessName) return `Keep the name under ${APPLICATION_LIMITS.businessName} characters.`;
  if (!isPlaceType(input.placeType)) return 'Pick what kind of place it is.';
  const address = input.address.trim();
  if (address.length < 4) return 'Add the street address or a landmark.';
  if (address.length > APPLICATION_LIMITS.address) return `Keep the address under ${APPLICATION_LIMITS.address} characters.`;
  if (input.lat === null || input.lng === null) return 'Set the location: use your current spot or tap the map.';
  if (!inRegion(input.lat, input.lng)) return 'That pin is outside the Davao Region.';
  const permit = input.permitNumber.trim();
  if (permit.length < 3) return 'Add your DTI or Mayor’s permit number.';
  if (permit.length > APPLICATION_LIMITS.permitNumber) return `Keep the permit number under ${APPLICATION_LIMITS.permitNumber} characters.`;
  const contact = input.contactName.trim();
  if (contact.length < 2) return 'Add the name of the person we can contact.';
  if (contact.length > APPLICATION_LIMITS.contactName) return `Keep the contact name under ${APPLICATION_LIMITS.contactName} characters.`;
  if (input.contactPhone.trim().length > APPLICATION_LIMITS.contactPhone) return 'Keep the phone number short.';
  if (input.description.trim().length > APPLICATION_LIMITS.description) {
    return `Keep the description under ${APPLICATION_LIMITS.description} characters.`;
  }
  if (!input.ownerConfirmed) return 'Confirm that you own or manage this place.';
  return null;
}

/** Insert payload for place_applications. Status, owner and timestamps are set by the database. */
export function toApplicationInsertRow(input: PlaceApplicationInput) {
  return {
    business_name: input.businessName.trim(),
    place_type: input.placeType,
    city: input.city,
    district: input.district,
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    permit_number: input.permitNumber.trim(),
    contact_name: input.contactName.trim(),
    contact_phone: input.contactPhone.trim(),
    description: input.description.trim(),
    owner_confirmed: input.ownerConfirmed,
  };
}

// Listings ---------------------------------------------------------------------------------------------

function parseHours(value: unknown): WeeklyHours {
  const hours = emptyHours();
  if (!value || typeof value !== 'object') return hours;
  const record = value as Record<string, unknown>;
  for (const day of WEEKDAY_ORDER) {
    const entry = record[day];
    if (!entry || typeof entry !== 'object') continue;
    const { open, close } = entry as { open?: unknown; close?: unknown };
    if (typeof open === 'string' && typeof close === 'string' && TIME_PATTERN.test(open) && TIME_PATTERN.test(close)) {
      hours[day] = { open, close };
    }
  }
  return hours;
}

function parseMenu(value: unknown): MenuItem[] {
  if (!Array.isArray(value)) return [];
  const items: MenuItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { name, price, category, description } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) continue;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) continue;
    const knownCategory = MENU_CATEGORIES.find((candidate) => candidate === category) ?? 'Signature';
    items.push({
      name: name.trim(),
      price,
      category: knownCategory,
      ...(typeof description === 'string' && description.trim() ? { description: description.trim() } : {}),
    });
  }
  return items;
}

/** A public listing as a Cafe. Photos stay a placeholder until real ones are uploaded. */
export function cafeRowToCafe(row: CafeRow): Cafe {
  const images = row.images.filter((image) => typeof image === 'string' && image.trim());
  const priceLevel = row.price_level === 1 || row.price_level === 3 ? row.price_level : 2;
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    isRoastery: row.is_roastery,
    city: asCity(row.city),
    district: asDistrict(row.district),
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    images: images.length > 0 ? images : [PLACEHOLDER_PHOTO],
    logoUrl: row.logo_url || PLACEHOLDER_PHOTO,
    description: row.description,
    signature: row.signature,
    menu: parseMenu(row.menu),
    amenities: row.amenities.filter(isAmenity),
    wifiMbps: Number.isFinite(row.wifi_mbps) && row.wifi_mbps > 0 ? row.wifi_mbps : 0,
    brewMethods: row.brew_methods.filter(isBrewMethod),
    priceLevel,
    hours: parseHours(row.hours),
    vibeTags: row.vibe_tags.filter((tag) => typeof tag === 'string' && tag.trim()),
    verified: row.verified,
    saveCount: row.save_count,
    viewCount: row.view_count,
    dateAdded: row.created_at.slice(0, 10),
  };
}

/** The editable form state for an existing listing. */
export function listingFromCafe(cafe: Cafe): ListingInput {
  return {
    name: cafe.name,
    isRoastery: cafe.isRoastery,
    city: cafe.city === 'All Davao Region' ? 'Davao City' : cafe.city,
    district: cafe.district,
    address: cafe.address,
    lat: cafe.lat,
    lng: cafe.lng,
    description: cafe.description,
    signature: cafe.signature,
    amenities: [...cafe.amenities],
    brewMethods: [...cafe.brewMethods],
    // The form has no "not listed" choice; owner listings always carry a price, so 0 only means a catalog spot
    priceLevel: cafe.priceLevel === 0 ? 2 : cafe.priceLevel,
    wifiMbps: cafe.wifiMbps,
    hours: { ...cafe.hours },
    menu: cafe.menu.map((item) => ({ ...item })),
    vibeTags: [...cafe.vibeTags],
  };
}

/** Returns the first problem with the listing, or null when it can be saved. */
export function validateListing(input: ListingInput): string | null {
  const name = input.name.trim();
  if (name.length < 2) return 'Add the name of your place.';
  if (name.length > LISTING_LIMITS.name) return `Keep the name under ${LISTING_LIMITS.name} characters.`;
  const address = input.address.trim();
  if (address.length < 4) return 'Add the street address or a landmark.';
  if (address.length > LISTING_LIMITS.address) return `Keep the address under ${LISTING_LIMITS.address} characters.`;
  if (input.lat === null || input.lng === null) return 'Set the location on the map.';
  if (!inRegion(input.lat, input.lng)) return 'That pin is outside the Davao Region.';
  if (input.description.trim().length > LISTING_LIMITS.description) {
    return `Keep the description under ${LISTING_LIMITS.description} characters.`;
  }
  if (input.signature.trim().length > LISTING_LIMITS.signature) {
    return `Keep the signature drink under ${LISTING_LIMITS.signature} characters.`;
  }
  if (!Number.isInteger(input.wifiMbps) || input.wifiMbps < 0 || input.wifiMbps > LISTING_LIMITS.wifiMbps) {
    return 'Wi-Fi speed is a whole number of Mbps, or 0 when unknown.';
  }
  if (input.amenities.length > LISTING_LIMITS.amenities) return 'Too many amenities selected.';
  if (input.brewMethods.length > LISTING_LIMITS.brewMethods) return 'Too many brew methods selected.';
  if (input.vibeTags.length > LISTING_LIMITS.vibeTags) return 'Too many tags.';
  for (const day of WEEKDAY_ORDER) {
    const { open, close } = input.hours[day];
    if ((open === null) !== (close === null)) return `Add both opening and closing times for ${day}, or mark it closed.`;
    if (open !== null && close !== null && (!TIME_PATTERN.test(open) || !TIME_PATTERN.test(close))) {
      return `Check the hours for ${day}.`;
    }
  }
  if (input.menu.length > LISTING_LIMITS.menu) return `Keep the menu under ${LISTING_LIMITS.menu} items.`;
  for (const item of input.menu) {
    if (!item.name.trim()) return 'Every menu item needs a name.';
    if (item.name.trim().length > LISTING_LIMITS.menuItemName) return 'Keep menu item names short.';
    if (!Number.isFinite(item.price) || item.price < 0) return `Give ${item.name.trim()} a price of 0 or more.`;
  }
  return null;
}

/** Update payload for the owner's cafes row: only the columns owners are granted. */
export function toCafeUpdateRow(input: ListingInput) {
  return {
    name: input.name.trim(),
    is_roastery: input.isRoastery,
    city: input.city,
    district: input.district,
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    description: input.description.trim(),
    signature: input.signature.trim(),
    amenities: input.amenities,
    brew_methods: input.brewMethods,
    price_level: input.priceLevel,
    wifi_mbps: input.wifiMbps,
    hours: input.hours,
    menu: input.menu.map((item) => ({
      name: item.name.trim(),
      price: Math.round(item.price),
      category: item.category,
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
    })),
    vibe_tags: input.vibeTags.map((tag) => tag.trim()).filter(Boolean),
  };
}

/** Friendly text for errors raised by the database trigger and constraints. */
export function describePlaceError(message: string): string {
  if (message.includes('pending_application')) return 'Your application is already waiting for review.';
  if (message.includes('daily_limit')) return 'You can send up to 3 applications a day. Try again tomorrow.';
  if (message.includes('already_reviewed')) return 'This application was already reviewed.';
  if (message.includes('own_role')) return 'You cannot change your own role.';
  if (message.includes('Sign in')) return 'Sign in again to continue.';
  if (message.includes('violates check constraint')) return 'Some details are outside what Haraya accepts. Check the form and try again.';
  if (message.includes('permission denied') || message.includes('42501')) return 'This account is not allowed to do that.';
  return 'Could not save right now. Please try again.';
}
