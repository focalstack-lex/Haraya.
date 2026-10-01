import { useEffect, useRef, useState } from 'react';
import { trailLengthKm, type GeoPoint } from '../../utils/geo';
import { OFF_ROUTE_KM, progressAlongRoute } from './routeMath';
import { FOOT_ROUTER, routerCredit } from '../../config/routing';

/**
 * Street-following walking routes from the OSRM foot server (config/routing.ts: FOSSGIS unless configured).
 * Only the start and end coordinates of a walk are sent, and only while live navigation is running; nothing
 * is stored. Any failure returns null and the map falls back to the straight-line guide.
 */
const ROUTER = `${FOOT_ROUTER}/route/v1/foot`;
const TIMEOUT_MS = 8_000;
const MAX_POINTS = 5_000;
/** Minimum gap between two route requests, so a wandering walker cannot flood the free server. */
const REFETCH_COOLDOWN_MS = 20_000;

export const ROUTE_ATTRIBUTION = `Walking route: ${routerCredit(FOOT_ROUTER)}`;

export interface WalkingRoute {
  points: GeoPoint[];
  km: number;
}

const coord = (p: GeoPoint) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`;

export async function fetchWalkingRoute(from: GeoPoint, to: GeoPoint, signal: AbortSignal): Promise<WalkingRoute | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal.addEventListener('abort', onOuterAbort);
  try {
    const response = await fetch(`${ROUTER}/${coord(from)};${coord(to)}?overview=full&geometries=geojson`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { code?: unknown; routes?: { geometry?: { coordinates?: unknown } }[] };
    // Validate the shape before trusting external data
    const coordinates = body.code === 'Ok' ? body.routes?.[0]?.geometry?.coordinates : undefined;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > MAX_POINTS) {
      throw new Error('unexpected route shape');
    }
    const points: GeoPoint[] = [];
    for (const pair of coordinates) {
      if (!Array.isArray(pair) || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') {
        throw new Error('unexpected route point');
      }
      points.push({ lat: pair[1], lng: pair[0] });
    }
    return { points, km: trailLengthKm(points) };
  } catch (error) {
    if (!signal.aborted) console.warn('Haraya: walking route unavailable, using the straight-line guide', error);
    return null;
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', onOuterAbort);
  }
}

export type WalkingRouteStatus = 'idle' | 'loading' | 'ready' | 'failed';

/**
 * Keeps a street route from the visitor to the destination: fetched on the first GPS fix, fetched again
 * when the visitor strays more than OFF_ROUTE_KM from it (at most once per cooldown), cleared on a new target.
 */
export function useWalkingRoute(target: GeoPoint | null, here: GeoPoint | null) {
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [status, setStatus] = useState<WalkingRouteStatus>('idle');
  /** Length of the first route, so progress stays steady across reroutes. */
  const [totalKm, setTotalKm] = useState<number | null>(null);
  const lastRequest = useRef(0);
  const inFlight = useRef<AbortController | null>(null);

  // New destination: drop the old route and any request still running
  const targetKey = target ? coord(target) : null;
  useEffect(() => {
    setRoute(null);
    setStatus('idle');
    setTotalKm(null);
    lastRequest.current = 0;
    return () => {
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, [targetKey]);

  useEffect(() => {
    if (!target || !here || inFlight.current) return;
    const needsRoute = route === null || progressAlongRoute(route.points, here).offRouteKm > OFF_ROUTE_KM;
    if (!needsRoute || Date.now() - lastRequest.current < REFETCH_COOLDOWN_MS) return;

    lastRequest.current = Date.now();
    const controller = new AbortController();
    inFlight.current = controller;
    // A retry after a failure keeps showing the straight-line guide until a route arrives
    if (route === null) setStatus((current) => (current === 'idle' ? 'loading' : current));
    void fetchWalkingRoute(here, target, controller.signal).then((next) => {
      if (controller.signal.aborted) return;
      inFlight.current = null;
      if (next) {
        setRoute(next);
        setStatus('ready');
        setTotalKm((current) => current ?? next.km);
      } else if (route === null) {
        setStatus('failed');
      }
    });
  }, [target, here, route]);

  return { route, status, totalKm };
}
