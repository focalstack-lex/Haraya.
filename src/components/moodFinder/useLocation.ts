import { useCallback, useEffect, useState } from 'react';
import type { GeoPoint } from '../../utils/geo';

/**
 * insecure: the page is not https (or localhost), so the browser refuses location before asking anyone.
 * denied: location is blocked for this site in the browser. unavailable: no fix, usually the phone's location is off.
 */
export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'insecure';

/**
 * Asks for the visitor's position only when request() is called (the "Near me" tap).
 * The position stays in memory: it is never stored or sent anywhere.
 * A caller that needs where the visitor is right now (the map) can refuse a cached fix with maximumAgeMs and ask
 * for GPS with highAccuracy; the GPS gets a longer timeout because a first fix can take a while indoors.
 * After a failure it tries again by itself when the visitor comes back to the page (from the phone's settings,
 * most likely) or the browser reports the site's location permission changed.
 */
export function useLocation({ maximumAgeMs = 5 * 60_000, highAccuracy = false }: { maximumAgeMs?: number; highAccuracy?: boolean } = {}) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const request = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude });
        setStatus('granted');
      },
      (error) => {
        setPosition(null);
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 20_000 : 10_000, maximumAge: maximumAgeMs }
    );
  }, [maximumAgeMs, highAccuracy]);

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

  return { position, status, request };
}
