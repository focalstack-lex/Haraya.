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
 * Every spot with its distance from the visitor, split at the nearby radius, each side nearest first by the
 * distance it shows (by road when known). The split stays on the straight line so it matches the ring drawn on
 * the map and works offline.
 */
export function splitByDistance<T extends GeoPoint & { id: string }>(
  spots: T[],
  from: GeoPoint,
  radiusKm: number = NEARBY_RADIUS_KM,
  roadKm: ReadonlyMap<string, number> | null = null
): { nearby: SpotDistance<T>[]; farther: SpotDistance<T>[] } {
  const nearby: SpotDistance<T>[] = [];
  const farther: SpotDistance<T>[] = [];
  for (const spot of spots) {
    const entry = { spot, km: distanceKm(from, spot), roadKm: roadKm?.get(spot.id) ?? null };
    (entry.km <= radiusKm ? nearby : farther).push(entry);
  }
  const shown = (entry: Distance) => entry.roadKm ?? entry.km;
  nearby.sort((a, b) => shown(a) - shown(b));
  farther.sort((a, b) => shown(a) - shown(b));
  return { nearby, farther };
}

/** The distance to show, and which kind it is: "20.8 km" "by road", or "14.2 km" "straight line". */
export function describeDistance(distance: Distance): { value: string; note: string } {
  return distance.roadKm !== null
    ? { value: formatKm(distance.roadKm), note: 'by road' }
    : { value: formatKm(distance.km), note: 'straight line' };
}

/**
 * Walking estimate. The road figure follows the car network (one-way streets, no footpaths), so a walk is taken
 * as the shorter of it and the straight line with the usual detour allowance.
 */
export function walkMinutesFor(distance: Distance): number {
  const onFoot = distance.km * DETOUR_FACTOR;
  return walkMinutes(distance.roadKm === null ? onFoot : Math.min(distance.roadKm, onFoot));
}
