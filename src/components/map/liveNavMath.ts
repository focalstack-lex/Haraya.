import { distanceKm, type GeoPoint } from '../../utils/geo';

/**
 * Pure math for in-app walking navigation. The route is a straight line to the destination (there is no
 * street router), so walking figures apply a detour factor to the straight-line distance.
 */

/** Streets are rarely straight: walking distance is about 1.3 times the straight line. */
export const DETOUR_FACTOR = 1.3;
/** Average walking pace in km per hour. */
export const WALK_KMH = 4.8;
/** Within this straight-line distance the visitor counts as arrived. */
export const ARRIVAL_KM = 0.03;
/** Ignore movement below this when deriving a heading from two fixes (GPS jitter). */
const MIN_HEADING_MOVE_KM = 0.005;

/** Whole minutes of walking left, at least 1 while not yet arrived. */
export function walkMinutesLeft(straightKm: number): number {
  if (straightKm <= ARRIVAL_KM) return 0;
  return Math.max(1, Math.round(((straightKm * DETOUR_FACTOR) / WALK_KMH) * 60));
}

/** Share of the walk completed, from the distance at the first fix to the distance now (0 to 1). */
export function walkProgress(startKm: number, remainingKm: number): number {
  if (startKm <= ARRIVAL_KM) return 1;
  const done = 1 - Math.max(0, remainingKm - ARRIVAL_KM) / (startKm - ARRIVAL_KM);
  return Math.min(1, Math.max(0, done));
}

export const hasArrived = (remainingKm: number) => remainingKm <= ARRIVAL_KM;

/** Initial compass bearing from a to b in degrees, 0 = north, clockwise. */
export function bearingDegrees(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/**
 * Heading for the "You" marker: the device's own heading when it reports one while moving, otherwise the
 * direction of travel between the last two fixes, otherwise the previous heading.
 */
export function nextHeading(
  deviceHeading: number | null,
  previous: GeoPoint | null,
  current: GeoPoint,
  lastHeading: number | null
): number | null {
  if (deviceHeading !== null && Number.isFinite(deviceHeading)) return deviceHeading;
  if (previous && distanceKm(previous, current) >= MIN_HEADING_MOVE_KM) return bearingDegrees(previous, current);
  return lastHeading;
}

/** "350 m" under a kilometre, "1.2 km" above. */
export function formatRemaining(km: number): string {
  if (km < 1) return `${Math.max(0, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1)} km`;
}
