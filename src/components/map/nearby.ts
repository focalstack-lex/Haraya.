import { distanceKm, type GeoPoint } from '../../utils/geo';

/** Spots this close to the visitor show up on their own when the map opens. */
export const NEARBY_RADIUS_KM = 4;

export interface SpotDistance<T> {
  spot: T;
  km: number;
}

/** Every spot with its straight-line distance from the visitor, nearest first, split at the nearby radius. */
export function splitByDistance<T extends GeoPoint>(
  spots: T[],
  from: GeoPoint,
  radiusKm: number = NEARBY_RADIUS_KM
): { nearby: SpotDistance<T>[]; farther: SpotDistance<T>[] } {
  const ranked = spots.map((spot) => ({ spot, km: distanceKm(from, spot) })).sort((a, b) => a.km - b.km);
  const cut = ranked.findIndex((entry) => entry.km > radiusKm);
  return cut === -1 ? { nearby: ranked, farther: [] } : { nearby: ranked.slice(0, cut), farther: ranked.slice(cut) };
}
