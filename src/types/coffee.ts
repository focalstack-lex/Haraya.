/**
 * Haraya domain model: Davao Region cafes and study spots (listed or added by the community), plus the
 * retired bean, drop and Cup Check records whose code is kept while hidden from navigation.
 */

export const DAVAO_CITIES = [
  'All Davao Region',
  'Davao City',
  'Tagum City',
  'Digos City',
  'Panabo City',
  'Mati City',
  'Samal Island',
] as const;
//okey keyow
export type DavaoCity = (typeof DAVAO_CITIES)[number];

export const DAVAO_DISTRICTS = [
  'Poblacion',
  'Bajada',
  'Juna Subd',
  'Lanang',
  'Matina',
  'Toril',
  'Mt. Apo Highlands',
  'Tagum',
  'Digos',
  'Panabo',
  'Mati',
  'Samal',
] as const;

export type District = (typeof DAVAO_DISTRICTS)[number];

/** Work and comfort amenities a cafe can advertise. */
export type AmenityKey =
  | 'fastWifi'
  | 'plugs'
  | 'aircon'
  | 'outdoor'
  | 'petFriendly'
  | 'lateNight'
  | 'quietFocus'
  | 'workFriendly'
  | 'pourOverBar'
  | 'oatMilk';

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  fastWifi: 'Fast WiFi',
  plugs: 'Plugs at Seats',
  aircon: 'Air-Conditioned',
  outdoor: 'Outdoor Garden',
  petFriendly: 'Pet-Friendly',
  lateNight: 'Late Night',
  quietFocus: 'Quiet Focus',
  workFriendly: 'Work-Friendly',
  pourOverBar: 'Pour-Over Bar',
  oatMilk: 'Oat Milk',
};

export const BREW_METHODS = [
  'Espresso',
  'Pour Over',
  'V60',
  'Kalita',
  'Aeropress',
  'Cold Brew',
  'French Press',
  'Siphon',
] as const;

export type BrewMethod = (typeof BREW_METHODS)[number];

export type RoastLevel = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';

export type Process = 'Washed' | 'Natural' | 'Honey' | 'Anaerobic Natural' | 'Wet-Hulled';

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/** "06:30" style 24h strings; null means closed that day. */
export interface DayHours {
  open: string | null;
  close: string | null;
}

export type WeeklyHours = Record<Weekday, DayHours>;

export interface MenuItem {
  name: string;
  price: number;
  category: 'Espresso Bar' | 'Filter' | 'Signature' | 'Pastry';
  description?: string;
}

/** A spot added through Add a Spot. Pending spots are visible only to the person who added them. */
export interface CommunityMeta {
  status: 'pending' | 'approved';
  /** The contributor's local tip, for example where the sockets are. */
  tip: string;
}

export interface Cafe {
  id: string;
  handle: string;
  name: string;
  /** True when the venue roasts its own beans; shown to visitors as "Brews in-house". */
  isRoastery: boolean;
  city: DavaoCity;
  district: District;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  logoUrl: string;
  description: string;
  /** The drink the venue is known for; shown on cards and the hero. */
  signature: string;
  menu: MenuItem[];
  amenities: AmenityKey[];
  wifiMbps: number;
  brewMethods: BrewMethod[];
  /** 0 = not listed (nothing is shown), 1 = budget cup, 2 = mid specialty, 3 = premium tasting bar. */
  priceLevel: 0 | 1 | 2 | 3;
  hours: WeeklyHours;
  vibeTags: string[];
  verified: boolean;
  saveCount: number;
  viewCount: number;
  dateAdded: string;
  /** Present only on community-added spots. */
  community?: CommunityMeta;
  /** True when the place has shut for good; it stays findable but takes no check-ins. */
  closed?: boolean;
  /** The owner's announcement (a closure, holiday hours), with the last day it applies. */
  notice?: { text: string; until: string | null };
}

export interface RoastProfile {
  roastLevel: RoastLevel;
  acidity: 1 | 2 | 3 | 4 | 5;
  body: 1 | 2 | 3 | 4 | 5;
  sweetness: 1 | 2 | 3 | 4 | 5;
  /** Suggested brew recipe shown on the bean detail sheet. */
  suggestedBrew: string;
}

export interface Bean {
  id: string;
  roasterId: string;
  roasterName: string;
  name: string;
  origin: string;
  farm: string;
  varietal: string;
  process: Process;
  altitudeMasl: number;
  tastingNotes: string[];
  roastProfile: RoastProfile;
  /** 250g whole bean bag price in PHP. */
  price: number;
  /** Optional drip-pack (per-cup sachet) price in PHP. */
  dripPackPrice: number | null;
  bagsInStock: number;
  images: string[];
  description: string;
  /** Limited micro-lot: renders with the warm roast accent. */
  isLimited: boolean;
  singleOrigin: boolean;
  dateAdded: string;
}

export type DropStatus = 'scheduled' | 'live' | 'soldOut';

export interface RoastDrop {
  id: string;
  roasterId: string;
  roasterName: string;
  beanId: string;
  title: string;
  description: string;
  /** ISO timestamp of the batch release. */
  dropAt: string;
  batchBags: number;
  price: number;
  status: DropStatus;
  remindCount: number;
  coverImage: string;
  createdAt: string;
}

export interface Trail {
  id: string;
  name: string;
  description: string;
  /** Ordered cafe ids forming the hop sequence. */
  cafeIds: string[];
  focus: string;
}

export interface FlavorPin {
  id: string;
  label: string;
  /** Percentage coordinates on the post image (0 to 100). */
  x: number;
  y: number;
}

export interface PostComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CupPost {
  id: string;
  author: string;
  authorHandle: string;
  cafeId: string | null;
  caption: string;
  image: string;
  pins: FlavorPin[];
  brewMethod: BrewMethod | null;
  likes: number;
  comments: PostComment[];
  createdAt: string;
}

export interface BeanReservation {
  id: string;
  beanId: string;
  beanName: string;
  roasterId: string;
  roasterName: string;
  name: string;
  contact: string;
  packType: 'Whole Bean' | 'Drip Pack';
  quantity: number;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed';
}

/** Price bands used by the feed quick filters. */
export interface PriceRange {
  id: 'any' | 'budget' | 'mid' | 'premium';
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: 'any', label: 'Any Price', min: 0, max: Number.MAX_SAFE_INTEGER },
  { id: 'budget', label: 'Under 150', min: 0, max: 149 },
  { id: 'mid', label: '150 to 350', min: 150, max: 350 },
  { id: 'premium', label: '350+', min: 350, max: Number.MAX_SAFE_INTEGER },
];
