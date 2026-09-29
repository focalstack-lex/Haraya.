import type { Cafe, WeeklyHours } from '../types/coffee';

/**
 * Coffee shops in Digos City found on OpenStreetMap (ODbL, (c) OpenStreetMap contributors), searched on
 * 2026-09-29. The source states a name, a map position and a street, so that is all these listings carry:
 * no hours, photo, price, menu, Wi-Fi or description, and no barangay (the source's zone order is ambiguous).
 * The app shows what is missing as missing: "Hours not listed", the no-photo placeholder, no price. When a spot's
 * facts are checked (a Google Business listing, the owner, a visit), move it to `spots.ts` with the full record.
 * Rebuild the rows with `reports/digos-cafes/build-digos-cafes.py`. Community-edited data: a shop can have closed.
 */

interface OsmCafe {
  osmId: string;
  name: string;
  street: string;
  lat: number;
  lng: number;
}

const OSM_DIGOS_CAFES: OsmCafe[] = [
  { osmId: 'n13200094574', name: 'Apex Cafe', street: 'Roxas Extension', lat: 6.749736, lng: 125.349811 },
  { osmId: 'n13274159085', name: "Basti's Cafe", street: 'A. Mabini Street', lat: 6.740822, lng: 125.355991 },
  { osmId: 'n13290490375', name: 'BKLD Cafe', street: 'Rizal Avenue', lat: 6.759273, lng: 125.356181 },
  { osmId: 'n13175259192', name: 'Bleu Cafe', street: 'Kapatagan Road', lat: 6.759780, lng: 125.371287 },
  { osmId: 'n13264167223', name: 'Boni Coffee Lounge and Sports Bar', street: 'A. Bonifacio Street', lat: 6.742698, lng: 125.358642 },
  { osmId: 'n13025852895', name: 'Brewed Ways Coffee', street: 'MacArthur Highway', lat: 6.764540, lng: 125.346728 },
  { osmId: 'n13200094516', name: 'Cafe de Haz', street: 'Roxas Extension', lat: 6.749554, lng: 125.352265 },
  { osmId: 'n12629241649', name: 'Cafe Leonida', street: 'Roxas Extension', lat: 6.750266, lng: 125.344889 },
  { osmId: 'n13168672184', name: 'Cafe Vicente', street: 'Danjeting Drive', lat: 6.753006, lng: 125.348833 },
  { osmId: 'n13049364628', name: "Cely's Cafe", street: 'Rizal Avenue', lat: 6.753420, lng: 125.356339 },
  { osmId: 'n13255492316', name: "Cely's Cafe", street: 'Diversion Road', lat: 6.724207, lng: 125.356016 },
  { osmId: 'n13265977401', name: "Cely's Cafe", street: 'Davao-Cotabato Highway', lat: 6.770215, lng: 125.377517 },
  { osmId: 'n13049414811', name: 'Ciudad Fleur Cafe', street: 'Roxas Extension', lat: 6.749850, lng: 125.351391 },
  { osmId: 'n13274182320', name: 'Coffee Bean Brewed', street: 'A. Mabini Street', lat: 6.740761, lng: 125.364450 },
  { osmId: 'n13164246030', name: 'Dabig C Coffee', street: 'Governor Douglas R.A. Cagas Road', lat: 6.750749, lng: 125.334899 },
  { osmId: 'w1431054042', name: 'G&Co. Cafe', street: 'Doctor R. V. Ramos Drive', lat: 6.760166, lng: 125.347892 },
  { osmId: 'n13049222619', name: 'Kleenest Cafe', street: 'Abella Street', lat: 6.758828, lng: 125.350164 },
  { osmId: 'n13308179172', name: "Lil' Ben Coffee House", street: 'Santa Ana Street', lat: 6.762560, lng: 125.336229 },
  { osmId: 'n13049222620', name: "Mamertos' Cafe", street: 'Quezon Avenue', lat: 6.758925, lng: 125.349965 },
  { osmId: 'n13282296147', name: 'Matwels Coffee Station', street: '1st Crumb Street', lat: 6.752992, lng: 125.360735 },
  { osmId: 'n13009311975', name: 'Meetingpoint Cafe', street: 'Sacred Heart Street', lat: 6.753035, lng: 125.354964 },
  { osmId: 'n13154430136', name: 'Pickup Coffee', street: 'Quezon Avenue', lat: 6.759866, lng: 125.346924 },
  { osmId: 'n13121471807', name: "Ruzzel's Coffee Shop", street: 'Rizal Avenue', lat: 6.751058, lng: 125.355431 },
  { osmId: 'n13007533365', name: 'Sooyop Cafe', street: 'Rizal Avenue', lat: 6.742541, lng: 125.355303 },
  { osmId: 'n13115646104', name: 'Sophia Coffee & Breakfast', street: 'Kiagot Road', lat: 6.764930, lng: 125.356851 },
  { osmId: 'n13274159079', name: 'Tati Cafe', street: 'J. Burgos Street', lat: 6.739165, lng: 125.358266 },
  { osmId: 'n8121044720', name: 'The Coffee Company', street: 'Rizal Avenue', lat: 6.743098, lng: 125.354820 },
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

/** Stable URL handle from the name and the OSM id, so two branches of one shop never collide. */
const handleFor = (spot: OsmCafe) =>
  `${spot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${spot.osmId}`;

export const DIGOS_OSM_CAFES: Cafe[] = OSM_DIGOS_CAFES.map((spot) => ({
  id: `osm-${spot.osmId}`,
  handle: handleFor(spot),
  name: spot.name,
  isRoastery: false,
  city: 'Digos City',
  district: 'Digos',
  address: `${spot.street}, Digos City, Davao del Sur`,
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
