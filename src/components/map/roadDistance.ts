import { useEffect, useRef, useState } from 'react';
import { distanceKm, type GeoPoint } from '../../utils/geo';

/**
 * Road distance from the visitor to each spot, from the FOSSGIS OSRM table service (OpenStreetMap data, car
 * profile: the figure a maps app shows for directions). The straight line understates a drive by a quarter or
 * more, so the list says "by road" when this is in and "straight line" when it is not. One request per fix,
 * carrying the visitor's position and the spot coordinates; nothing is stored. Any failure returns null and
 * the list falls back to the straight line.
 */
const ROUTER = 'https://routing.openstreetmap.de/routed-car/table/v1/driving';
const TIMEOUT_MS = 8_000;
/** The public table service takes up to 100 coordinates, the visitor being one; the nearest spots go first. */
export const MAX_SPOTS = 60;
/** A move shorter than this keeps the distances already fetched. */
export const REFETCH_AFTER_KM = 0.25;

/** Short, so the map credits still fit one line on a phone. */
export const ROAD_DISTANCE_ATTRIBUTION = 'Roads: OSRM/FOSSGIS';

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

/**
 * Kilometres by road from the visitor to each spot, by spot id, or null until the router answers (and when it
 * cannot). Fetched again only when the visitor moves more than REFETCH_AFTER_KM or the catalog changes; a
 * filter on the list does not refetch, so pass every spot, not the filtered ones.
 */
export function useRoadDistances<T extends GeoPoint & { id: string }>(from: GeoPoint | null, spots: T[]): ReadonlyMap<string, number> | null {
  const [byId, setById] = useState<ReadonlyMap<string, number> | null>(null);
  const fetched = useRef<{ origin: GeoPoint; ids: string } | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const ids = spots.map((spot) => spot.id).join(',');

  useEffect(() => {
    if (!from || spots.length === 0) return;
    const last = fetched.current;
    if (last && last.ids === ids && distanceKm(last.origin, from) < REFETCH_AFTER_KM) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    fetched.current = { origin: from, ids };
    const targets = pickNearest(spots, from);
    void fetchRoadDistances(from, targets, controller.signal).then((metres) => {
      if (controller.signal.aborted) return;
      inFlight.current = null;
      if (!metres) {
        // Nothing to show for this position; the next fix or catalog change asks again
        fetched.current = null;
        setById(null);
        return;
      }
      const next = new Map<string, number>();
      metres.forEach((m, index) => {
        if (m !== null) next.set(targets[index].id, m / 1000);
      });
      setById(next);
    });
  }, [from, spots, ids]);

  useEffect(
    () => () => {
      inFlight.current?.abort();
      inFlight.current = null;
    },
    []
  );

  return byId;
}
