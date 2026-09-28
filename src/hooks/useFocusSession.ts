import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { Cafe } from '../types/coffee';
import { calculateDistanceMeters, SESSION_EXIT_RADIUS_M, type GeoPoint } from '../utils/geo';
import { visitService } from '../services/visitService';
import { formatDuration, VISIT_LIMITS } from '../services/visitMapping';

/**
 * The running Deep Focus Session. It lives in localStorage (haraya_active_focus) so a refresh, a tab change or
 * closing the browser does not lose it, and a module store so the floating banner, the check-in sheet and the
 * end sheet all see the same session. useFocusBoundaryWatch follows the GPS while a session runs and saves it
 * by itself once the device has left the venue (two fixes in a row beyond 150 m, so one jittery fix is not
 * enough). Positions are compared in memory only; nothing but the check-in fix is ever stored.
 */

const KEY = 'haraya_active_focus';

export interface ActiveFocusSession {
  cafeId: string;
  cafeName: string;
  city: string;
  /** [lat, lng] */
  cafeCoordinates: [number, number];
  /** ISO time the session started */
  startedAt: string;
  /** [lat, lng] of the verified check-in fix */
  userStartCoordinates: [number, number];
  /** Distance at check-in; the value the saved visit reports as verified. */
  startDistanceMeters: number;
}

/** Consecutive fixes outside the exit radius that end a session. */
export const EXIT_FIXES = 2;

const isPair = (value: unknown): value is [number, number] =>
  Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Validates what localStorage holds; anything malformed reads as no session. */
export function parseActiveSession(raw: string | null): ActiveFocusSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ActiveFocusSession>;
    if (
      typeof value.cafeId === 'string' &&
      typeof value.cafeName === 'string' &&
      typeof value.city === 'string' &&
      typeof value.startedAt === 'string' &&
      !Number.isNaN(Date.parse(value.startedAt)) &&
      isPair(value.cafeCoordinates) &&
      isPair(value.userStartCoordinates) &&
      typeof value.startDistanceMeters === 'number'
    ) {
      return value as ActiveFocusSession;
    }
  } catch {
    // fall through: a corrupt entry is treated as no session
  }
  return null;
}

/** Whole minutes since the start, as the spec rounds them. */
export function elapsedMinutes(startedAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - Date.parse(startedAt)) / 60_000));
}

/** Seconds since the start, for the live HH:MM:SS timer. */
export function elapsedSeconds(startedAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
}

/** Fixes in a row beyond the exit radius; any fix back inside resets the count. */
export function nextOutsideCount(previous: number, distanceMeters: number): number {
  return distanceMeters > SESSION_EXIT_RADIUS_M ? previous + 1 : 0;
}

// Store ----------------------------------------------------------------------------------------------------

const listeners = new Set<() => void>();
let active: ActiveFocusSession | null = null;
let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    active = parseActiveSession(localStorage.getItem(KEY));
  } catch (error) {
    console.warn('Haraya: could not read the focus session', error);
    active = null;
  }
  if (typeof window !== 'undefined') {
    // Another tab started or finished a session
    window.addEventListener('storage', (event) => {
      if (event.key !== KEY) return;
      active = parseActiveSession(event.newValue);
      listeners.forEach((listener) => listener());
    });
  }
}

function persist(next: ActiveFocusSession | null): void {
  active = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch (error) {
    console.warn('Haraya: could not store the focus session', error);
  }
  listeners.forEach((listener) => listener());
}

export const focusSessionStore = {
  subscribe(listener: () => void): () => void {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  get(): ActiveFocusSession | null {
    load();
    return active;
  },

  start(cafe: Pick<Cafe, 'id' | 'name' | 'city' | 'lat' | 'lng'>, device: GeoPoint): ActiveFocusSession {
    const session: ActiveFocusSession = {
      cafeId: cafe.id,
      cafeName: cafe.name,
      city: cafe.city,
      cafeCoordinates: [cafe.lat, cafe.lng],
      startedAt: new Date().toISOString(),
      userStartCoordinates: [device.lat, device.lng],
      startDistanceMeters: calculateDistanceMeters(device.lat, device.lng, cafe.lat, cafe.lng),
    };
    persist(session);
    return session;
  },

  clear(): void {
    persist(null);
  },
};

export function useActiveFocusSession(): ActiveFocusSession | null {
  return useSyncExternalStore(focusSessionStore.subscribe, focusSessionStore.get, () => null);
}

/** The visit a finished session becomes. Defaults are the auto-save ones; the end sheet overrides them. */
export function sessionToVisitInput(
  session: ActiveFocusSession,
  minutes: number,
  details: { drinkOrdered?: string; noiseLevel?: 'quiet' | 'hum' | 'buzzing' | null; outletsStatus?: 'plenty' | 'crowded' | 'none' | null; notes?: string; isPublic: boolean }
) {
  return {
    cafe: { id: session.cafeId, name: session.cafeName, city: session.city as Cafe['city'] },
    sessionType: 'focus' as const,
    durationMinutes: Math.min(minutes, VISIT_LIMITS.maxMinutes),
    device: { lat: session.userStartCoordinates[0], lng: session.userStartCoordinates[1] },
    distanceMeters: session.startDistanceMeters,
    ...details,
  };
}

export type AutoSaveOutcome =
  | { kind: 'saved'; message: string }
  | { kind: 'too-short'; message: string }
  | { kind: 'failed'; message: string };

/**
 * While a session runs, watches the GPS and ends the session once the device has left the venue: the visit
 * is saved as private (Only me), since nobody reviewed it, and onOutcome gets the toast text.
 */
export function useFocusBoundaryWatch(onOutcome: (outcome: AutoSaveOutcome) => void): void {
  const session = useActiveFocusSession();
  const outcomeRef = useRef(onOutcome);
  outcomeRef.current = onOutcome;

  useEffect(() => {
    if (!session || typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    let outside = 0;
    let finished = false;
    const [cafeLat, cafeLng] = session.cafeCoordinates;

    const finish = async () => {
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      // Another surface (the end sheet, another tab) may have closed the session already
      if (focusSessionStore.get()?.startedAt !== session.startedAt) return;
      const minutes = elapsedMinutes(session.startedAt);
      focusSessionStore.clear();
      if (minutes < VISIT_LIMITS.minMinutes) {
        outcomeRef.current({
          kind: 'too-short',
          message: `You left ${session.cafeName}. Sessions under ${VISIT_LIMITS.minMinutes} minutes are not logged.`,
        });
        return;
      }
      try {
        await visitService.recordVisit(sessionToVisitInput(session, minutes, { isPublic: false }));
        outcomeRef.current({
          kind: 'saved',
          message: `Focus session auto-saved: ${formatDuration(minutes)} at ${session.cafeName}`,
        });
      } catch (error) {
        outcomeRef.current({
          kind: 'failed',
          message: error instanceof Error ? error.message : 'Could not save the focus session.',
        });
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (finished) return;
        const distance = calculateDistanceMeters(position.coords.latitude, position.coords.longitude, cafeLat, cafeLng);
        outside = nextOutsideCount(outside, distance);
        if (outside >= EXIT_FIXES) void finish();
      },
      (error) => {
        // Denied or unavailable GPS leaves the session running; the user can still finish it by hand
        console.warn('Haraya: focus boundary watch paused', error.message);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    );

    return () => {
      finished = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session]);
}
