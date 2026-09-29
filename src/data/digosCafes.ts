import type { Cafe, Weekday, WeeklyHours } from '../types/coffee';

/**
 * Digos City coffee shops chosen by Lex from Google Maps on 2026-09-29 (names and streets as that listing shows
 * them). Map positions are exact: from OpenStreetMap, or decoded from the plus code printed on the Google listing
 * (`reports/digos-cafes/decode-plus-code.py`). The sources state a name, a street and a position, so that is all
 * these listings carry: no price, menu, Wi-Fi or description, and hours only where a source states them (below).
 * The app shows what is missing as missing: "Hours not listed", no price, and the no-photo placeholder for a spot
 * without photos. Photos are the ones Lex
 * collected into `Haraya Files/Haraya Coffee Spots/<Shop> Digos/`, converted to WebP by
 * `reports/digos-cafes/convert-photos.py` into `public/spots/<slug>/`. Kofhi's photo is converted and waiting. When a spot's facts are checked (a Google
 * Business listing, the owner, a visit), move it to `spots.ts` with the full record.
 * Only shops with a photo are listed. Waiting for a position: Kofhi (photo ready). Removed for now, no photo yet:
 * Pickup Coffee, 129 Coffee Shoppe, Daisy, PACO, Coffee shops(stalls), Poblacion Coffee.
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
  { id: 'osm-n13308179172', name: "Lil' Ben Coffee House", street: 'Santa Ana Street', lat: 6.762560, lng: 125.336229 },
  { id: 'osm-n13168672184', name: 'Café Vicente', street: 'Estrada 5th', lat: 6.753013, lng: 125.348828 },
  { id: 'osm-n13049364628', name: "Cely's Cafe", street: 'Rizal Avenue', lat: 6.753420, lng: 125.356339 },
  { id: 'digos-the-tipsy-butter', name: 'The Tipsy Butter', street: 'Roxas Extension', lat: 6.749913, lng: 125.344984 },
  { id: 'digos-infinitea', name: 'Infinitea', street: 'Quirino', lat: 6.758388, lng: 125.346766 },
  { id: 'digos-kaffeeneology', name: 'Kaffeeneology', street: 'Roxas Extension', lat: 6.749928, lng: 125.345555 },
  { id: 'digos-cool-brews', name: 'Cool Brews', street: 'Estrada 3rd', lat: 6.754738, lng: 125.352391 },
  // Position from the restaurantguru.com listing for The Nook (6.7403963, 125.3588278), on Mabini Street like Basti's Cafe
  { id: 'digos-the-nook', name: 'The Nook', street: 'Mabini 3rd', lat: 6.740396, lng: 125.358828 },
];

const PLACEHOLDER_PHOTO = '/placeholders/no-photo.svg';

/** Web photos by spot id (folder slug under public/spots). A spot not listed here shows the placeholder. */
const PHOTO_FOLDERS: Record<string, string> = {
  'osm-w1431054042': 'g-co-cafe-digos',
  'osm-n13308179172': 'lil-ben-coffee-house-digos',
  'osm-n13168672184': 'cafe-vicente-digos',
  'osm-n13049364628': 'cely-s-cafe-digos',
  'digos-the-tipsy-butter': 'the-tipsy-butter-digos',
  'digos-infinitea': 'infinitea-digos',
  'digos-kaffeeneology': 'kaffeeneology-digos',
  'digos-cool-brews': 'cool-brews-digos',
  'digos-the-nook': 'the-nook-digos',
};

const photosFor = (spot: ListedCafe): string[] => {
  const folder = PHOTO_FOLDERS[spot.id];
  return folder ? [`/spots/${folder}/photo-1.webp`] : [PLACEHOLDER_PHOTO];
};

const NO_HOURS: WeeklyHours = {
  Monday: { open: null, close: null },
  Tuesday: { open: null, close: null },
  Wednesday: { open: null, close: null },
  Thursday: { open: null, close: null },
  Friday: { open: null, close: null },
  Saturday: { open: null, close: null },
  Sunday: { open: null, close: null },
};

type Window = [open: string, close: string];
const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** One window per day; a close at or before the open runs past midnight (10:00 to 01:00). */
const week = (windows: Record<Weekday, Window>): WeeklyHours =>
  Object.fromEntries(WEEKDAYS.map((day) => [day, { open: windows[day][0], close: windows[day][1] }])) as WeeklyHours;

const same = (open: string, close: string): Record<Weekday, Window> =>
  Object.fromEntries(WEEKDAYS.map((day) => [day, [open, close] as Window])) as Record<Weekday, Window>;

/**
 * Weekly hours by spot id, read on 2026-09-29 from the restaurantguru.com listing for each shop (Google Business
 * data, updated within the last two months), and checked against the "Open, closes at" line Lex's Google Maps
 * screenshots showed the same day. A spot with no source found is not listed here and keeps "Hours not listed":
 * Lil' Ben Coffee House, Cely's Cafe, Infinitea, Cool Brews. Hours change; re-check before trusting them long term.
 */
const HOURS: Record<string, WeeklyHours> = {
  // G&Co. Cafe: daily 10AM-10PM (screenshot: Closes 10 PM)
  'osm-w1431054042': week(same('10:00', '22:00')),
  // Café Vicente: Sun-Thu 10AM-8PM, Fri-Sat 8:30AM-9PM (screenshot: Closes 8 PM)
  'osm-n13168672184': week({ ...same('10:00', '20:00'), Friday: ['08:30', '21:00'], Saturday: ['08:30', '21:00'] }),
  // The Tipsy Butter: Mon-Sat 9AM-7PM, Sun 9AM-5PM (a single listing; the screenshot showed no status)
  'digos-the-tipsy-butter': week({ ...same('09:00', '19:00'), Sunday: ['09:00', '17:00'] }),
  // Kaffeeneology: Mon-Sat 10AM-1AM, Sun 1PM-10PM (screenshot: Closes 1 AM)
  'digos-kaffeeneology': week({ ...same('10:00', '01:00'), Sunday: ['13:00', '22:00'] }),
  // The Nook: Mon-Sat 10AM-10PM, Sun 1PM-10PM (also stated in mid-2025 posts; screenshot: Closes 10 PM)
  'digos-the-nook': week({ ...same('10:00', '22:00'), Sunday: ['13:00', '22:00'] }),
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
  images: photosFor(spot),
  logoUrl: photosFor(spot)[0],
  description: '',
  signature: '',
  menu: [],
  amenities: [],
  wifiMbps: 0,
  brewMethods: [],
  priceLevel: 0,
  hours: HOURS[spot.id] ?? NO_HOURS,
  vibeTags: [],
  verified: false,
  saveCount: 0,
  viewCount: 0,
  dateAdded: '2026-09-29',
}));
