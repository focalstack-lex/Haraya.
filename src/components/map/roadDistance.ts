import { useEffect, useRef, useState } from 'react';
import { distanceKm, type GeoPoint } from '../../utils/geo';
import { CAR_ROUTER, routerCredit } from '../../config/routing';

/**
 * Road distance from the visitor to each spot, from the OSRM table service (config/routing.ts: FOSSGIS unless
 * configured; car profile, the figure a maps app shows for directions). The straight line understates a drive by
 * a quarter or more, so the list says "by road" when this is in and "straight line" when it is not. One request
 * per fix, carrying the visitor's position and the spot coordinates; nothing is stored beyond this page's memory.
 * Answers are kept for CACHE_TTL_MS, so leaving the map tab and coming back does not ask again, and after a
 * failure the router is left alone for FAILURE_PAUSE_MS. Any failure returns null and the list falls back to
 * the straight line.
 */
const ROUTER = `${CAR_ROUTER}/table/v1/driving`;
const TIMEOUT_MS = 8_000;
/** The public table service takes up to 100 coordinates, the visitor being one; the nearest spots go first. */
export const MAX_SPOTS = 60;
/** A move shorter than this keeps the distances already fetched. */
export const REFETCH_AFTER_KM = 0.25;
/** How long an answer stays good for the same spot and nearly the same place. */
export const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX = 8;
/** After a failed request (a busy server, a 429, no signal), how long to show straight lines without asking. */
export const FAILURE_PAUSE_MS = 60_000;

/** Short, so the map credits still fit one line on a phone. */
export const ROAD_DISTANCE_ATTRIBUTION = `Roads: ${routerCredit(CAR_ROUTER)}`;

const coord = (p: GeoPoint) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`;

/** Metres by road to each destination, null where the router found no road; null for a reply that is not a table. */
export function parseTableDistances(body: unknown, count: number): (number | null)[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { code, distances } = body as { code?: unknown; distances?: unknown };
  if (code !== 'Ok' || !Array.isArray(distances) || !Array.isArray(distances[0])) return null;
  const row = distances[0] as unknown[];
  // One row for the single source: itself first, then every destination
  if (row.length !== count + 1) return null;
  const out: (number | null)[] = [];
  for (const value of row.slice(1)) {
    if (value === null) out.push(null);
    else if (typeof value === 'number' && Number.isFinite(value) && value >= 0) out.push(value);
    else return null;
  }
  return out;
}

/** The spots worth asking about: the nearest by straight line, up to the service limit. */
export function pickNearest<T extends GeoPoint>(spots: T[], from: GeoPoint, limit: number = MAX_SPOTS): T[] {
  return spots
    .map((spot) => ({ spot, km: distanceKm(from, spot) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map((entry) => entry.spot);
}

export async function fetchRoadDistances(from: GeoPoint, to: GeoPoint[], signal: AbortSignal): Promise<(number | null)[] | null> {
  if (to.length === 0) return [];
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal.addEventListener('abort', onOuterAbort);
  try {
    const coords = [from, ...to].map(coord).join(';');
    const response = await fetch(`${ROUTER}/${coords}?sources=0&annotations=distance`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const metres = parseTableDistances(await response.json(), to.length);
    if (!metres) throw new Error('unexpected table shape');
    return metres;
  } catch (error) {
    if (!signal.aborted) console.warn('Haraya: road distances unavailable, showing straight lines', error);
    return null;
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', onOuterAbort);
  }
}

/** Road kilometres by spot id, for one origin and one catalog. */
export interface RoadDistances {
  origin: GeoPoint;
  /** The catalog asked about, as its joined spot ids. */
  ids: string;
  byId: ReadonlyMap<string, number>;
  /** When the router answered, in ms since the epoch. */
  at: number;
}

/** True when an answer still fits: the same catalog, from within REFETCH_AFTER_KM of here. */
export function fitsHere(result: RoadDistances | null, from: GeoPoint, ids: string): result is RoadDistances {
  return result !== null && result.ids === ids && distanceKm(result.origin, from) < REFETCH_AFTER_KM;
}

// Answers kept for this page's lifetime, newest first; the map tab unmounts when the visitor leaves it
let cache: RoadDistances[] = [];
let pausedUntil = 0;

export function readCache(from: GeoPoint, ids: string, now: number = Date.now()): RoadDistances | null {
  return cache.find((entry) => now - entry.at < CACHE_TTL_MS && fitsHere(entry, from, ids)) ?? null;
}

export function writeCache(entry: RoadDistances): void {
  cache = [entry, ...cache.filter((kept) => kept !== entry)].slice(0, CACHE_MAX);
}

/** Tests only: forget every answer and any pause. */
export function resetRoadDistanceState(): void {
  cache = [];
  pausedUntil = 0;
}

/**
 * Kilometres by road from the visitor to each spot, by spot id, or null until the router answers (and when it
 * cannot). Asks again only when the visitor moves more than REFETCH_AFTER_KM or the catalog changes, or once a
 * failure pause ends; a filter on the list does not ask again, so pass every spot, not the filtered ones.
 * Distances measured from somewhere else are never shown: after a move the list reads "straight line" until the
 * new answer is in. Pass null to send nothing (no fix yet, a fix too wide to be worth routing, a walk running).
 */
export function useRoadDistances<T extends GeoPoint & { id: string }>(from: GeoPoint | null, spots: T[]): ReadonlyMap<string, number> | null {
  const [result, setResult] = useState<RoadDistances | null>(null);
  /** Bumped to ask again once a failure pause ends, when nothing else would. */
  const [retry, setRetry] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<{ controller: AbortController; origin: GeoPoint; ids: string } | null>(null);
  const ids = spots.map((spot) => spot.id).join(',');

  useEffect(() => {
    if (!from || spots.length === 0 || fitsHere(result, from, ids)) return;
    const cached = readCache(from, ids);
    if (cached) {
      // Held in state, the answer outlives the cache's TTL for as long as the visitor stays put
      setResult(cached);
      return;
    }
    const pending = inFlight.current;
    if (pending && pending.ids === ids && distanceKm(pending.origin, from) < REFETCH_AFTER_KM) return;
    const wait = pausedUntil - Date.now();
    if (wait > 0) {
      retryTimer.current ??= setTimeout(() => {
        retryTimer.current = undefined;
        setRetry((count) => count + 1);
      }, wait);
      return;
    }

    pending?.controller.abort();
    const controller = new AbortController();
    inFlight.current = { controller, origin: from, ids };
    const targets = pickNearest(spots, from);
    void fetchRoadDistances(from, targets, controller.signal).then((metres) => {
      if (controller.signal.aborted) return;
      inFlight.current = null;
      if (!metres) {
        pausedUntil = Date.now() + FAILURE_PAUSE_MS;
        // Runs the effect again, which waits out the pause and then asks once more
        setRetry((count) => count + 1);
        return;
      }
      const byId = new Map<string, number>();
      metres.forEach((m, index) => {
        if (m !== null) byId.set(targets[index].id, m / 1000);
      });
      const next: RoadDistances = { origin: from, ids, byId, at: Date.now() };
      writeCache(next);
      setResult(next);
    });
  }, [from, spots, ids, result, retry]);

  useEffect(
    () => () => {
      inFlight.current?.controller.abort();
      inFlight.current = null;
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    },
    []
  );

  if (!from) return null;
  if (fitsHere(result, from, ids)) return result.byId;
  return readCache(from, ids)?.byId ?? null;
}
