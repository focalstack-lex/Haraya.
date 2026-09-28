import { distanceKm, type GeoPoint } from '../../utils/geo';
import { ARRIVAL_KM, WALK_KMH } from './liveNavMath';

/**
 * Pure math for following a street route: snap the visitor onto the nearest route segment, measure what is
 * left along the streets, and tell when they have wandered off it.
 */

/** Farther than this from the route line counts as off route and triggers a reroute. */
export const OFF_ROUTE_KM = 0.05;

export interface RouteProgress {
  /** Kilometres left along the route from the snapped position. */
  remainingKm: number;
  /** Straight distance from the visitor to the route line. */
  offRouteKm: number;
  /** What is still ahead: the snapped point, then every later route point. */
  ahead: GeoPoint[];
}

const KM_PER_DEG_LAT = 111.32;

/** Closest point to p on segment a-b, using a local flat projection (fine at street scale). */
function closestOnSegment(p: GeoPoint, a: GeoPoint, b: GeoPoint): GeoPoint {
  const kx = KM_PER_DEG_LAT * Math.cos((p.lat * Math.PI) / 180);
  const ax = (a.lng - p.lng) * kx;
  const ay = (a.lat - p.lat) * KM_PER_DEG_LAT;
  const bx = (b.lng - p.lng) * kx;
  const by = (b.lat - p.lat) * KM_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / lengthSq));
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Where the visitor is along the route. Needs at least two route points. */
export function progressAlongRoute(route: GeoPoint[], here: GeoPoint): RouteProgress {
  let best = { index: 0, point: route[0], km: Infinity };
  for (let i = 0; i < route.length - 1; i++) {
    const point = closestOnSegment(here, route[i], route[i + 1]);
    const km = distanceKm(here, point);
    if (km < best.km) best = { index: i, point, km };
  }

  const ahead = [best.point, ...route.slice(best.index + 1)];
  let remainingKm = 0;
  for (let i = 1; i < ahead.length; i++) remainingKm += distanceKm(ahead[i - 1], ahead[i]);
  return { remainingKm, offRouteKm: best.km, ahead };
}

/** Whole minutes of walking left along real streets (no detour factor), at least 1 before arrival. */
export function routeMinutesLeft(remainingKm: number): number {
  if (remainingKm <= ARRIVAL_KM) return 0;
  return Math.max(1, Math.round((remainingKm / WALK_KMH) * 60));
}

/** Share of the route walked, 0 to 1. */
export function routeProgress(totalKm: number, remainingKm: number): number {
  if (totalKm <= ARRIVAL_KM) return 1;
  return Math.min(1, Math.max(0, 1 - remainingKm / totalKm));
}
