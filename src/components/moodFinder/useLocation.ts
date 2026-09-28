import { useCallback, useState } from 'react';
import type { GeoPoint } from '../../utils/geo';

export type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

/**
 * Asks for the visitor's position only when request() is called (the "Near me" tap).
 * The position stays in memory: it is never stored or sent anywhere.
 */
export function useLocation() {
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
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }, []);

  return { position, status, request };
}
