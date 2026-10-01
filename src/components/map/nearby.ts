import { distanceKm, formatKm, walkMinutes, type GeoPoint } from '../../utils/geo';
import { DETOUR_FACTOR } from './liveNavMath';

/** Spots this close to the visitor show up on their own when the map opens. */
export const NEARBY_RADIUS_KM = 4;

export interface Distance {
  /** Straight line, the figure the nearby radius and the ring on the map use. */
  km: number;
  /** Along the roads when the router answered (roadDistance.ts): the figure a maps app shows. */
  roadKm: number | null;
}

export interface SpotDistance<T> extends Distance {
  spot: T;
}

/**
 * Every spot with its distance from the visitor, nearest first by straight line, split at the nearby radius.
 * Road distances, when known, ride along for display; the split stays on the straight line so it matches the
 * ring drawn on the map and works offline.
 */
export function splitByDistance<T extends GeoPoint & { id: string }>(
  spots: T[],
  from: GeoPoint,
  radiusKm: number = NEARBY_RADIUS_KM,
  roadKm: ReadonlyMap<string, number> | null = null
): { nearby: SpotDistance<T>[]; farther: SpotDistance<T>[] } {
  const ranked = spots
    .map((spot) => ({ spot, km: distanceKm(from, spot), roadKm: roadKm?.get(spot.id) ?? null }))
    .sort((a, b) => a.km - b.km);
  const cut = ranked.findIndex((entry) => entry.km > radiusKm);
  return cut === -1 ? { nearby: ranked, farther: [] } : { nearby: ranked.slice(0, cut), farther: ranked.slice(cut) };
}

/** The distance to show, and which kind it is: "20.8 km" "by road", or "14.2 km" "straight line". */
export function describeDistance(distance: Distance): { value: string; note: string } {
  return distance.roadKm !== null
    ? { value: formatKm(distance.roadKm), note: 'by road' }
    : { value: formatKm(distance.km), note: 'straight line' };
}

/** Walking estimate along the roads, or along the straight line with the usual detour allowance. */
export function walkMinutesFor(distance: Distance): number {
  return walkMinutes(distance.roadKm ?? distance.km * DETOUR_FACTOR);
}
