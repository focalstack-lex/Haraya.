/**
 * Street routing servers (OSRM HTTP API). Haraya asks them for walking routes (live navigation, walkingRoute.ts)
 * and road distances (the map's list, roadDistance.ts).
 *
 * The defaults are the FOSSGIS public servers at routing.openstreetmap.de: free and keyless, but a community
 * service with a fair-use policy and no uptime promise. For real traffic, run an OSRM server (one foot profile,
 * one car profile) or use a compatible host, and set VITE_ROUTING_FOOT_URL and VITE_ROUTING_CAR_URL at build
 * time to their base URLs (the part before /route/v1). The new host must also be added to connect-src in
 * vercel.json, or the browser blocks the requests. When a server fails, the map falls back to straight lines.
 */

const FOSSGIS = 'https://routing.openstreetmap.de';

/** A configured base URL, or the fallback when it is unset or not an http(s) URL. Trailing slashes dropped. */
export function routerBase(configured: unknown, fallback: string): string {
  if (typeof configured !== 'string' || !/^https?:\/\/[^\s/]+/i.test(configured.trim())) return fallback;
  return configured.trim().replace(/\/+$/, '');
}

/** Short credit for the map's attribution line: the FOSSGIS servers ask to be named. */
export const routerCredit = (base: string): string => (base.startsWith(`${FOSSGIS}/`) ? 'OSRM/FOSSGIS' : 'OSRM');

export const FOOT_ROUTER = routerBase(import.meta.env.VITE_ROUTING_FOOT_URL, `${FOSSGIS}/routed-foot`);
export const CAR_ROUTER = routerBase(import.meta.env.VITE_ROUTING_CAR_URL, `${FOSSGIS}/routed-car`);
