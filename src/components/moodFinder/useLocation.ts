import { useCallback, useEffect, useRef, useState } from 'react';
import { watchBestFix, type Fix } from '../../utils/bestFix';
import { GOOD_FIX_M, REFINE_WINDOW_MS } from '../../utils/locationQuality';

/**
 * insecure: the page is not https (or localhost), so the browser refuses location before asking anyone.
 * denied: location is blocked for this site in the browser. unavailable: no fix, usually the phone's location is off.
 */
export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'insecure';

/** A position with its accuracy radius in metres (see locationQuality.ts for what the sizes mean). */
export type LocatedPosition = Fix;

/**
 * Asks for the visitor's position only when request() is called (the "Near me" tap).
 * The position stays in memory: it is never stored or sent anywhere.
 * A caller that needs where the visitor is right now (the map) can refuse a cached fix with maximumAgeMs and ask
 * for GPS with highAccuracy. A GPS request listens on for a while (watchBestFix, REFINE_WINDOW_MS) and keeps the
 * tightest fix, stopping early once one is within GOOD_FIX_M; `refining` is true during that wait. Without
 * highAccuracy the first fix is taken as is.
 * After a failure it tries again by itself when the visitor comes back to the page (from the phone's settings,
 * most likely) or the browser reports the site's location permission changed.
 */
export function useLocation({ maximumAgeMs = 5 * 60_000, highAccuracy = false }: { maximumAgeMs?: number; highAccuracy?: boolean } = {}) {
  const [position, setPosition] = useState<LocatedPosition | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [refining, setRefining] = useState(false);
  const cancelFix = useRef<(() => void) | null>(null);

  /** Stops listening and keeps whatever fix is held. */
  const stop = useCallback(() => {
    cancelFix.current?.();
    cancelFix.current = null;
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
    stop();
    setStatus('locating');
    cancelFix.current = watchBestFix({
      highAccuracy,
      maximumAgeMs,
      timeoutMs: highAccuracy ? 20_000 : 10_000,
      windowMs: REFINE_WINDOW_MS,
      isGoodEnough: (fix) => !highAccuracy || fix.accuracy <= GOOD_FIX_M,
      onFix: (fix) => {
        setPosition(fix);
        setStatus('granted');
        setRefining(true);
      },
      onSettled: () => {
        cancelFix.current = null;
        setRefining(false);
      },
      onError: (failure) => {
        cancelFix.current = null;
        setRefining(false);
        setPosition(null);
        setStatus(failure);
      },
    });
  }, [maximumAgeMs, highAccuracy, stop]);

  // No GPS left running after the page that asked is gone
  useEffect(() => stop, [stop]);

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
