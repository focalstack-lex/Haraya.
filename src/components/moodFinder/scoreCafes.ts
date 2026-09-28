import type { Cafe, MenuItem } from '../../types/coffee';
import { isOpenNow, minutesUntilClose } from '../../utils/calendar';
import { distanceKm, walkMinutes, type GeoPoint } from '../../utils/geo';
import { FOCUS_MIN_MINUTES, WIFI_MIN_MBPS, type MoodId, type MoodRequest, type MustHaveId } from './moods';

/**
 * The mood finder's matcher. Pure: the same catalog, request and context always give the same
 * result, and every pick is a cafe from the catalog passed in. Weights follow the spec:
 * mood 45, distance 25, hours left 10, weather 10, similarity to saved cafes 10.
 */

export interface Weather {
  rainy: boolean;
  hot: boolean;
  summary: string;
}

export interface ScoreContext {
  origin: GeoPoint;
  now: Date;
  weather: Weather | null;
  savedIds: string[];
  recentIds: string[];
}

export interface Match {
  cafe: Cafe;
  score: number;
  km: number;
  walkMin: number;
  minutesLeft: number;
  /** "22:00" when open now, otherwise null. */
  closesAt: string | null;
  reasons: string[];
  drink: string;
}

export type PickLabel = 'Best match' | 'Closest' | 'Wildcard';

export interface MoodResult {
  matches: Match[];
  picks: { label: PickLabel; match: Match }[];
  relax: { mustHave: MustHaveId; count: number } | null;
}

interface Trait {
  has: boolean;
  reason: string;
}

const hasWifi = (cafe: Cafe) => cafe.wifiMbps >= WIFI_MIN_MBPS;
const isHeritage = (cafe: Cafe) =>
  cafe.vibeTags.some((tag) => /heritage|ancestral/i.test(tag));

const MUST_HAVE_TEST: Record<MustHaveId, (cafe: Cafe, now: Date) => boolean> = {
  pets: (cafe) => cafe.amenities.includes('petFriendly'),
  wifi: hasWifi,
  quiet: (cafe) => cafe.amenities.includes('quietFocus'),
  plugs: (cafe) => cafe.amenities.includes('plugs'),
  aircon: (cafe) => cafe.amenities.includes('aircon'),
  outdoor: (cafe) => cafe.amenities.includes('outdoor'),
  openNow: (cafe, now) => isOpenNow(cafe.hours, now),
  pourOver: (cafe) => cafe.amenities.includes('pourOverBar'),
  oatMilk: (cafe) => cafe.amenities.includes('oatMilk'),
};

const mustHaveReason = (id: MustHaveId, cafe: Cafe, closesAt: string | null): string => {
  switch (id) {
    case 'pets':
      return 'Pet-friendly';
    case 'wifi':
      return `${cafe.wifiMbps} Mbps Wi-Fi`;
    case 'quiet':
      return 'Quiet focus';
    case 'plugs':
      return 'Plugs at seats';
    case 'aircon':
      return 'Air-conditioned';
    case 'outdoor':
      return 'Outdoor tables';
    case 'openNow':
      return closesAt ? `Open until ${closesAt}` : 'Open now';
    case 'pourOver':
      return 'Pour-over bar';
    case 'oatMilk':
      return 'Oat milk';
  }
};

const moodTraits = (mood: MoodId, cafe: Cafe, km: number, now: Date, recentIds: string[]): Trait[] => {
  switch (mood) {
    case 'focused':
      return [
        { has: cafe.amenities.includes('quietFocus'), reason: 'Quiet focus' },
        { has: cafe.amenities.includes('workFriendly'), reason: 'Work-friendly' },
        { has: cafe.amenities.includes('plugs'), reason: 'Plugs at seats' },
        { has: hasWifi(cafe), reason: `${cafe.wifiMbps} Mbps Wi-Fi` },
      ];
    case 'cozy':
      return [
        { has: cafe.amenities.includes('quietFocus'), reason: 'Quiet focus' },
        { has: isHeritage(cafe), reason: 'Heritage house' },
        { has: !cafe.amenities.includes('outdoor'), reason: 'Indoor seating' },
      ];
    case 'social':
      return [
        { has: cafe.amenities.includes('outdoor'), reason: 'Outdoor tables' },
        { has: cafe.amenities.includes('lateNight'), reason: 'Open late' },
        { has: cafe.priceLevel <= 2, reason: 'Easy on the wallet' },
      ];
    case 'treat':
      return [
        { has: cafe.priceLevel === 3, reason: 'Premium bar' },
        { has: cafe.amenities.includes('pourOverBar'), reason: 'Pour-over bar' },
        { has: cafe.isRoastery && cafe.verified, reason: 'Verified roastery' },
      ];
    case 'quick':
      return [
        { has: isOpenNow(cafe.hours, now), reason: 'Open now' },
        { has: cafe.priceLevel === 1, reason: 'Budget cup' },
        { has: km <= 2, reason: 'Close by' },
      ];
    case 'explore':
      return [
        { has: cafe.isRoastery, reason: 'Micro-roastery' },
        { has: cafe.verified, reason: 'Verified' },
        { has: !recentIds.includes(cafe.id), reason: 'New to you' },
      ];
  }
};

const DRINK_CATEGORIES: Record<MoodId, MenuItem['category'][]> = {
  focused: ['Espresso Bar', 'Filter'],
  treat: ['Signature', 'Filter'],
  cozy: ['Signature'],
  quick: ['Espresso Bar'],
  social: ['Signature'],
  explore: ['Signature'],
};

const suggestDrink = (cafe: Cafe, mood: MoodId | null): string => {
  for (const category of DRINK_CATEGORIES[mood ?? 'explore']) {
    const item = cafe.menu.find((entry) => entry.category === category);
    if (item) return item.name;
  }
  return cafe.signature;
};

const clockAfter = (now: Date, minutes: number): string => {
  const at = new Date(now.getTime() + minutes * 60_000);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
};

const distanceScore = (km: number) => (km <= 0.5 ? 1 : Math.max(0, (15 - km) / 14.5));

const passesFilters = (cafe: Cafe, request: MoodRequest, mustHaves: MustHaveId[], now: Date): boolean => {
  if (!mustHaves.every((id) => MUST_HAVE_TEST[id](cafe, now))) return false;
  if (request.maxPrice !== null && cafe.priceLevel > request.maxPrice) return false;
  if (request.district !== null && cafe.district !== request.district) return false;
  if (request.mood === 'focused' && minutesUntilClose(cafe.hours, now) < FOCUS_MIN_MINUTES) return false;
  return true;
};

export function scoreCafes(cafes: Cafe[], request: MoodRequest, ctx: ScoreContext): MoodResult {
  const { now, origin, weather, recentIds } = ctx;
  const saved = cafes.filter((cafe) => ctx.savedIds.includes(cafe.id));

  const matches: Match[] = cafes
    .filter((cafe) => passesFilters(cafe, request, request.mustHaves, now))
    .map((cafe) => {
      const km = distanceKm(origin, cafe);
      const minutesLeft = minutesUntilClose(cafe.hours, now);
      const closesAt = minutesLeft > 0 ? clockAfter(now, minutesLeft) : null;

      const traits = request.mood ? moodTraits(request.mood, cafe, km, now, recentIds) : [];
      const fit = traits.length > 0 ? traits.filter((trait) => trait.has).length / traits.length : 0.5;

      const rainyFit = Boolean(weather?.rainy) && (cafe.amenities.includes('quietFocus') || !cafe.amenities.includes('outdoor'));
      const hotFit = Boolean(weather?.hot) && cafe.amenities.includes('aircon');

      const similar = saved.some(
        (other) => other.id !== cafe.id && other.amenities.filter((key) => cafe.amenities.includes(key)).length >= 2
      );

      const score =
        45 * fit +
        25 * distanceScore(km) +
        10 * Math.min(1, minutesLeft / 240) +
        10 * (rainyFit || hotFit ? 1 : 0) +
        10 * (similar ? 1 : 0);

      const reasons = [
        ...request.mustHaves.map((id) => mustHaveReason(id, cafe, closesAt)),
        ...traits.filter((trait) => trait.has).map((trait) => trait.reason),
        ...(hotFit ? ['Cool air-con'] : []),
        ...(rainyFit ? ['Indoors for the rain'] : []),
      ];

      return {
        cafe,
        score: Math.round(score),
        km,
        walkMin: walkMinutes(km * 1.3),
        minutesLeft,
        closesAt,
        reasons: [...new Set(reasons)].slice(0, 3),
        drink: suggestDrink(cafe, request.mood),
      };
    })
    .sort((a, b) => b.score - a.score || b.cafe.saveCount - a.cafe.saveCount);

  const picks: MoodResult['picks'] = [];
  if (matches.length > 0) {
    const [best, ...rest] = matches;
    picks.push({ label: 'Best match', match: best });
    const closest = [...rest].sort((a, b) => a.km - b.km)[0];
    if (closest) picks.push({ label: 'Closest', match: closest });
    const wildcard = rest.find((match) => match !== closest && !recentIds.includes(match.cafe.id));
    if (wildcard) picks.push({ label: 'Wildcard', match: wildcard });
  }

  let relax: MoodResult['relax'] = null;
  if (matches.length === 0 && request.mustHaves.length > 0) {
    for (const id of request.mustHaves) {
      const without = request.mustHaves.filter((other) => other !== id);
      const count = cafes.filter((cafe) => passesFilters(cafe, request, without, now)).length;
      if (count > 0 && (!relax || count > relax.count)) relax = { mustHave: id, count };
    }
  }

  return { matches, picks, relax };
}
