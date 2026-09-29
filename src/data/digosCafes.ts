import type { Cafe, WeeklyHours } from '../types/coffee';

/**
 * Digos City coffee shops chosen by Lex from Google Maps on 2026-09-29 (names and streets as that listing shows
 * them). Map positions are exact: from OpenStreetMap, or decoded from the plus code printed on the Google listing
 * (`reports/digos-cafes/decode-plus-code.py`). The sources state a name, a street and a position, so that is all
 * these listings carry: no hours, photo, price, menu, Wi-Fi or description. The app shows what is missing as
 * missing: "Hours not listed", the no-photo placeholder, no price. When a spot's facts are checked (a Google
 * Business listing, the owner, a visit), move it to `spots.ts` with the full record.
 * Not yet placed, waiting for a position: Poblacion Coffee, Kofhi.
 */

interface ListedCafe {
  /** Stable: saved copies on visitors' devices point at it. Earlier OpenStreetMap ids keep their `osm-` form. */
  id: string;
  name: string;
  /** As the source shows it; empty when the listing gives none. */
  street: string;
  lat: number;
  lng: number;
}

const DIGOS_LISTED_CAFES: ListedCafe[] = [
  { id: 'osm-w1431054042', name: 'G&Co. Cafe', street: 'Quezon Avenue', lat: 6.760166, lng: 125.347892 },
  { id: 'osm-n13154430136', name: 'Pickup Coffee', street: 'Gaisano Grand Mall of Digos, Sultan Kudarat Road', lat: 6.759866, lng: 125.346924 },
  { id: 'osm-n13308179172', name: "Lil' Ben Coffee House", street: 'Santa Ana Street', lat: 6.762560, lng: 125.336229 },
  { id: 'osm-n13168672184', name: 'Café Vicente', street: 'Estrada 5th', lat: 6.753013, lng: 125.348828 },
  { id: 'osm-n13049364628', name: "Cely's Cafe", street: 'Rizal Avenue', lat: 6.753420, lng: 125.356339 },
  { id: 'digos-the-tipsy-butter', name: 'The Tipsy Butter', street: 'Roxas Extension', lat: 6.749913, lng: 125.344984 },
  { id: 'digos-infinitea', name: 'Infinitea', street: 'Quirino', lat: 6.758388, lng: 125.346766 },
  { id: 'digos-kaffeeneology', name: 'Kaffeeneology', street: 'Roxas Extension', lat: 6.749928, lng: 125.345555 },
  { id: 'digos-129-coffee-shoppe', name: '129 Coffee Shoppe', street: '', lat: 6.757013, lng: 125.352953 },
  { id: 'digos-daisy', name: 'Daisy', street: '', lat: 6.757513, lng: 125.352391 },
  { id: 'digos-cool-brews', name: 'Cool Brews', street: 'Estrada 3rd', lat: 6.754738, lng: 125.352391 },
  { id: 'digos-coffee-shops-stalls', name: 'Coffee shops(stalls)', street: 'Quirino', lat: 6.756188, lng: 125.354359 },
  { id: 'digos-paco', name: 'PACO', street: 'McArthur Highway', lat: 6.763238, lng: 125.355516 },
  // Position from the restaurantguru.com listing for The Nook (6.7403963, 125.3588278), on Mabini Street like Basti's Cafe
  { id: 'digos-the-nook', name: 'The Nook', street: 'Mabini 3rd', lat: 6.740396, lng: 125.358828 },
];

const PLACEHOLDER_PHOTO = '/placeholders/no-photo.svg';
const NO_HOURS: WeeklyHours = {
  Monday: { open: null, close: null },
  Tuesday: { open: null, close: null },
  Wednesday: { open: null, close: null },
  Thursday: { open: null, close: null },
  Friday: { open: null, close: null },
  Saturday: { open: null, close: null },
  Sunday: { open: null, close: null },
};

/** Stable URL handle from the name and the id, so two branches of one shop never collide. */
const handleFor = (spot: ListedCafe) =>
  `${spot.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${spot.id}`;

export const DIGOS_CAFES: Cafe[] = DIGOS_LISTED_CAFES.map((spot) => ({
  id: spot.id,
  handle: handleFor(spot),
  name: spot.name,
  isRoastery: false,
  city: 'Digos City',
  district: 'Digos',
  address: [spot.street, 'Digos City, Davao del Sur'].filter(Boolean).join(', '),
  lat: spot.lat,
  lng: spot.lng,
  images: [PLACEHOLDER_PHOTO],
  logoUrl: PLACEHOLDER_PHOTO,
  description: '',
  signature: '',
  menu: [],
  amenities: [],
  wifiMbps: 0,
  brewMethods: [],
  priceLevel: 0,
  hours: NO_HOURS,
  vibeTags: [],
  verified: false,
  saveCount: 0,
  viewCount: 0,
  dateAdded: '2026-09-29',
}));
