import type { Cafe } from '../types/coffee';
import type { GeoPoint } from '../utils/geo';

/**
 * Sanctuary visits (focus sessions and Quick Stamps): the row shape stored in Supabase (sanctuary_visits),
 * the input the check-in flow builds, client checks that mirror the database constraints, and the pure
 * summaries the passport, diary and cafe pulse read. No I/O here, so every rule is unit tested.
 */

export type SessionType = 'focus' | 'stamp';
export type NoiseLevel = 'quiet' | 'hum' | 'buzzing';
export type OutletsStatus = 'plenty' | 'crowded' | 'none';

export const NOISE_LEVELS: { id: NoiseLevel; label: string }[] = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'hum', label: 'Hum' },
  { id: 'buzzing', label: 'Buzzing' },
];

export const OUTLET_STATUSES: { id: OutletsStatus; label: string }[] = [
  { id: 'plenty', label: 'Plenty' },
  { id: 'crowded', label: 'Crowded' },
  { id: 'none', label: 'None' },
];

/** Must match the check constraints and the rate-limit trigger in 20260929030000_sanctuary_visits.sql. */
export const VISIT_LIMITS = {
  minMinutes: 5,
  maxMinutes: 1440,
  stampMinutes: 30,
  notes: 500,
  drink: 60,
  maxDistanceMeters: 150,
  dailyVisits: 6,
} as const;

/** Columns clients may read. Device coordinates are deliberately absent (the database refuses them too). */
export const VISIT_COLUMNS =
  'id, user_id, visitor_name, cafe_id, cafe_name, city, session_type, duration_minutes, drink_ordered, noise_level, outlets_status, notes, is_public, verified_distance_meters, clinks_count, created_at';

export interface VisitRow {
  id: string;
  user_id: string;
  visitor_name: string;
  cafe_id: string;
  cafe_name: string;
  city: string;
  session_type: SessionType;
  duration_minutes: number;
  drink_ordered: string | null;
  noise_level: NoiseLevel | null;
  outlets_status: OutletsStatus | null;
  notes: string | null;
  is_public: boolean;
  verified_distance_meters: number | string;
  clinks_count: number;
  created_at: string;
}

export interface Visit {
  id: string;
  /** Author account; null for a visit logged on this device while signed out. */
  userId: string | null;
  visitorName: string;
  cafeId: string;
  cafeName: string;
  city: string;
  sessionType: SessionType;
  durationMinutes: number;
  drinkOrdered: string | null;
  noiseLevel: NoiseLevel | null;
  outletsStatus: OutletsStatus | null;
  notes: string | null;
  isPublic: boolean;
  distanceMeters: number;
  clinksCount: number;
  createdAt: string;
  /** False while the visit exists only on this device. */
  synced: boolean;
}

export interface VisitInput {
  cafe: Pick<Cafe, 'id' | 'name' | 'city'>;
  sessionType: SessionType;
  durationMinutes: number;
  drinkOrdered?: string;
  noiseLevel?: NoiseLevel | null;
  outletsStatus?: OutletsStatus | null;
  notes?: string;
  isPublic: boolean;
  /** Where the device was when the check-in was verified. Sent once, never read back. */
  device: GeoPoint;
  distanceMeters: number;
}

/** Returns the first problem with the input, or null when it can be recorded. */
export function validateVisitInput(input: VisitInput): string | null {
  const minutes = input.durationMinutes;
  if (!Number.isInteger(minutes)) return 'Session length must be whole minutes.';
  if (input.sessionType === 'stamp' && minutes !== VISIT_LIMITS.stampMinutes) return 'A Quick Stamp is always 30 minutes.';
  if (minutes < VISIT_LIMITS.minMinutes) return `Sessions under ${VISIT_LIMITS.minMinutes} minutes are not logged.`;
  if (minutes > VISIT_LIMITS.maxMinutes) return 'A session can be at most 24 hours.';
  if (!Number.isFinite(input.distanceMeters) || input.distanceMeters < 0) return 'Your location could not be verified.';
  if (input.distanceMeters > VISIT_LIMITS.maxDistanceMeters) return 'You need to be at the spot to log a visit.';
  if ((input.drinkOrdered ?? '').trim().length > VISIT_LIMITS.drink) return `Keep the drink under ${VISIT_LIMITS.drink} characters.`;
  if ((input.notes ?? '').trim().length > VISIT_LIMITS.notes) return `Keep notes under ${VISIT_LIMITS.notes} characters.`;
  return null;
}

const blankToNull = (value: string | undefined) => {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
};

const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

/** The insert payload. user_id, visitor_name, clinks_count and created_at are set by the database. */
export function toInsertRow(input: VisitInput) {
  return {
    cafe_id: input.cafe.id,
    cafe_name: input.cafe.name.slice(0, 80),
    city: input.cafe.city,
    session_type: input.sessionType,
    duration_minutes: input.durationMinutes,
    drink_ordered: blankToNull(input.drinkOrdered),
    noise_level: input.noiseLevel ?? null,
    outlets_status: input.outletsStatus ?? null,
    notes: blankToNull(input.notes),
    is_public: input.isPublic,
    user_lat: round(input.device.lat, 6),
    user_lng: round(input.device.lng, 6),
    verified_distance_meters: round(input.distanceMeters, 2),
  };
}

export function rowToVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    userId: row.user_id,
    visitorName: row.visitor_name || 'Haraya scout',
    cafeId: row.cafe_id,
    cafeName: row.cafe_name,
    city: row.city,
    sessionType: row.session_type,
    durationMinutes: row.duration_minutes,
    drinkOrdered: row.drink_ordered,
    noiseLevel: row.noise_level,
    outletsStatus: row.outlets_status,
    notes: row.notes,
    isPublic: row.is_public,
    distanceMeters: Number(row.verified_distance_meters),
    clinksCount: row.clinks_count,
    createdAt: row.created_at,
    synced: true,
  };
}

/** A visit kept on this device (signed out, or before the database table exists). */
export function inputToLocalVisit(input: VisitInput, id: string, userId: string | null, visitorName: string, now: Date): Visit {
  const row = toInsertRow(input);
  return {
    id,
    userId,
    visitorName,
    cafeId: row.cafe_id,
    cafeName: row.cafe_name,
    city: row.city,
    sessionType: row.session_type,
    durationMinutes: row.duration_minutes,
    drinkOrdered: row.drink_ordered,
    noiseLevel: row.noise_level,
    outletsStatus: row.outlets_status,
    notes: row.notes,
    isPublic: row.is_public,
    distanceMeters: row.verified_distance_meters,
    clinksCount: 0,
    createdAt: now.toISOString(),
    synced: false,
  };
}

/** One list, newest first; when the same id appears twice the database copy wins. */
export function mergeVisits(local: Visit[], remote: Visit[]): Visit[] {
  const byId = new Map<string, Visit>();
  for (const visit of local) byId.set(visit.id, visit);
  for (const visit of remote) byId.set(visit.id, visit);
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Visits in the rolling 24 hours before now, the window the database rate limit uses. */
export function visitsInLastDay(visits: Visit[], now: Date): number {
  return visits.filter((visit) => now.getTime() - Date.parse(visit.createdAt) < DAY_MS).length;
}

export interface PassportStats {
  focusMinutes: number;
  /** cafe id to the date of the first visit there */
  stamps: Map<string, string>;
  clinksReceived: number;
}

export function computePassportStats(visits: Visit[]): PassportStats {
  const stamps = new Map<string, string>();
  let focusMinutes = 0;
  let clinksReceived = 0;
  for (const visit of visits) {
    focusMinutes += visit.durationMinutes;
    clinksReceived += visit.clinksCount;
    const first = stamps.get(visit.cafeId);
    if (!first || Date.parse(visit.createdAt) < Date.parse(first)) stamps.set(visit.cafeId, visit.createdAt);
  }
  return { focusMinutes, stamps, clinksReceived };
}

export interface CommunityPulse {
  noise: NoiseLevel;
  reports: number;
  latestAt: string;
}

/** The most reported noise level in the last 24 hours (ties go to the most recent report), or null. */
export function communityPulse(visits: Visit[], now: Date): CommunityPulse | null {
  const recent = visits
    .filter((visit) => visit.noiseLevel && now.getTime() - Date.parse(visit.createdAt) < DAY_MS)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (recent.length === 0) return null;
  const tally = new Map<NoiseLevel, { reports: number; latestAt: string }>();
  for (const visit of recent) {
    const level = visit.noiseLevel as NoiseLevel;
    const entry = tally.get(level);
    if (entry) entry.reports += 1;
    else tally.set(level, { reports: 1, latestAt: visit.createdAt });
  }
  let best: CommunityPulse | null = null;
  for (const [noise, entry] of tally) {
    if (!best || entry.reports > best.reports) best = { noise, ...entry };
  }
  return best;
}

/** "45m", "2h", "2h 15m" */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Focus hours with one decimal: 0, 0.5, 38.5 */
export function formatHours(minutes: number): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/** "just now", "5 min ago", "2 hours ago", "3 days ago", then a short date. */
export function timeAgo(iso: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** True when the database reports the table as missing (migration not applied yet). */
export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const text = (error.message ?? '').toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes('does not exist') ||
    text.includes('could not find the table') ||
    text.includes('schema cache')
  );
}

/** Friendly text for errors raised by the triggers, policies and constraints. */
export function describeVisitError(message: string): string {
  if (message.includes('visit_limit')) return 'You can log up to 6 visits a day. Try again tomorrow.';
  if (message.includes('visit_too_far')) return 'You need to be at the spot to check in. Move closer and try again.';
  if (message.includes('visit_unknown_spot')) return 'This spot cannot take check-ins yet.';
  if (message.includes('row-level security')) return 'Sign in again to log this visit.';
  if (message.includes('violates check constraint')) return 'Some visit details were not accepted. Check them and try again.';
  return 'Could not save the visit. Try again.';
}
