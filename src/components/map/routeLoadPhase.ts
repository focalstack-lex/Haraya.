import type { LiveNavStatus } from './useLiveNavigation';
import type { WalkingRouteStatus } from './walkingRoute';

/** What the walk is still waiting for before the first route can be drawn; null once there is nothing to wait for. */
export type RouteLoadPhase = 'locating' | 'routing' | null;

/** The loader stays at least this long, so a fast answer does not flash it on and off. */
export const MIN_LOADER_MS = 600;

/**
 * The first wait of a walk: the GPS fix, then the street route. A route that arrived or failed ends it (a failure
 * falls back to the straight-line guide), and so does arriving or losing location. A reroute never brings it back,
 * because the walking route keeps its 'ready' status while the next one is fetched.
 */
export function routeLoadPhase(hasTarget: boolean, navStatus: LiveNavStatus, hasPosition: boolean, walkStatus: WalkingRouteStatus): RouteLoadPhase {
  if (!hasTarget) return null;
  if (navStatus === 'arrived' || navStatus === 'denied' || navStatus === 'unavailable') return null;
  if (navStatus === 'idle' || navStatus === 'locating' || !hasPosition) return 'locating';
  if (walkStatus === 'idle' || walkStatus === 'loading') return 'routing';
  return null;
}
