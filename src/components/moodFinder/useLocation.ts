import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPoint } from '../../utils/geo';
import { GOOD_FIX_M, isBetterFix, REFINE_WINDOW_MS } from '../map/locationQuality';

/**
 * insecure: the page is not https (or localhost), so the browser refuses location before asking anyone.
 * denied: location is blocked for this site in the browser. unavailable: no fix, usually the phone's location is off.
 */
export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'insecure';

export interface LocatedPosition extends GeoPoint {
  /** Accuracy radius in metres, as the device reports it (see locationQuality.ts for what the sizes mean). */
  accuracy: number;
}

/**
 * Asks for the visitor's position only when request() is called (the "Near me" tap).
 * The position stays in memory: it is never stored or sent anywhere.
 * A caller that needs where the visitor is right now (the map) can refuse a cached fix with maximumAgeMs and ask
 * for GPS with highAccuracy. The first answer to a GPS request is usually the phone's last network fix, a
 * kilometre or two wide, with the real GPS fix following seconds later; so a GPS request listens on for a
 * while (REFINE_WINDOW_MS) and keeps the tightest fix, stopping early once one is within GOOD_FIX_M. `refining`
 * is true during that wait. Without highAccuracy the first fix is taken as is.
 * After a failure it tries again by itself when the visitor comes back to the page (from the phone's settings,
 * most likely) or the browser reports the site's location permission changed.
 */
export function useLocation({ maximumAgeMs = 5 * 60_000, highAccuracy = false }: { maximumAgeMs?: number; highAccuracy?: boolean } = {}) {
  const [position, setPosition] = useState<LocatedPosition | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [refining, setRefining] = useState(false);
  const watchId = useRef<number | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const best = useRef<LocatedPosition | null>(null);

  /** Stops listening and keeps whatever fix is held. */
  const settle = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    window.clearTimeout(settleTimer.current);
    settleTimer.current = undefined;
    setRefining(false);
  }, []);

  const request = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    settle();
    best.current = null;
    setStatus('locating');
    watchId.current = navigator.geolocation.watchPosition(
      (result) => {
        const next: LocatedPosition = { lat: result.coords.latitude, lng: result.coords.longitude, accuracy: result.coords.accuracy };
        if (isBetterFix(best.current, next)) {
          best.current = next;
          setPosition(next);
        }
        setStatus('granted');
        // Tight enough, or not a GPS request: done. Otherwise give the GPS a while to lock on.
        if (!highAccuracy || next.accuracy <= GOOD_FIX_M) {
          settle();
        } else if (settleTimer.current === undefined) {
          setRefining(true);
          settleTimer.current = window.setTimeout(settle, REFINE_WINDOW_MS);
        }
      },
      (error) => {
        // A timeout or a dropout after a fix only means the GPS went quiet for a moment: the fix held stays
        // good, and the listening goes on until the window closes in case a tighter fix still arrives
        if (best.current !== null && error.code !== error.PERMISSION_DENIED) return;
        settle();
        best.current = null;
        setPosition(null);
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 20_000 : 10_000, maximumAge: maximumAgeMs }
    );
  }, [maximumAgeMs, highAccuracy, settle]);

  // No GPS left running after the page that asked is gone
  useEffect(() => settle, [settle]);

  useEffect(() => {
    if (status !== 'denied' && status !== 'unavailable') return;
    const retry = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', retry);
    let permission: PermissionStatus | null = null;
    let active = true;
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (!active) return;
        permission = result;
        result.addEventListener('change', retry);
      })
      .catch(() => {});
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', retry);
      permission?.removeEventListener('change', retry);
    };
  }, [status, request]);

  return { position, status, refining, request };
}
