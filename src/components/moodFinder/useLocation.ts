import { useCallback, useState } from 'react';
import type { GeoPoint } from '../../utils/geo';

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

/**
 * Asks for the visitor's position only when request() is called (the "Near me" tap).
 * The position stays in memory: it is never stored or sent anywhere.
 * A caller that needs where the visitor is right now (the map) can refuse a cached fix with maximumAgeMs and ask
 * for GPS with highAccuracy; the GPS gets a longer timeout because a first fix can take a while indoors.
 */
export function useLocation({ maximumAgeMs = 5 * 60_000, highAccuracy = false }: { maximumAgeMs?: number; highAccuracy?: boolean } = {}) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const request = useCallback(() => {
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

  return { position, status, request };
}
