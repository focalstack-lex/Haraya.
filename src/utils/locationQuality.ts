import { CHECK_IN_RADIUS_M } from './geo';

/**
 * How far to trust a position fix. navigator.geolocation reports an accuracy radius in metres with every fix:
 * GPS outdoors gives 5 to 30 m, Wi-Fi 20 to 100 m, a cell tower 500 m to 3 km, and a network or IP guess can
 * be a whole town off (tens of kilometres). The map draws that radius and says when the fix is only a guess,
 * instead of a confident dot in the wrong barangay.
 */

/** A fix at least this tight ends the wait for a better one. */
export const GOOD_FIX_M = 50;
/** How long after the first fix to keep listening for GPS to tighten it. */
export const REFINE_WINDOW_MS = 15_000;
/** Up to this radius the dot is where the visitor stands, give or take a street. */
export const PRECISE_M = 150;
/** Up to this radius the fix is the right neighbourhood (precise location off, or a cell tower); beyond it, a guess. */
export const APPROXIMATE_M = 2_500;

export type FixQuality = 'precise' | 'approximate' | 'rough';

export function fixQuality(accuracyM: number): FixQuality {
  // A missing or NaN radius is no better than a guess
  if (!(accuracyM >= 0)) return 'rough';
  if (accuracyM <= PRECISE_M) return 'precise';
  if (accuracyM <= APPROXIMATE_M) return 'approximate';
  return 'rough';
}

/** True when `next` should replace `best`: the first fix, or a tighter radius than the one kept. */
export function isBetterFix(best: { accuracy: number } | null, next: { accuracy: number }): boolean {
  if (best === null || !(best.accuracy >= 0)) return true;
  if (!(next.accuracy >= 0)) return false;
  return next.accuracy < best.accuracy;
}

/** "about 40 m", "about 1.5 km", "about 25 km". */
export function formatAccuracy(accuracyM: number): string {
  if (!(accuracyM >= 0) || accuracyM === Infinity) return 'an unknown distance';
  if (accuracyM < 1000) return `about ${Math.max(10, Math.round(accuracyM / 10) * 10)} m`;
  const km = accuracyM / 1000;
  return `about ${km < 10 ? String(Math.round(km * 10) / 10) : String(Math.round(km))} km`;
}

export type CheckInVerdict = 'near' | 'far' | 'unsure';

/**
 * Whether a fix puts the device inside a check-in circle. The reported accuracy is roughly a 68% radius, so a wide
 * fix that lands outside only counts as far when even twice its radius cannot reach the circle; otherwise it is
 * unsure, and the visitor is told the fix is too wide instead of being told they are kilometres away.
 */
export function checkInVerdict(distanceM: number, accuracyM: number, radiusM: number = CHECK_IN_RADIUS_M): CheckInVerdict {
  if (distanceM <= radiusM) return 'near';
  const spread = accuracyM >= 0 && Number.isFinite(accuracyM) ? accuracyM : Infinity;
  if (spread <= PRECISE_M || distanceM - 2 * spread > radiusM) return 'far';
  return 'unsure';
}

/** A fix that settles a check-in without waiting for a tighter one: tight, near at street accuracy, or plainly far. */
export function isDecisiveForCheckIn(distanceM: number, accuracyM: number, radiusM: number = CHECK_IN_RADIUS_M): boolean {
  if (accuracyM >= 0 && accuracyM <= GOOD_FIX_M) return true;
  const verdict = checkInVerdict(distanceM, accuracyM, radiusM);
  return verdict === 'far' || (verdict === 'near' && accuracyM <= PRECISE_M);
}
